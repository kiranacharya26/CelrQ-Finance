import { NextResponse } from 'next/server';
import { parsePDF, parseCSV, parseExcel, parseDate } from '@/lib/parser';
import { categorizeTransactions } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

// Helper to sanitize and format a transaction for Supabase
const sanitizeTransaction = (raw: any, userEmail: string, bankName: string) => {
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
    };
};

// Helper to upsert transactions
const storeTransactions = async (transactions: any[], userEmail: string, bankName: string) => {
    const sanitized = transactions.map(t => sanitizeTransaction(t, userEmail, bankName));

    // Batch upserts to avoid request size limits (Supabase/PostgREST limit)
    const BATCH_SIZE = 1000;
    for (let i = 0; i < sanitized.length; i += BATCH_SIZE) {
        const batch = sanitized.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase.from('transactions').upsert(batch);
        if (error) {
            console.error('Supabase upsert error:', error);
            throw error;
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
        console.log('Received file:', file.name, file.type, file.size);

        const learnedKeywordsStr = formData.get('learnedKeywords') as string;
        const learnedKeywords = learnedKeywordsStr ? JSON.parse(learnedKeywordsStr) : {};

        // ---------- PDF ----------
        if (file.type === 'application/pdf') {
            console.time('parsePDF');
            const rawText = await parsePDF(buffer);
            console.timeEnd('parsePDF');

            const pdfTransactions = [{
                description: rawText,
                date: new Date().toISOString().split('T')[0],
                amount: 0,
            }];

            console.time('categorize');
            const { results: transactions, newlyLearnedKeywords } = await categorizeTransactions(pdfTransactions, learnedKeywords);
            console.timeEnd('categorize');

            await storeTransactions(transactions, userEmail, bankName);
            return NextResponse.json({ transactions, newlyLearnedKeywords });
        }

        // ---------- CSV ----------
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            const text = buffer.toString('utf-8');
            console.time('parseCSV');
            const rawTransactions = await parseCSV(text);
            console.timeEnd('parseCSV');

            console.time('categorize');
            const { results: categorized, newlyLearnedKeywords } = await categorizeTransactions(rawTransactions, learnedKeywords);
            console.timeEnd('categorize');

            const transactions = rawTransactions.map((t, i) => ({
                ...t,
                category: categorized[i]?.category ?? 'Uncategorized',
                merchant_name: categorized[i]?.merchant_name ?? t.merchant_name,
            }));

            await storeTransactions(transactions, userEmail, bankName);
            return NextResponse.json({ transactions, newlyLearnedKeywords });
        }

        // ---------- EXCEL ----------
        if (
            file.type === 'application/vnd.ms-excel' ||
            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.name.endsWith('.xls') ||
            file.name.endsWith('.xlsx')
        ) {
            console.time('parseExcel');
            const rawTransactions = await parseExcel(buffer);
            console.timeEnd('parseExcel');

            console.time('categorize');
            const { results: categorized, newlyLearnedKeywords } = await categorizeTransactions(rawTransactions, learnedKeywords);
            console.timeEnd('categorize');

            const transactions = rawTransactions.map((t, i) => ({
                ...t,
                category: categorized[i]?.category ?? 'Uncategorized',
                merchant_name: categorized[i]?.merchant_name ?? t.merchant_name,
            }));

            await storeTransactions(transactions, userEmail, bankName);
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
