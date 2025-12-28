import OpenAI from 'openai';
import { supabase, supabaseAdmin } from './supabase';

if (!process.env.OPENAI_API_KEY) {
    console.warn('Missing OPENAI_API_KEY environment variable');
}

export const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

/**
 * Robust Transaction Categorizer
 * Uses a combination of local memory (rules) and advanced AI (GPT-4o)
 * to accurately categorize messy bank transactions.
 */

export interface Transaction {
    description?: string;
    narration?: string;
    particulars?: string;
    amount?: number;
    type?: 'income' | 'expense';
    category?: string;
    merchant_name?: string;
    [key: string]: any;
}

export interface CategorizationResult {
    results: Transaction[];
    newlyLearnedKeywords: Record<string, string[]>;
}

const CATEGORIES = [
    'Healthcare', 'Groceries', 'Restaurants & Dining', 'Fuel', 'Ride Services',
    'Travel & Transport', 'Public Transport', 'Utilities', 'Credit Card Payments',
    'Telecom', 'Online Shopping', 'Retail & Stores', 'Shopping', 'Streaming Services',
    'Events & Recreation', 'Housing', 'Education', 'Income', 'Insurance',
    'Investments', 'Personal Care', 'Automotive', 'Other'
];

/**
 * Advanced Narration Cleaner
 * Removes bank-specific noise, transaction IDs, and technical prefixes.
 */
export function cleanNarration(narration: string): string {
    if (!narration) return '';

    // 1. Separate CamelCase and Numbers
    let cleaned = narration.replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([a-zA-Z])(\d)/g, '$1 $2')
        .replace(/(\d)([a-zA-Z])/g, '$1 $2');

    // 2. Convert to uppercase
    cleaned = cleaned.toUpperCase();

    // 3. Remove common technical prefixes (multiple times)
    const prefixRegex = /^(UPI|POS|ACH|NEFT|IMPS|RTGS|INF|UTI|DR|CR|TXN|REF|TRANSFER|TRF|BP|BILLPAY|PAYMENT TO|PAYMENT FROM|PURCHASE|DEBIT|CREDIT)[:\/\-\s]*/g;
    let oldCleaned = '';
    while (oldCleaned !== cleaned) {
        oldCleaned = cleaned;
        cleaned = cleaned.replace(prefixRegex, '');
    }

    // 4. Remove IFSC codes
    cleaned = cleaned.replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/g, '');

    // 5. Remove transaction IDs (8+ digits)
    cleaned = cleaned.replace(/\b\d{8,}\b/g, '');

    // 6. Remove dates
    cleaned = cleaned.replace(/\b\d{6,8}\b/g, '');
    cleaned = cleaned.replace(/\b\d{2,4}[-\/]\d{2}[-\/]\d{2,4}\b/g, '');

    // 7. Remove UPI IDs
    cleaned = cleaned.replace(/\b[\w\.\-]+\@[\w\.\-]+\b/g, '');

    // 8. Remove common bank noise
    const bankNoise = [
        'HDFC', 'ICICI', 'AXIS', 'SBI', 'KOTAK', 'YESB', 'PNB', 'BOB', 'UTIB', 'PUNB', 'BARB', 'KKBK', 'CITI', 'HSBC', 'SCBL',
        'IDFC', 'IDBI', 'CANARA', 'UNIONB', 'INDUS', 'FEDERAL', 'RBL', 'BANDHAN', 'PAYTM', 'PHONEPE', 'GPAY', 'GOOGLEPAY', 'BHIM', 'AMAZONPAY', 'CRED'
    ];
    bankNoise.forEach(bank => {
        const regex = new RegExp(`\\b${bank}\\d*\\b`, 'g');
        cleaned = cleaned.replace(regex, '');
    });

    // 9. Final cleanup
    cleaned = cleaned.replace(/[\/\-\_\:\*]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return cleaned || narration.trim().toUpperCase();
}

/**
 * Extracts a stable merchant identifier for grouping similar transactions.
 */
export function getMerchantIdentifier(narration: string): string {
    const cleaned = cleanNarration(narration);
    if (!cleaned) return '';

    // Take the first two words as the identifier (e.g., "SWIGGY INSTAMART" or "STAR BAZAAR")
    const words = cleaned.split(' ');
    if (words.length >= 2) {
        // Check if the first word is too short (like "SRI" or "THE")
        if (words[0].length <= 3 && words.length >= 3) {
            return words.slice(0, 3).join(' ');
        }
        return words.slice(0, 2).join(' ');
    }
    return words[0] || '';
}

export async function categorizeTransactions(
    transactions: Transaction[],
    memoryBank: Record<string, string[]> = {},
    userEmail?: string,
    uploadId?: string
): Promise<CategorizationResult> {
    if (!transactions.length) return { results: [], newlyLearnedKeywords: {} };

    const ruleCount = Object.values(memoryBank).flat().length;
    console.log(`🚀 Starting robust categorization for ${transactions.length} transactions...`);
    console.log(`🧠 Memory Bank: ${ruleCount} existing rules loaded.`);

    // 1. Extract and Normalize Descriptions
    const processedTransactions = transactions.map(t => {
        const rawDesc = t.description || t.narration || t.particulars || t.Details || t.Description || t.Narration || t.Particulars || t.Memo || '';
        const cleanedDesc = cleanNarration(rawDesc);

        // If category is missing or "Other", mark it for AI
        let currentCategory = t.category;
        if (!currentCategory || currentCategory === 'Other' || currentCategory === '-') {
            currentCategory = 'Other';
        }

        return {
            ...t,
            _rawDesc: rawDesc,
            _cleanedDesc: cleanedDesc,
            category: currentCategory,
            merchant_name: t.merchant_name || ''
        };
    });

    // 2. Local Matching (Memory Bank)
    const newlyLearnedKeywords: Record<string, string[]> = {};

    processedTransactions.forEach(t => {
        // Skip if already categorized by a previous step
        if (t.category && t.category !== 'Other' && t.category !== '-') return;

        const desc = t._cleanedDesc.toLowerCase();
        for (const [category, keywords] of Object.entries(memoryBank)) {
            // CRITICAL: Skip 'Other' in local matching. If it's not a clear match, let the AI handle it.
            if (category === 'Other') continue;

            for (const keyword of keywords) {
                const kw = keyword.toLowerCase();
                const isMatch = kw.length > 3
                    ? desc.includes(kw)
                    : new RegExp(`\\b${kw}\\b`, 'i').test(desc);

                if (isMatch) {
                    t.category = category;
                    if (!t.merchant_name) {
                        t.merchant_name = keyword.charAt(0).toUpperCase() + keyword.slice(1);
                    }
                    break;
                }
            }
            if (t.category !== 'Other') break;
        }
    });

    // 3. Identify transactions that still need AI
    const needsAI = processedTransactions.filter(t => t.category === 'Other');
    console.log(`🧠 Local matching complete. ${needsAI.length} transactions need AI analysis.`);

    if (needsAI.length === 0 || !openai) {
        return { results: processedTransactions, newlyLearnedKeywords };
    }

    // 4. Deduplicate for AI
    const uniqueToAnalyze = new Map<string, { raw: string, ids: number[] }>();
    needsAI.forEach((t, index) => {
        // Use the RAW description for deduplication to ensure AI sees every unique string
        const key = t._rawDesc.trim();
        if (!uniqueToAnalyze.has(key)) {
            uniqueToAnalyze.set(key, { raw: t._rawDesc, ids: [index] });
        } else {
            uniqueToAnalyze.get(key)!.ids.push(index);
        }
    });

    const itemsToCategorize = Array.from(uniqueToAnalyze.entries()).map(([key, val], idx) => ({
        id: idx,
        narration: val.raw
    }));

    // 5. Call OpenAI in Parallel
    const BATCH_SIZE = 50; // Reduced batch size for faster processing and better timeout handling
    const batches = [];
    for (let i = 0; i < itemsToCategorize.length; i += BATCH_SIZE) {
        batches.push(itemsToCategorize.slice(i, i + BATCH_SIZE));
    }

    console.log(`📡 Sending ${batches.length} parallel batches to OpenAI...`);

    let completedItems = 0;

    await Promise.all(batches.map(async (batch, batchIdx) => {
        const prompt = `**SYSTEM ROLE**: You are a world-class financial forensics expert specializing in Indian bank statements and UPI transactions. Your task is to perform a deep analysis of the RAW narration strings.

**TARGET CATEGORIES**:
${CATEGORIES.join(', ')}

**FORENSIC RULES**:
1. **Read the ENTIRE String**: Do not ignore any part of the narration. The merchant name is often buried between hyphens or slashes.
2. **UPI Pattern Recognition**: 
   - Pattern: 'UPI-MERCHANT_NAME-UPI_ID-IFSC-TXN_ID-GATEWAY'
   - The merchant is almost always the text immediately following 'UPI-'.
   - Example: 'UPI-SWIGGY-UPISWIGGY@ICICI...' -> Merchant: **SWIGGY**, Category: **Restaurants & Dining**.
   - Example: 'UPI-EXPERT CAR SERVICE-Q684054864@YBL...' -> Merchant: **EXPERT CAR SERVICE**, Category: **Automotive**.
3. **Aggressive Categorization**: 
   - "Other" is a failure. Only use it if the string is truly random gibberish or a personal name with no context.
   - If you see "Sagar", "Bhavan", "Cafe", "Foods", "Bakery", "Sweets", "Kitchen", "Hotel", "Restaurant", "Veg", "Dhaba", "Tiffin", "Mess", "Kamdhenu" -> **Restaurants & Dining**.
   - If you see "Zepto", "Blinkit", "Instamart", "BigBasket", "Milk", "Daily", "Provisions", "Store", "Mart", "Supermarket" -> **Groceries**.
   - If you see "Amazon", "Flipkart", "Myntra", "Ajio", "Meesho", "Nykaa" -> **Online Shopping**.
   - If you see "Airtel", "Jio", "Vi", "Recharge", "Postpaid", "Bill Payment" -> **Telecom** or **Utilities**.
   - If you see "Uber", "Ola", "Rapido", "Namma Yatri", "Metro", "Travels" -> **Ride Services** or **Travel & Transport**.
   - If you see "Zerodha", "Groww", "Upstox", "Angel One", "Securities", "Broking", "Capital", "Ventures", "Mutual Fund", "SIP", "Invest", "Indian Clearing Corp", "BSE", "NSE", "ICC", "NMF" -> **Investments**.
4. **Ignore Payment Apps**: "CRED", "PAYTM", "PHONEPE", "GPAY" are just gateways. Look for the *actual* merchant name in the string.

**OUTPUT FORMAT**:
Return a JSON object:
{
  "categorizations": [
    {
      "id": <id>,
      "merchant": "Clean Merchant Name",
      "category": "One of the Target Categories",
      "keyword": "stable_keyword_for_future_matching",
      "confidence": 0-100,
      "reasoning": "Forensic explanation"
    }
  ]
}

**RAW TRANSACTIONS**:
${JSON.stringify(batch)}`;

        try {
            const response = await openai!.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a forensic financial analyst. You analyze raw bank narrations to identify merchants and categories with extreme precision." },
                    { role: "user", content: prompt }
                ],
                temperature: 0,
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            if (content) {
                const parsed = JSON.parse(content);
                const results = parsed.categorizations || [];

                // Log AI response details
                console.log(`🤖 AI returned ${results.length} categorizations for batch ${batchIdx + 1}`);
                const sampleResults = results.slice(0, 3);
                console.log('📋 Sample AI results:', JSON.stringify(sampleResults.map((r: any) => ({
                    merchant: r.merchant,
                    category: r.category,
                    confidence: r.confidence
                })), null, 2));

                // Count categories
                const categoryCounts: Record<string, number> = {};
                results.forEach((res: any) => {
                    categoryCounts[res.category] = (categoryCounts[res.category] || 0) + 1;
                });
                console.log('📊 Category distribution:', categoryCounts);

                results.forEach((res: any) => {
                    const batchItem = batch.find(b => b.id === res.id);
                    if (batchItem) {
                        const data = uniqueToAnalyze.get(batchItem.narration);
                        if (data) {
                            data.ids.forEach(idx => {
                                const t = needsAI[idx];
                                t.category = res.category;
                                t.merchant_name = res.merchant;
                            });

                            // Only learn keywords if confidence is high
                            if (res.confidence > 80 && res.category && res.category !== 'Other' && res.keyword) {
                                if (!newlyLearnedKeywords[res.category]) newlyLearnedKeywords[res.category] = [];
                                if (!newlyLearnedKeywords[res.category].includes(res.keyword.toLowerCase())) {
                                    newlyLearnedKeywords[res.category].push(res.keyword.toLowerCase());
                                }
                            }
                        }
                    }
                });
            }

            // Update progress
            completedItems += batch.length;
            if (uploadId) {
                await supabaseAdmin
                    .from('uploads')
                    .update({ processed_count: completedItems })
                    .eq('id', uploadId);
            }
            // Log Usage for Admin Dashboard
            if (response.usage && userEmail) {
                const { prompt_tokens, completion_tokens, total_tokens } = response.usage;
                // gpt-4o-mini pricing: $0.15 / 1M input, $0.60 / 1M output
                const cost = (prompt_tokens * 0.15 / 1000000) + (completion_tokens * 0.60 / 1000000);

                await supabaseAdmin.from('usage_logs').insert({
                    user_email: userEmail,
                    feature: 'categorization',
                    model: 'gpt-4o-mini',
                    prompt_tokens,
                    completion_tokens,
                    total_tokens,
                    estimated_cost_usd: cost
                });
            }

            console.log(`📦 Batch ${batchIdx + 1}/${batches.length} complete (${completedItems}/${itemsToCategorize.length} items)`);
        } catch (error) {
            console.error(`❌ Error in AI batch ${batchIdx + 1}:`, error);
        }
    }));

    // 6. Final Cleanup
    const finalResults = processedTransactions.map(t => {
        const { _rawDesc, _cleanedDesc, ...rest } = t;
        return rest;
    });

    console.log(`✅ Categorization complete. Learned ${Object.values(newlyLearnedKeywords).flat().length} new keywords.`);

    return {
        results: finalResults,
        newlyLearnedKeywords
    };
}
