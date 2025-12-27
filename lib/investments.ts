import { Transaction } from '@/types';

export interface InvestmentSummary {
    category: 'Mutual Funds' | 'Stocks' | 'Fixed Deposits' | 'Recurring Deposits' | 'Other Investments';
    totalInvested: number;
    transactionCount: number;
    recurringAmount: number;
    lastInvestedDate: string | null;
    detectedMerchants: string[];
}

const INVESTMENT_PATTERNS = {
    'Mutual Funds': [
        'MF', 'AMC', 'NIPPON', 'HDFC MUTUAL', 'ICICI PRU', 'SBI MUTUAL', 'AXIS MUTUAL', 'MIRAIE', 'PARAG PARIKH', 'QUANT', 'SIP', 'GROWW', 'CAMS', 'KARVY'
    ],
    'Stocks': [
        'ZERODHA', 'KITE', 'UPSTOX', 'ANGELONE', '5PAISA', 'GROWW STOCKS', 'INDMONEY', 'VESTED', 'BROKING'
    ],
    'Fixed Deposits': [
        'FD', 'FIXED DEPOSIT', 'TERM DEPOSIT', 'TFR TO FD'
    ],
    'Recurring Deposits': [
        'RD', 'RECURRING DEPOSIT', 'RD INSTALLMENT'
    ]
};

/**
 * Detects and aggregates investments from transactions.
 */
export function analyzeInvestments(transactions: Transaction[]): Record<string, InvestmentSummary> {
    const summaries: Record<string, InvestmentSummary> = {
        'Mutual Funds': { category: 'Mutual Funds', totalInvested: 0, transactionCount: 0, recurringAmount: 0, lastInvestedDate: null, detectedMerchants: [] },
        'Stocks': { category: 'Stocks', totalInvested: 0, transactionCount: 0, recurringAmount: 0, lastInvestedDate: null, detectedMerchants: [] },
        'Fixed Deposits': { category: 'Fixed Deposits', totalInvested: 0, transactionCount: 0, recurringAmount: 0, lastInvestedDate: null, detectedMerchants: [] },
        'Recurring Deposits': { category: 'Recurring Deposits', totalInvested: 0, transactionCount: 0, recurringAmount: 0, lastInvestedDate: null, detectedMerchants: [] },
    };

    // Regex patterns for safer matching of short acronyms
    const SAFE_PATTERNS = {
        'Mutual Funds': [/\bMF\b/i, /\bAMC\b/i, /\bSIP\b/i, /NIPPON/i, /HDFC MUTUAL/i, /ICICI PRU/i, /SBI MUTUAL/i, /AXIS MUTUAL/i, /MIRAIE/i, /PARAG PARIKH/i, /QUANT/i, /GROWW/i, /CAMS/i, /KARVY/i],
        'Stocks': [/ZERODHA/i, /KITE/i, /UPSTOX/i, /ANGELONE/i, /5PAISA/i, /GROWW STOCKS/i, /INDMONEY/i, /VESTED/i, /BROKING/i, /SECURITIES/i, /CAPITAL/i],
        'Fixed Deposits': [/\bFD\b/i, /FIXED DEPOSIT/i, /TERM DEPOSIT/i, /TFR TO FD/i],
        'Recurring Deposits': [/\bRD\b/i, /RECURRING DEPOSIT/i, /RD INSTALLMENT/i]
    };

    transactions.forEach(t => {
        // CRITICAL: Only analyze transactions that are already categorized as Investments
        // or if they are uncategorized/Other but look very strongly like investments.
        // This prevents "Zomato" (Restaurants) from being checked for "RD" (Recurring Deposit).
        const isInvestmentCategory = t.category === 'Investments' || t.category === 'Mutual Funds';
        if (!isInvestmentCategory && t.category !== 'Other' && t.category !== 'Uncategorized') {
            return;
        }

        const desc = (t.description || t.narration || '').toUpperCase();
        const amount = Math.abs(Number(t.amount) || 0);

        // Only consider outflows (expenses/transfers out)
        if (t.type === 'income') return;

        for (const [category, patterns] of Object.entries(SAFE_PATTERNS)) {
            if (patterns.some(p => p.test(desc))) {
                const summary = summaries[category];
                summary.totalInvested += amount;
                summary.transactionCount += 1;

                if (!summary.lastInvestedDate || (t.date && new Date(t.date) > new Date(summary.lastInvestedDate))) {
                    summary.lastInvestedDate = t.date || null;
                }

                // Try to extract merchant name
                const merchant = t.merchant_name || t.description?.split('-')[1] || t.description?.split('/')[1] || 'Unknown';
                if (merchant && !summary.detectedMerchants.includes(merchant)) {
                    summary.detectedMerchants.push(merchant);
                }

                break; // Found a match
            }
        }
    });

    // Estimate recurring amount (average of last 3 months if multiple transactions)
    Object.keys(summaries).forEach(cat => {
        const s = summaries[cat];
        if (s.transactionCount > 1) {
            s.recurringAmount = s.totalInvested / Math.max(1, s.transactionCount);
        }
    });

    return summaries;
}
