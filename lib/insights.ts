import { Transaction } from '@/types';

export interface SpendingTrend {
    currentTotal: number;
    previousTotal: number;
    percentageChange: number;
    topCategories: { category: string; amount: number }[];
    biggestIncrease: { category: string; change: number } | null;
    biggestDecrease: { category: string; change: number } | null;
}

export interface Alert {
    type: 'warning' | 'info';
    message: string;
    category?: string;
}

export interface Prediction {
    projectedTotal: number;
    daysRemaining: number;
    onTrack: boolean;
    projectedChange: number;
}

export interface Recommendation {
    type: 'savings' | 'optimization';
    message: string;
    potentialSavings?: number;
}

export interface Insights {
    trends: SpendingTrend;
    alerts: Alert[];
    predictions: Prediction;
    recommendations: Recommendation[];
}

// Helper to parse amount from transaction
const parseAmount = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val || val === '') return 0;
    const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
    return isNaN(parsed) ? 0 : parsed;
};

// Get month from date string
const getMonthYear = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        // Try parsing DD/MM/YY format
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            let year = parseInt(parts[2]);
            if (year < 100) year += 2000;
            const parsed = new Date(year, month, day);
            return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
        }
        return '';
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// Analyze spending trends
export function analyzeSpendingTrends(
    transactions: Transaction[],
    currentMonth: string,
    previousMonth: string
): SpendingTrend {
    const currentTransactions = transactions.filter(t => {
        const month = getMonthYear(t.Date || t.date || '');
        return month === currentMonth;
    });

    const previousTransactions = transactions.filter(t => {
        const month = getMonthYear(t.Date || t.date || '');
        return month === previousMonth;
    });

    // Calculate totals
    let currentTotal = 0;
    let previousTotal = 0;

    const currentByCategory: Record<string, number> = {};
    const previousByCategory: Record<string, number> = {};

    currentTransactions.forEach(t => {
        const amount = parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0);
        currentTotal += amount;
        if (t.category) {
            currentByCategory[t.category] = (currentByCategory[t.category] || 0) + amount;
        }
    });

    previousTransactions.forEach(t => {
        const amount = parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0);
        previousTotal += amount;
        if (t.category) {
            previousByCategory[t.category] = (previousByCategory[t.category] || 0) + amount;
        }
    });

    // Top categories
    const topCategories = Object.entries(currentByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);

    // Biggest changes
    const changes: { category: string; change: number }[] = [];
    Object.keys({ ...currentByCategory, ...previousByCategory }).forEach(category => {
        const current = currentByCategory[category] || 0;
        const previous = previousByCategory[category] || 0;
        if (previous > 0) {
            const change = ((current - previous) / previous) * 100;
            changes.push({ category, change });
        }
    });

    const biggestIncrease = changes
        .filter(c => c.change > 0)
        .sort((a, b) => b.change - a.change)[0] || null;

    const biggestDecrease = changes
        .filter(c => c.change < 0)
        .sort((a, b) => a.change - b.change)[0] || null;

    const percentageChange = previousTotal > 0
        ? ((currentTotal - previousTotal) / previousTotal) * 100
        : 0;

    return {
        currentTotal,
        previousTotal,
        percentageChange,
        topCategories,
        biggestIncrease,
        biggestDecrease,
    };
}

// Detect anomalies
export function detectAnomalies(
    transactions: Transaction[],
    currentMonth: string
): Alert[] {
    const alerts: Alert[] = [];

    // Parse current month to get previous months
    const [year, month] = currentMonth.split('-').map(Number);
    const months: string[] = [currentMonth];

    // Get last 3 months for comparison
    for (let i = 1; i < 4; i++) {
        const date = new Date(year, month - 1 - i, 1);
        months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }

    const transactionsByMonth = months.map(m =>
        transactions.filter(t => getMonthYear(t.Date || t.date || '') === m)
    );

    const currentTransactions = transactionsByMonth[0];
    const historicalTransactions = transactionsByMonth.slice(1).flat();

    // Calculate average per category
    const historicalByCategory: Record<string, number[]> = {};
    historicalTransactions.forEach(t => {
        const amount = parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0);
        if (t.category && amount > 0) {
            if (!historicalByCategory[t.category]) {
                historicalByCategory[t.category] = [];
            }
            historicalByCategory[t.category].push(amount);
        }
    });

    // Check current month against averages
    const currentByCategory: Record<string, number> = {};
    currentTransactions.forEach(t => {
        const amount = parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0);
        if (t.category && amount > 0) {
            currentByCategory[t.category] = (currentByCategory[t.category] || 0) + amount;
        }
    });

    Object.entries(currentByCategory).forEach(([category, currentAmount]) => {
        const historical = historicalByCategory[category];
        if (historical && historical.length > 0) {
            const average = historical.reduce((a, b) => a + b, 0) / historical.length;
            const deviation = ((currentAmount - average) / average) * 100;

            if (deviation > 30) {
                alerts.push({
                    type: 'warning',
                    message: `${category} spending is ${Math.round(deviation)}% higher than usual`,
                    category,
                });
            }
        }
    });

    // Check for unusually large transactions
    const allAmounts = currentTransactions.map(t =>
        parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0)
    ).filter(a => a > 0);

    if (allAmounts.length > 0) {
        const average = allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length;
        const largeTransactions = currentTransactions.filter(t => {
            const amount = parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0);
            return amount > average * 2;
        });

        largeTransactions.forEach(t => {
            const amount = parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0);
            alerts.push({
                type: 'info',
                message: `Unusual transaction: ₹${amount.toLocaleString('en-IN')} in ${t.category || 'Other'}`,
                category: t.category,
            });
        });
    }

    return alerts.slice(0, 3); // Return top 3 alerts
}

// Generate predictions
export function generatePredictions(
    transactions: Transaction[],
    currentMonth: string
): Prediction {
    // Parse the month string (format: YYYY-MM)
    const [year, month] = currentMonth.split('-').map(Number);
    const monthDate = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    // For historical months, use the full month; for current month, use actual days elapsed
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
    const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;
    const daysRemaining = isCurrentMonth ? daysInMonth - today.getDate() : 0;

    const currentTransactions = transactions.filter(t => {
        const txMonth = getMonthYear(t.Date || t.date || '');
        return txMonth === currentMonth;
    });

    let currentTotal = 0;
    currentTransactions.forEach(t => {
        const amount = parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0);
        currentTotal += amount;
    });

    const dailyAverage = daysElapsed > 0 ? currentTotal / daysElapsed : 0;
    const projectedTotal = isCurrentMonth ? dailyAverage * daysInMonth : currentTotal;

    // Get previous month total for comparison
    const previousDate = new Date(year, month - 2, 1);
    const previousMonth = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`;

    const previousTransactions = transactions.filter(t => {
        const txMonth = getMonthYear(t.Date || t.date || '');
        return txMonth === previousMonth;
    });

    let previousTotal = 0;
    previousTransactions.forEach(t => {
        const amount = parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0);
        previousTotal += amount;
    });

    const projectedChange = previousTotal > 0
        ? ((projectedTotal - previousTotal) / previousTotal) * 100
        : 0;

    const onTrack = Math.abs(projectedChange) < 10; // Within 10% is "on track"

    return {
        projectedTotal,
        daysRemaining,
        onTrack,
        projectedChange,
    };
}

// Generate recommendations
export function generateRecommendations(
    transactions: Transaction[],
    insights: Partial<Insights>,
    currentMonth: string
): Recommendation[] {
    const recommendations: Recommendation[] = [];

    const currentTransactions = transactions.filter(t => {
        const month = getMonthYear(t.Date || t.date || '');
        return month === currentMonth;
    });

    const diningSpending = currentTransactions
        .filter(t => t.category === 'Restaurants & Dining')
        .reduce((sum, t) => sum + parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0), 0);

    if (diningSpending > 5000) {
        const potentialSavings = Math.round(diningSpending * 0.3);
        recommendations.push({
            type: 'savings',
            message: `Reduce dining out by 30% to save ₹${potentialSavings.toLocaleString('en-IN')}/month`,
            potentialSavings,
        });
    }

    // Check for subscription optimization
    const subscriptions = currentTransactions.filter(t =>
        t.category === 'Streaming Services' &&
        (t.Narration?.toLowerCase().includes('netflix') ||
            t.Narration?.toLowerCase().includes('prime') ||
            t.Narration?.toLowerCase().includes('spotify'))
    );

    if (subscriptions.length > 0) {
        recommendations.push({
            type: 'optimization',
            message: 'Switch to annual subscriptions to save up to 20%',
            potentialSavings: 600,
        });
    }

    // Check for high online shopping
    const shoppingSpending = currentTransactions
        .filter(t => t.category === 'Online Shopping')
        .reduce((sum, t) => sum + parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0), 0);

    if (shoppingSpending > 10000) {
        recommendations.push({
            type: 'savings',
            message: 'Consider a 7-day waiting period before online purchases',
        });
    }

    return recommendations.slice(0, 3);
}

// Main function to generate all insights
export function generateInsights(transactions: Transaction[]): Insights {
    if (transactions.length === 0) {
        return {
            trends: {
                currentTotal: 0,
                previousTotal: 0,
                percentageChange: 0,
                topCategories: [],
                biggestIncrease: null,
                biggestDecrease: null,
            },
            alerts: [],
            predictions: {
                projectedTotal: 0,
                daysRemaining: 0,
                onTrack: true,
                projectedChange: 0,
            },
            recommendations: [],
        };
    }

    // Find the most recent month in the transactions
    const monthsInData = new Set<string>();
    transactions.forEach(t => {
        const month = getMonthYear(t.Date || t.date || '');
        if (month) monthsInData.add(month);
    });

    const sortedMonths = Array.from(monthsInData).sort().reverse();
    const currentMonth = sortedMonths[0] || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const previousMonth = sortedMonths[1] || currentMonth;

    const trends = analyzeSpendingTrends(transactions, currentMonth, previousMonth);
    const alerts = detectAnomalies(transactions, currentMonth);
    const predictions = generatePredictions(transactions, currentMonth);

    const insights: Insights = {
        trends,
        alerts,
        predictions,
        recommendations: [],
    };

    insights.recommendations = generateRecommendations(transactions, insights, currentMonth);

    return insights;
}
