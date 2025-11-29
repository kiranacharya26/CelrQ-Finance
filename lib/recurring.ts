// Recurring transaction detection algorithm

interface Transaction {
    [key: string]: any;
}

interface RecurringGroup {
    description: string;
    transactions: Transaction[];
    frequency: 'weekly' | 'monthly' | 'quarterly';
    averageAmount: number;
}

export function detectRecurringTransactions(transactions: Transaction[]): Set<number> {
    if (transactions.length < 2) return new Set();

    const recurringIndices = new Set<number>();

    // Find description and date keys
    const descKey = Object.keys(transactions[0] || {}).find(k => /description|narration|particulars/i.test(k));
    const dateKey = Object.keys(transactions[0] || {}).find(k => /^date$/i.test(k));

    if (!descKey || !dateKey) return new Set();

    // Group transactions by similar descriptions
    const groups: Map<string, number[]> = new Map();

    transactions.forEach((t, index) => {
        const desc = String(t[descKey] || '').toLowerCase().trim();
        if (!desc) return;

        // Extract merchant name from UPI or normalize description
        let normalizedDesc = desc;
        if (desc.includes('upi-')) {
            const parts = desc.split('-');
            if (parts.length >= 2) {
                normalizedDesc = parts[1].toLowerCase().trim();
            }
        }

        // Find similar existing group
        let foundGroup = false;
        for (const [groupDesc, indices] of groups.entries()) {
            if (areSimilarDescriptions(normalizedDesc, groupDesc)) {
                indices.push(index);
                foundGroup = true;
                break;
            }
        }

        if (!foundGroup) {
            groups.set(normalizedDesc, [index]);
        }
    });

    // Analyze each group for recurring patterns
    for (const [desc, indices] of groups.entries()) {
        if (indices.length < 2) continue;

        // Get transactions in this group
        const groupTransactions = indices.map(i => transactions[i]);

        // Check if amounts are similar (±20%)
        const amounts = groupTransactions.map(t => {
            const withdrawalKey = Object.keys(t).find(k => /withdrawal|debit/i.test(k));
            const amountKey = Object.keys(t).find(k => /^amount$/i.test(k));

            if (withdrawalKey && t[withdrawalKey]) {
                return parseFloat(String(t[withdrawalKey]).replace(/[^0-9.-]+/g, '')) || 0;
            } else if (amountKey && t[amountKey]) {
                return Math.abs(parseFloat(String(t[amountKey]).replace(/[^0-9.-]+/g, '')) || 0);
            }
            return 0;
        });

        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const amountsSimilar = amounts.every(amt => {
            const diff = Math.abs(amt - avgAmount) / avgAmount;
            return diff < 0.2; // Within 20%
        });

        if (!amountsSimilar) continue;

        // Check if dates are at regular intervals
        const dates = groupTransactions.map(t => new Date(t[dateKey])).sort((a, b) => a.getTime() - b.getTime());

        if (dates.length >= 2) {
            const intervals: number[] = [];
            for (let i = 1; i < dates.length; i++) {
                const daysDiff = Math.abs((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
                intervals.push(daysDiff);
            }

            // Check for weekly (7 days ±3), monthly (30 days ±7), or quarterly (90 days ±14)
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

            const isWeekly = Math.abs(avgInterval - 7) < 3;
            const isMonthly = Math.abs(avgInterval - 30) < 7;
            const isQuarterly = Math.abs(avgInterval - 90) < 14;

            if (isWeekly || isMonthly || isQuarterly) {
                // Mark all transactions in this group as recurring
                indices.forEach(idx => recurringIndices.add(idx));
            }
        }
    }

    return recurringIndices;
}

function areSimilarDescriptions(desc1: string, desc2: string): boolean {
    // Simple similarity check - can be enhanced with Levenshtein distance
    if (desc1 === desc2) return true;

    // Check if one contains the other (for partial matches)
    if (desc1.includes(desc2) || desc2.includes(desc1)) {
        return desc1.length > 3 && desc2.length > 3; // Avoid matching very short strings
    }

    return false;
}

export function getRecurringTransactions(transactions: Transaction[]): Transaction[] {
    const recurringIndices = detectRecurringTransactions(transactions);
    return transactions.filter((_, index) => recurringIndices.has(index));
}
