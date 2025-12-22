export interface Subscription {
    name: string;
    amount: number;
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    lastDate: string;
    nextDate: string;
    category: string;
    icon: string;
    status: 'active' | 'cancelled' | 'expiring';
    confidence: number;
}

export function detectRecurringTransactions(transactions: any[]): Set<number> {
    if (transactions.length < 2) return new Set();

    const recurringIndices = new Set<number>();

    // Find description and date keys
    const descKey = Object.keys(transactions[0] || {}).find(k => /description|narration|particulars/i.test(k)) || 'description';
    const dateKey = Object.keys(transactions[0] || {}).find(k => /^date$/i.test(k)) || 'date';

    // List of known subscription services
    const KNOWN_SUBSCRIPTIONS = [
        'netflix', 'spotify', 'apple', 'prime', 'amazon prime', 'youtube', 'google one',
        'hotstar', 'disney+', 'hulu', 'hbo', 'aws', 'azure', 'digitalocean', 'vercel',
        'netlify', 'heroku', 'github', 'gitlab', 'jetbrains', 'adobe', 'figma', 'canva',
        'notion', 'linear', 'slack', 'zoom', 'discord', 'chatgpt', 'openai', 'anthropic',
        'midjourney', 'cursor', 'copilot', 'tinder', 'bumble', 'hinge', 'linkedin',
        'x premium', 'twitter', 'medium', 'substack', 'patreon', 'onlyfans', 'twitch',
        'dropbox', 'box', 'icloud', 'onedrive', 'proton', 'expressvpn', 'nordvpn',
        'surfshark', 'hostinger', 'godaddy', 'namecheap', 'bluehost', 'squarespace',
        'wix', 'wordpress', 'shopify', 'mailchimp', 'convertkit', 'beehiiv', 'ghost',
        'airtel', 'jio', 'vi', 'act fibernet', 'bescom', 'tata sky', 'dish tv'
    ];

    // Group transactions by similar descriptions
    const groups: Map<string, number[]> = new Map();

    transactions.forEach((t, index) => {
        const desc = String(t[descKey] || '').toLowerCase().trim();
        if (!desc) return;

        // Extract merchant name or normalize description
        let normalizedDesc = desc;
        if (desc.includes('upi-')) {
            const parts = desc.split('-');
            if (parts.length >= 2) normalizedDesc = parts[1].toLowerCase().trim();
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

    // Analyze each group
    for (const [desc, indices] of groups.entries()) {
        if (indices.length < 2) {
            // Check if it's a known subscription even if it only appears once
            if (KNOWN_SUBSCRIPTIONS.some(sub => desc.includes(sub))) {
                recurringIndices.add(indices[0]);
            }
            continue;
        }

        const groupTransactions = indices.map(i => transactions[i]);
        const amounts = groupTransactions.map(t => Math.abs(parseFloat(String(t.amount || t.withdrawal || 0))));
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

        const amountsSimilar = amounts.every(amt => {
            if (avgAmount === 0) return true;
            const diff = Math.abs(amt - avgAmount) / avgAmount;
            return diff < 0.25; // Within 25%
        });

        if (!amountsSimilar) continue;

        const dates = groupTransactions.map(t => new Date(t[dateKey])).sort((a, b) => a.getTime() - b.getTime());
        const intervals: number[] = [];
        for (let i = 1; i < dates.length; i++) {
            const daysDiff = Math.abs((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
            intervals.push(daysDiff);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const isWeekly = Math.abs(avgInterval - 7) < 3;
        const isMonthly = Math.abs(avgInterval - 30) < 7;
        const isQuarterly = Math.abs(avgInterval - 90) < 14;
        const isYearly = Math.abs(avgInterval - 365) < 30;

        if (isWeekly || isMonthly || isQuarterly || isYearly || KNOWN_SUBSCRIPTIONS.some(sub => desc.includes(sub))) {
            indices.forEach(idx => recurringIndices.add(idx));
        }
    }

    return recurringIndices;
}

export function identifySubscriptions(transactions: any[]): Subscription[] {
    const recurringIndices = detectRecurringTransactions(transactions);
    const recurringTxs = transactions.filter((_, i) => recurringIndices.has(i));

    const groups: Map<string, any[]> = new Map();
    recurringTxs.forEach(t => {
        const desc = (t.merchant_name || t.description || '').toLowerCase();
        let key = desc;
        for (const gKey of groups.keys()) {
            if (areSimilarDescriptions(desc, gKey)) {
                key = gKey;
                break;
            }
        }
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(t);
    });

    const subscriptions: Subscription[] = [];
    groups.forEach((txs, name) => {
        const sorted = txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latest = sorted[0];
        const amounts = txs.map(t => Math.abs(t.amount || 0));
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

        // Calculate frequency
        let frequency: Subscription['frequency'] = 'monthly';
        if (txs.length >= 2) {
            const dates = txs.map(t => new Date(t.date).getTime()).sort();
            const intervals = [];
            for (let i = 1; i < dates.length; i++) {
                intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            if (avgInterval < 10) frequency = 'weekly';
            else if (avgInterval < 45) frequency = 'monthly';
            else if (avgInterval < 120) frequency = 'quarterly';
            else frequency = 'yearly';
        }

        // Predict next date
        const lastDate = new Date(latest.date);
        const nextDate = new Date(lastDate);
        if (frequency === 'weekly') nextDate.setDate(lastDate.getDate() + 7);
        else if (frequency === 'monthly') nextDate.setMonth(lastDate.getMonth() + 1);
        else if (frequency === 'quarterly') nextDate.setMonth(lastDate.getMonth() + 3);
        else nextDate.setFullYear(lastDate.getFullYear() + 1);

        subscriptions.push({
            name: latest.merchant_name || latest.description,
            amount: avgAmount,
            frequency,
            lastDate: latest.date,
            nextDate: nextDate.toISOString().split('T')[0],
            category: latest.category || 'Other',
            icon: '', // Will be filled by UI
            status: nextDate < new Date() ? 'expiring' : 'active',
            confidence: txs.length > 2 ? 0.9 : 0.6
        });
    });

    return subscriptions;
}

function areSimilarDescriptions(desc1: string, desc2: string): boolean {
    if (desc1 === desc2) return true;
    const d1 = desc1.toLowerCase();
    const d2 = desc2.toLowerCase();
    if (d1.includes(d2) || d2.includes(d1)) return d1.length > 3 && d2.length > 3;
    return false;
}
