import { NextResponse } from 'next/server';
import { parsePDF, parseCSV, parseExcel, parseDate } from '@/lib/parser';
import { categorizeTransactions } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

// Helper to sanitize and format a transaction for Supabase
const sanitizeTransaction = (raw: any, userEmail: string, bankName: string, uploadId: string) => {
    // Helper to find key case-insensitively
    const findKey = (pattern: RegExp) => Object.keys(raw).find(k => pattern.test(k));

    // 1. Date
    const dateKey = findKey(/date/i);
    const rawDate = raw[dateKey || ''] || raw['Date'];
    const parsedDate = parseDate(rawDate);
    const dateStr = parsedDate ? parsedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // 2. Description
    const descKey = findKey(/narration|description|particulars/i);
    const description = raw[descKey || ''] || raw['Description'] || 'No Description';

    // 3. Amount & Type
    const parseVal = (v: any) => {
        if (typeof v === 'number') return v;
        if (!v) return 0;
        // Remove commas and currency symbols if any
        return parseFloat(String(v).replace(/,/g, '').replace(/[^\d.-]/g, '')) || 0;
    };

    const withdrawalKey = findKey(/withdrawal|debit|dr/i);
    const depositKey = findKey(/deposit|credit|cr/i);
    const amountKey = findKey(/^amount$/i);

    let amount = 0;
    let type = 'expense';

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
        if (val < 0) type = 'expense';
        else type = 'income'; // Default to income if positive and single column? Or expense? 
        // Let's assume expense if we can't tell, to be safe? No, let's default to expense.
    }

    return {
        id: raw.id ?? randomUUID(),
        user_email: userEmail,
        date: dateStr,
        description: description,
        amount: amount,
        type: type,
        category: raw.category || 'Uncategorized',
        merchant_name: raw.merchant_name || '',
        bank_name: bankName || raw.bank_name || '',
        upload_id: uploadId,
    };
};

// Helper to upsert transactions
const storeTransactions = async (transactions: any[], userEmail: string, bankName: string, fileName: string) => {
    // 1. Create Upload Record
    const uploadId = randomUUID();

    // Try to insert into uploads table. If it fails (e.g. table doesn't exist yet), we proceed without upload_id
    // to maintain backward compatibility until migration is run.
    try {
        const { error: uploadError } = await supabase.from('uploads').insert({
            id: uploadId,
            user_email: userEmail,
            file_name: fileName,
            bank_name: bankName,
            transaction_count: transactions.length,
            status: 'completed'
        });

        if (uploadError) {
            console.warn('Failed to create upload record (table might be missing):', uploadError.message);
            // If we can't create upload record, we might still want to save transactions but without upload_id?
            // Or should we fail? For now, let's log and proceed, passing uploadId anyway.
            // If the column 'upload_id' is missing in transactions, the next insert will fail or ignore it depending on strictness.
        }
    } catch (e) {
        console.warn('Error creating upload record:', e);
    }

    const sanitized = transactions.map(t => sanitizeTransaction(t, userEmail, bankName, uploadId));

    // Batch upserts to avoid request size limits (Supabase/PostgREST limit)
    const BATCH_SIZE = 1000;
    for (let i = 0; i < sanitized.length; i += BATCH_SIZE) {
        const batch = sanitized.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase.from('transactions').upsert(batch);
        if (error) {
            console.error('Supabase upsert error:', error);
            // If error is about missing column 'upload_id', retry without it
            if (error.message?.includes('upload_id')) {
                console.warn('Retrying without upload_id...');
                const batchNoUploadId = batch.map((t: any) => {
                    const { upload_id, ...rest } = t;
                    return rest;
                });
                const { error: retryError } = await supabase.from('transactions').upsert(batchNoUploadId);
                if (retryError) throw retryError;
            } else {
                throw error;
            }
        }
    }
    return sanitized; // Return processed data
};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const userEmail = (formData.get('email') as string) ?? 'unknown@example.com';
        const bankName = (formData.get('bankAccount') as string) ?? '';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        console.log(`📤 Upload started: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);

        // 1. Fetch DB Rules (The Memory Bank)
        let dbKeywords: Record<string, string[]> = {};
        try {
            const { data: dbRules, error } = await supabase
                .from('merchant_rules')
                .select('keyword, category')
                .eq('user_email', userEmail);

            if (!error && dbRules) {
                dbRules.forEach(r => {
                    if (!dbKeywords[r.category]) dbKeywords[r.category] = [];
                    dbKeywords[r.category].push(r.keyword);
                });
                console.log(`🧠 Loaded ${dbRules.length} merchant rules from Memory Bank`);
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
                try {
                    const { error } = await supabase.from('merchant_rules').upsert(newRulesToInsert, { onConflict: 'user_email, keyword' });
                    if (!error) console.log(`🧠 Saved ${newRulesToInsert.length} new merchant rules`);
                } catch (err) {
                    // Silent fail
                }
            }
        };

        // ---------- PDF ----------
        if (file.type === 'application/pdf') {
            console.time('⏱️  PDF parsing');
            const rawText = await parsePDF(buffer);
            console.timeEnd('⏱️  PDF parsing');

            const pdfTransactions = [{
                description: rawText,
                date: new Date().toISOString().split('T')[0],
                amount: 0,
            }];

            console.time('🤖 AI categorization');
            const { results: transactions, newlyLearnedKeywords } = await categorizeTransactions(pdfTransactions, learnedKeywords);
            console.timeEnd('🤖 AI categorization');

            await saveNewRules(newlyLearnedKeywords);
            await storeTransactions(transactions, userEmail, bankName, file.name);
            return NextResponse.json({ transactions, newlyLearnedKeywords });
        }

        // ---------- CSV ----------
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            const text = buffer.toString('utf-8');
            console.time('⏱️  CSV parsing');
            const rawTransactions = await parseCSV(text);
            console.timeEnd('⏱️  CSV parsing');

            console.time('🤖 AI categorization');
            const { results: categorized, newlyLearnedKeywords } = await categorizeTransactions(rawTransactions, learnedKeywords);
            console.timeEnd('🤖 AI categorization');

            await saveNewRules(newlyLearnedKeywords);

            const transactions = rawTransactions.map((t, i) => ({
                ...t,
                category: categorized[i]?.category ?? 'Uncategorized',
                merchant_name: categorized[i]?.merchant_name ?? t.merchant_name,
            }));

            await storeTransactions(transactions, userEmail, bankName, file.name);
            return NextResponse.json({ transactions, newlyLearnedKeywords });
        }

        // ---------- EXCEL ----------
        if (
            file.type === 'application/vnd.ms-excel' ||
            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.name.endsWith('.xls') ||
            file.name.endsWith('.xlsx')
        ) {
            console.time('⏱️  Excel parsing');
            const rawTransactions = await parseExcel(buffer);
            console.timeEnd('⏱️  Excel parsing');

            console.time('🤖 AI categorization');
            const { results: categorized, newlyLearnedKeywords } = await categorizeTransactions(rawTransactions, learnedKeywords);
            console.timeEnd('🤖 AI categorization');

            await saveNewRules(newlyLearnedKeywords);

            const transactions = rawTransactions.map((t, i) => ({
                ...t,
                category: categorized[i]?.category ?? 'Uncategorized',
                merchant_name: categorized[i]?.merchant_name ?? t.merchant_name,
            }));

            await storeTransactions(transactions, userEmail, bankName, file.name);
            return NextResponse.json({ transactions, newlyLearnedKeywords });
        }

        // ---------- UNSUPPORTED ----------
        console.warn('Unsupported file type:', file.type);
        return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: `Failed to process file: ${(error as Error).message}` }, { status: 500 });
    }
}
