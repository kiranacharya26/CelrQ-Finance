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

    transactions.forEach(t => {
        const desc = (t.description || t.narration || '').toUpperCase();
        const amount = Math.abs(Number(t.amount) || 0);

        // Only consider outflows (expenses/transfers out)
        if (t.type === 'income') return;

        for (const [category, patterns] of Object.entries(INVESTMENT_PATTERNS)) {
            if (patterns.some(p => desc.includes(p))) {
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
