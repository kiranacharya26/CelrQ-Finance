import { NextResponse } from 'next/server';
import { parseCSV, parseExcel, parseDate, parsePDF } from '@/lib/parser';
import { categorizeTransactions } from '@/lib/categorizer';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomUUID } from 'crypto';

function md5Hex(input: string) {
    return createHash('md5').update(input).digest('hex');
}

export const runtime = 'nodejs';

// Helper to sanitize and format a transaction for Supabase
const sanitizeTransaction = (raw: any, userEmail: string, bankName: string, uploadId: string) => {
    // Helper to find key case-insensitively
    const findKey = (pattern: RegExp) => Object.keys(raw).find(k => pattern.test(k));

    // 1. Date
    const dateKey = findKey(/\bdate\b/i);
    const rawDate = raw[dateKey || ''] || raw['Date'];
    const parsedDate = parseDate(rawDate);
    const dateStr = parsedDate ? parsedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // 2. Description
    const descKey = findKey(/\b(narration|description|particulars|details|remarks)\b/i);
    const description = raw[descKey || ''] || raw['Description'] || 'No Description';

    // 3. Amount & Type
    const parseVal = (v: any) => {
        if (typeof v === 'number') return v;
        if (!v) return 0;
        // Remove commas and currency symbols if any
        return parseFloat(String(v).replace(/,/g, '').replace(/[^\d.-]/g, '')) || 0;
    };

    const withdrawalKey = findKey(/\b(withdrawal|debit|dr)\b/i);
    const depositKey = findKey(/\b(deposit|credit|cr)\b/i);
    const amountKey = findKey(/^amount$/i);

    let amount = 0;
    let type: 'income' | 'expense' = 'expense';

    const withdrawal = withdrawalKey ? parseVal(raw[withdrawalKey]) : 0;
    const deposit = depositKey ? parseVal(raw[depositKey]) : 0;

    if (deposit > 0) {
        amount = deposit;
        type = 'income';
    } else if (withdrawal > 0) {
        amount = withdrawal;
        type = 'expense';
    } else if (amountKey) {
        const val = parseVal(raw[amountKey]);
        amount = Math.abs(val);

        // Check if we have an explicit type field
        const typeKey = findKey(/type|d\/c/i);
        const rawType = typeKey ? String(raw[typeKey]).toLowerCase() : '';

        if (val < 0) {
            type = 'expense';
        } else if (rawType.includes('expense') || rawType.includes('debit') || rawType.includes('dr') || rawType === 'd') {
            type = 'expense';
        } else if (rawType.includes('income') || rawType.includes('credit') || rawType.includes('cr') || rawType === 'c') {
            type = 'income';
        } else {
            // Default to expense if we can't tell (safer assumption for bank statements usually)
            // But wait, usually positive amount without type means credit? 
            // Actually, for PDF parser we explicitly return 'type'.
            // For CSVs with single amount column, usually negative is expense.
            // If it's positive and no type, it's ambiguous.
            // Let's default to income if positive and no type, BUT if we have type, use it.
            type = 'income';
        }
    }

    // 4. Generate a stable ID (Fingerprint) for deduplication
    // We try to find a unique reference number from the bank first
    const refKey = findKey(/ref|txn id|transaction id|chq|cheque|reference/i);
    const refValue = refKey ? String(raw[refKey]).trim() : '';

    // If no bank ref, we create a fingerprint: Date + Description + Amount + Bank
    // This ensures that if the same transaction is uploaded in different files, it has the same ID.
    const fingerprint = md5Hex(`${userEmail}-${dateStr}-${description}-${amount}-${bankName}-${refValue}`);

    // We use a UUID-v4 format for the ID to keep it consistent with the schema
    // but derived from our fingerprint hash.
    const stableId = `${fingerprint.slice(0, 8)}-${fingerprint.slice(8, 12)}-4${fingerprint.slice(13, 16)}-a${fingerprint.slice(17, 20)}-${fingerprint.slice(20, 32)}`;

    return {
        id: raw.id || stableId,
        user_email: userEmail,
        date: dateStr,
        description: description,
        amount: amount,
        type: type,
        category: raw.category || 'Other',
        merchant_name: raw.merchant_name || '',
        bank_name: bankName || raw.bank_name || '',
        upload_id: uploadId,
    };
};

// Helper to upsert transactions
const storeTransactions = async (transactions: any[], userEmail: string, bankName: string, fileName: string, fileHash: string, uploadId?: string) => {
    // 1. Create Upload Record
    if (!uploadId) uploadId = randomUUID();

    const { error: uploadError } = await supabaseAdmin.from('uploads').insert({
        id: uploadId,
        user_email: userEmail,
        file_name: fileName,
        file_hash: fileHash,
        bank_name: bankName,
        transaction_count: transactions.length,
        processed_count: 0,
        status: 'processing'
    });

    if (uploadError) {
        console.error('Failed to create upload record:', uploadError);
        throw new Error(`Failed to create upload record: ${uploadError.message}`);
    }

    // 2. Fetch existing manual categorizations to preserve them
    let manualCategories = new Map<string, { category: string }>();
    try {
        const { data: existingManual } = await supabaseAdmin
            .from('transactions')
            .select('id, category')
            .eq('user_email', userEmail)
            .eq('is_manual_category', true);

        if (existingManual) {
            existingManual.forEach((t: any) => manualCategories.set(t.id, { category: t.category }));
        }
    } catch (e) {
        console.warn('Error fetching manual categories:', e);
    }

    const sanitized = transactions.map((t: any) => {
        const s = sanitizeTransaction(t, userEmail, bankName, uploadId);

        // If we have a manual category for this transaction ID, preserve it
        if (manualCategories.has(s.id)) {
            const manual = manualCategories.get(s.id)!;
            return {
                ...s,
                category: manual.category,
                is_manual_category: true
            };
        }
        return s;
    });

    // 3. Deduplicate sanitized transactions to prevent PostgreSQL "ON CONFLICT" errors
    // if multiple transactions in the same batch have the same ID.
    const deduplicatedMap = new Map<string, any>();
    sanitized.forEach(t => {
        if (t.id) {
            deduplicatedMap.set(t.id.toLowerCase(), t);
        }
    });
    const deduplicated = Array.from(deduplicatedMap.values());

    // 4. Batch upserts
    const BATCH_SIZE = 1000;
    for (let i = 0; i < deduplicated.length; i += BATCH_SIZE) {
        const batch = deduplicated.slice(i, i + BATCH_SIZE);
        console.log(`💾 Upserting batch of ${batch.length} transactions...`);

        // Log a sample transaction from the first batch to help debug
        if (i === 0 && batch.length > 0) {
            console.log('📋 Sample transaction being stored:', JSON.stringify({
                id: batch[0].id,
                date: batch[0].date,
                description: batch[0].description?.substring(0, 50),
                amount: batch[0].amount,
                type: batch[0].type,
                category: batch[0].category,
                merchant_name: batch[0].merchant_name,
                bank_name: batch[0].bank_name
            }, null, 2));
        }

        // Final safety check for duplicate IDs in the batch
        const idsInBatch = batch.map((t: any) => t.id);
        const uniqueIdsInBatch = new Set(idsInBatch);
        if (idsInBatch.length !== uniqueIdsInBatch.size) {
            console.error('❌ CRITICAL: Duplicate IDs found in batch despite deduplication!', {
                total: idsInBatch.length,
                unique: uniqueIdsInBatch.size
            });
            // Find duplicates for logging
            const seen = new Set();
            const dups = idsInBatch.filter(id => {
                if (seen.has(id)) return true;
                seen.add(id);
                return false;
            });
            console.error('Duplicate IDs:', dups);
        }

        const { error } = await supabaseAdmin.from('transactions').upsert(batch, { onConflict: 'id' });

        if (error) {
            console.error('❌ Supabase transactions upsert error:', error);
            // Fallback: Retry without upload_id if column is missing
            if (error.message?.includes('upload_id')) {
                console.warn('⚠️ Retrying without upload_id...');
                const batchNoUploadId = batch.map(({ upload_id, ...rest }: any) => rest);
                const { error: retryError } = await supabaseAdmin.from('transactions').upsert(batchNoUploadId);
                if (retryError) throw retryError;
            } else {
                throw error;
            }
        }
        console.log(`✅ Batch upserted successfully`);
    }

    // 4. Finalize Upload Record
    try {
        await supabaseAdmin.from('uploads').update({
            status: 'completed',
            processed_count: transactions.length
        }).eq('id', uploadId);
    } catch (e) { }

    return sanitized;
};

export async function POST(request: Request) {
    try {
        const { getServerSession } = await import('next-auth');
        const { authOptions } = await import('@/lib/auth');
        const { checkRateLimit } = await import('@/lib/rate-limit');
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate Limit: 10 uploads per hour
        const { allowed } = await checkRateLimit(session.user.email, 'categorization', 10, 1);
        if (!allowed) {
            return NextResponse.json({
                error: 'Upload limit reached. Please try again in an hour.'
            }, { status: 429 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const userEmail = session.user.email; // Use session email for security
        const bankName = (formData.get('bankAccount') as string) ?? '';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        console.log(`📤 Upload started: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
        }

        // Calculate MD5 hash of the file content
        const fileHash = md5Hex(buffer.toString('binary'));
        console.log(`🔐 File Hash: ${fileHash}`);

        const uploadId = randomUUID();

        // --- RESUME CHECK DISABLED ---
        // We disable this to ensure users get the latest AI categorization logic 
        // even if they re-upload the same file.
        /*
        try {
            const { data: existingUpload } = await supabase
                .from('uploads')
                .select('id, status')
                .eq('user_email', userEmail)
                .eq('file_hash', fileHash)
                .eq('status', 'completed')
                .single();

            if (existingUpload) {
                const { data: existingTransactions } = await supabaseAdmin
                    .from('transactions')
                    .select('*')
                    .eq('upload_id', existingUpload.id);

                if (existingTransactions && existingTransactions.length > 0) {
                    // 6. Finalize Upload Record
    await supabaseAdmin.from('uploads').update({ status: 'completed', processed_count: sanitized.length }).eq('id', uploadId);

    return NextResponse.json({
                        transactions: existingTransactions,
                        newlyLearnedKeywords: {},
                        message: "File content already uploaded. Returned existing data."
                    });
                }
            }
        } catch (e) {}
        */
        // -----------------------------------------------------------------------

        // 0. Ensure Trial Started Record Exists
        // We use a special payment record to track trial start permanently
        try {
            const adminSupabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const trialOrderId = `trial_${userEmail}`;

            // Check if trial record exists
            const { data: existingTrial } = await adminSupabase
                .from('payments')
                .select('id')
                .eq('order_id', trialOrderId)
                .single();

            if (!existingTrial) {
                // Fetch user ID for the email
                // Note: In a real app, we should pass userId from frontend, but here we can try to find it or use a placeholder
                // Since we don't have easy access to auth.users from here without admin API which might be restricted
                // We'll try to use the user_id from the session if passed, or fallback to email as ID if allowed by schema (schema says user_id is TEXT)
                // Let's try to get user by email if possible, or just use email as user_id for this special record

                // Actually, let's just use the email as user_id for the trial record if we can't get the real ID.
                // But wait, the payments table has user_id as TEXT.

                await adminSupabase.from('payments').insert({
                    order_id: trialOrderId,
                    user_id: userEmail, // Fallback, ideally should be UUID but schema is TEXT
                    email: userEmail,
                    amount: 0,
                    currency: 'INR',
                    status: 'TRIAL_STARTED',
                    payment_method: 'system',
                    metadata: { type: 'trial_start', created_via: 'upload_api' }
                });
                console.log(`🆕 Trial started record created for ${userEmail}`);
            }
        } catch (e) {
            console.warn('Failed to create trial record:', e);
            // Don't block upload if this fails
        }

        // 1. Fetch DB Rules (The Memory Bank)
        let dbKeywords: Record<string, string[]> = {};
        try {
            const { data: dbRules, error } = await supabaseAdmin
                .from('merchant_rules')
                .select('keyword, category')
                .eq('user_email', userEmail);

            if (!error && dbRules) {
                dbRules.forEach((r: any) => {
                    if (!dbKeywords[r.category]) dbKeywords[r.category] = [];
                    dbKeywords[r.category].push(r.keyword);
                });
            }
        } catch (err) {
            // Silent fail - table might not exist yet
        }

        const learnedKeywordsStr = formData.get('learnedKeywords') as string;
        const learnedKeywords = learnedKeywordsStr ? JSON.parse(learnedKeywordsStr) : {};

        // Merge DB keywords into learnedKeywords
        Object.entries(dbKeywords).forEach(([cat, keys]) => {
            if (!learnedKeywords[cat]) learnedKeywords[cat] = [];
            keys.forEach(k => {
                if (!learnedKeywords[cat].includes(k)) learnedKeywords[cat].push(k);
            });
        });

        // Helper to save new rules back to DB
        const saveNewRules = async (newlyLearned: Record<string, string[]>) => {
            const newRulesToInsert: any[] = [];
            Object.entries(newlyLearned).forEach(([cat, keys]) => {
                (keys as string[]).forEach(k => {
                    newRulesToInsert.push({
                        user_email: userEmail,
                        keyword: k,
                        category: cat
                    });
                });
            });

            if (newRulesToInsert.length > 0) {
                // Deduplicate rules by user_email and keyword (case-insensitive and trimmed)
                const uniqueRulesMap = new Map<string, any>();
                newRulesToInsert.forEach(rule => {
                    const normalizedKeyword = rule.keyword.trim().toLowerCase();
                    uniqueRulesMap.set(`${rule.user_email}-${normalizedKeyword}`, {
                        ...rule,
                        keyword: normalizedKeyword
                    });
                });
                const uniqueRules = Array.from(uniqueRulesMap.values());

                try {
                    console.log(`🧠 Upserting ${uniqueRules.length} merchant rules...`);
                    const { error } = await supabaseAdmin.from('merchant_rules').upsert(uniqueRules, { onConflict: 'user_email, keyword' });
                    if (error) {
                        console.error('❌ Merchant rules upsert error:', error);
                    } else {
                        console.log(`✅ Saved ${uniqueRules.length} new merchant rules`);
                    }
                } catch (err) {
                    console.error('❌ Merchant rules exception:', err);
                }
            }
        };

        // 2. Parse and Pre-process
        let rawTransactions: any[] = [];

        // PDF Support Removed as per user request to fix 502 errors
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            rawTransactions = await parseCSV(buffer.toString('utf-8'));
        } else if (
            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.type === 'application/vnd.ms-excel' ||
            file.name.endsWith('.xlsx') ||
            file.name.endsWith('.xls')
        ) {
            rawTransactions = await parseExcel(buffer);
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            console.log('📄 PDF detected. Using AI extraction...');
            rawTransactions = await parsePDF(buffer);
        } else {
            console.warn('Unsupported file type:', file.type);
            return NextResponse.json({ error: `Unsupported file type: ${file.type}. Only CSV, Excel, and PDF are supported.` }, { status: 400 });
        }

        console.log(`📊 Parsed ${rawTransactions.length} raw transactions from file`);

        // Log a sample of the raw data to help debug
        if (rawTransactions.length > 0) {
            console.log('📋 Sample raw transaction:', JSON.stringify(rawTransactions[0], null, 2));
        }

        // 3. Fingerprint and Check for Manual Overrides
        // This saves AI cost by skipping transactions the user already manually categorized
        const fingerprinted = rawTransactions.map(t => {
            const s = sanitizeTransaction(t, userEmail, bankName, uploadId);
            return { ...t, id: s.id, category: s.category };
        });

        // Deduplicate in-memory to prevent duplicate IDs in the same batch
        const uniqueMap = new Map<string, any>();
        fingerprinted.forEach(t => uniqueMap.set(t.id, t));
        const processedWithIds = Array.from(uniqueMap.values());

        const transactionIds = processedWithIds.map(t => t.id);
        let manualOverrides = new Map<string, string>();

        try {
            const { data: existingManual } = await supabaseAdmin
                .from('transactions')
                .select('id, category')
                .eq('user_email', userEmail)
                .eq('is_manual_category', true)
                .in('id', transactionIds);

            if (existingManual) {
                existingManual.forEach((t: any) => manualOverrides.set(t.id, t.category));
            }
        } catch (e) {
            console.warn('Error fetching manual overrides:', e);
        }

        // Apply manual overrides
        const transactionsWithOverrides = processedWithIds.map(t => {
            if (manualOverrides.has(t.id)) {
                return { ...t, category: manualOverrides.get(t.id), is_manual_category: true };
            }
            return t;
        });

        // 4. Store transactions IMMEDIATELY with basic categories
        console.log('💾 Storing transactions immediately...');
        await storeTransactions(transactionsWithOverrides, userEmail, bankName, file.name, fileHash, uploadId);

        // 5. Process AI categorization with timeout protection
        console.log('🤖 Starting AI categorization with timeout protection...');
        console.log(`📊 Processing ${transactionsWithOverrides.length} transactions for AI categorization`);

        // Set a timeout to prevent 502 errors (30 seconds max for AI processing)
        const AI_TIMEOUT = 30000; // 30 seconds
        const startTime = Date.now();

        try {
            // Properly sanitize all transactions for AI processing
            const sanitizedForAI = transactionsWithOverrides.map(t =>
                sanitizeTransaction(t, userEmail, bankName, uploadId)
            );

            console.log(`📋 Sanitized ${sanitizedForAI.length} transactions for AI`);

            // Use Promise.race to enforce timeout
            const aiPromise = categorizeTransactions(
                sanitizedForAI,
                learnedKeywords,
                userEmail,
                uploadId
            );

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('AI_TIMEOUT')), AI_TIMEOUT)
            );

            const { results: categorized, newlyLearnedKeywords } = await Promise.race([
                aiPromise,
                timeoutPromise
            ]);

            const elapsedTime = Date.now() - startTime;
            console.log(`✅ AI categorization completed in ${(elapsedTime / 1000).toFixed(2)}s`);
            console.log(`✅ AI categorization returned ${categorized.length} results`);

            // Create a map of sanitized transactions by ID for quick lookup
            const sanitizedMap = new Map();
            sanitizedForAI.forEach(t => {
                sanitizedMap.set(t.id, t);
            });

            // Update transactions with AI categories
            const aiUpdates = categorized.map((t: any) => {
                if (!t.id) {
                    console.warn(`⚠️ Missing ID in AI result`);
                    return null;
                }
                const original = sanitizedMap.get(t.id);
                if (!original) {
                    console.warn(`⚠️ Could not find original transaction for ID: ${t.id}`);
                    return null;
                }
                // Include ALL required fields from original to prevent null constraint violations
                return {
                    id: t.id,
                    user_email: original.user_email,
                    date: original.date,
                    description: original.description,
                    amount: original.amount,
                    type: original.type,
                    bank_name: original.bank_name,
                    upload_id: original.upload_id,
                    category: t.category || 'Other',
                    merchant_name: t.merchant_name || original.merchant_name || ''
                };
            }).filter(Boolean); // Remove null entries

            console.log(`💾 Updating ${aiUpdates.length} transactions with AI categories...`);

            // Log first few updates to see what we're sending
            if (aiUpdates.length > 0) {
                console.log('📋 Sample AI updates (first 3):', JSON.stringify(aiUpdates.slice(0, 3).map(u => ({
                    id: u?.id,
                    category: u?.category,
                    merchant_name: u?.merchant_name
                })), null, 2));
            }

            // Use batch UPDATE for better performance
            const validUpdates = aiUpdates.filter((u): u is NonNullable<typeof u> => u !== null);

            // Batch update in chunks of 50 for speed
            const UPDATE_BATCH_SIZE = 50;
            for (let i = 0; i < validUpdates.length; i += UPDATE_BATCH_SIZE) {
                const batch = validUpdates.slice(i, i + UPDATE_BATCH_SIZE);

                await Promise.all(batch.map(update =>
                    supabaseAdmin
                        .from('transactions')
                        .update({
                            category: update.category,
                            merchant_name: update.merchant_name
                        })
                        .eq('id', update.id)
                ));

                if (i % 100 === 0) {
                    console.log(`⏳ Progress: ${i}/${validUpdates.length} updated...`);
                }
            }

            console.log(`✅ Successfully updated: ${validUpdates.length} transactions`);

            await saveNewRules(newlyLearnedKeywords);
            console.log('✅ AI categorization complete');

            // Update upload status to show AI processing is complete
            await supabaseAdmin.from('uploads').update({
                status: 'ai_complete',
                processed_count: transactionsWithOverrides.length
            }).eq('id', uploadId);

            // Return success with complete data
            return NextResponse.json({
                transactions: categorized,
                newlyLearnedKeywords,
                message: 'Upload and AI categorization completed successfully!',
                uploadId
            });

        } catch (error) {
            const isTimeout = (error as Error).message === 'AI_TIMEOUT';

            if (isTimeout) {
                console.warn('⚠️ AI categorization timed out - returning partial results');

                // Update upload status
                await supabaseAdmin.from('uploads').update({
                    status: 'completed',
                    processed_count: transactionsWithOverrides.length
                }).eq('id', uploadId);

                // Return success with basic categories - AI will be retried on next page load
                return NextResponse.json({
                    transactions: transactionsWithOverrides.map(t =>
                        sanitizeTransaction(t, userEmail, bankName, uploadId)
                    ),
                    message: 'Upload successful! Transactions stored with basic categories. AI categorization will continue in the background.',
                    uploadId,
                    status: 'processing'
                });
            }

            console.error('❌ AI categorization failed:', error);
            console.error('Error stack:', (error as Error).stack);

            // Update upload status to show error
            try {
                await supabaseAdmin.from('uploads').update({
                    status: 'ai_failed',
                    processed_count: transactionsWithOverrides.length
                }).eq('id', uploadId);
            } catch (updateError) {
                console.error('❌ Failed to update upload status:', updateError);
            }

            // Return partial success - data is stored but AI failed
            return NextResponse.json({
                transactions: transactionsWithOverrides.map(t =>
                    sanitizeTransaction(t, userEmail, bankName, uploadId)
                ),
                message: 'Upload successful but AI categorization failed. Transactions stored with default categories.',
                uploadId,
                warning: 'AI categorization failed'
            });
        }

    } catch (error) {
        console.error('Upload error:', error);
        const isDev = process.env.NODE_ENV === 'development';
        return NextResponse.json({
            error: isDev ? `Failed to process file: ${(error as Error).message}` : 'Failed to process file. Please try again later.'
        }, { status: 500 });
    }
}
