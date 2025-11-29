import { Transaction } from '@/types';

export interface CategoryForecast {
    category: string;
    currentMonthSpending: number;
    predictedNextMonth: number;
    averageMonthly: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    trendPercentage: number;
    confidence: 'high' | 'medium' | 'low';
}

export interface SpendingForecast {
    totalPredicted: number;
    totalCurrent: number;
    categoryForecasts: CategoryForecast[];
    alerts: ForecastAlert[];
    monthlyTrend: {
        month: string;
        spending: number;
    }[];
}

export interface ForecastAlert {
    type: 'overspend' | 'unusual' | 'savings' | 'warning';
    category: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
    amount?: number;
}

/**
 * Generate spending forecast based on historical transaction data
 */
export function generateForecast(transactions: Transaction[]): SpendingForecast {
    // Group transactions by month and category
    const monthlyData = groupByMonth(transactions);
    const categoryData = groupByCategory(transactions);

    // Calculate predictions for each category
    const categoryForecasts: CategoryForecast[] = Object.entries(categoryData).map(([category, txns]) => {
        const monthlySpending = calculateMonthlyAverage(txns);
        const currentMonth = getCurrentMonthSpending(txns);
        const trend = calculateTrend(txns);

        // Simple linear prediction: average + trend adjustment
        const trendAdjustment = monthlySpending * (trend.percentage / 100);
        const predicted = monthlySpending + trendAdjustment;

        return {
            category,
            currentMonthSpending: currentMonth,
            predictedNextMonth: Math.round(predicted),
            averageMonthly: Math.round(monthlySpending),
            trend: trend.direction,
            trendPercentage: trend.percentage,
            confidence: getConfidence(txns.length)
        };
    });

    // Generate alerts
    const alerts = generateAlerts(categoryForecasts, monthlyData);

    // Calculate monthly trend (last 6 months)
    const monthlyTrend = calculateMonthlyTrend(monthlyData);

    const totalPredicted = categoryForecasts.reduce((sum, c) => sum + c.predictedNextMonth, 0);
    const totalCurrent = categoryForecasts.reduce((sum, c) => sum + c.currentMonthSpending, 0);

    return {
        totalPredicted,
        totalCurrent,
        categoryForecasts: categoryForecasts.sort((a, b) => b.predictedNextMonth - a.predictedNextMonth),
        alerts,
        monthlyTrend
    };
}

function groupByMonth(transactions: Transaction[]): Record<string, Transaction[]> {
    const groups: Record<string, Transaction[]> = {};

    transactions.forEach(t => {
        if (t.type !== 'expense') return; // Only forecast expenses
        if (!t.date) return; // Skip if no date

        const date = new Date(t.date);
        if (isNaN(date.getTime())) return; // Skip invalid dates

        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!groups[monthKey]) groups[monthKey] = [];
        groups[monthKey].push(t);
    });

    return groups;
}

function groupByCategory(transactions: Transaction[]): Record<string, Transaction[]> {
    const groups: Record<string, Transaction[]> = {};

    transactions.forEach(t => {
        if (t.type !== 'expense') return;

        const category = t.category || 'Uncategorized';
        if (!groups[category]) groups[category] = [];
        groups[category].push(t);
    });

    return groups;
}

function calculateMonthlyAverage(transactions: Transaction[]): number {
    const monthlyTotals = groupByMonth(transactions);
    const months = Object.keys(monthlyTotals);

    if (months.length === 0) return 0;

    const totalSpending = Object.values(monthlyTotals).reduce((sum, txns) => {
        return sum + txns.reduce((s, t) => s + (typeof t.amount === 'number' ? t.amount : 0), 0);
    }, 0);

    return totalSpending / months.length;
}

function getCurrentMonthSpending(transactions: Transaction[]): number {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return transactions
        .filter(t => {
            if (!t.date) return false;
            const date = new Date(t.date);
            if (isNaN(date.getTime())) return false;
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return monthKey === currentMonth;
        })
        .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0);
}

function calculateTrend(transactions: Transaction[]): { direction: 'increasing' | 'decreasing' | 'stable', percentage: number } {
    const monthlyTotals = groupByMonth(transactions);
    const months = Object.keys(monthlyTotals).sort();

    if (months.length < 2) return { direction: 'stable', percentage: 0 };

    // Compare last 3 months vs previous 3 months
    const recent = months.slice(-3);
    const previous = months.slice(-6, -3);

    if (previous.length === 0) return { direction: 'stable', percentage: 0 };

    const recentAvg = recent.reduce((sum, m) => {
        return sum + monthlyTotals[m].reduce((s, t) => s + (typeof t.amount === 'number' ? t.amount : 0), 0);
    }, 0) / recent.length;

    const previousAvg = previous.reduce((sum, m) => {
        return sum + monthlyTotals[m].reduce((s, t) => s + (typeof t.amount === 'number' ? t.amount : 0), 0);
    }, 0) / previous.length;

    const change = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (Math.abs(change) < 5) return { direction: 'stable', percentage: 0 };
    if (change > 0) return { direction: 'increasing', percentage: Math.round(change) };
    return { direction: 'decreasing', percentage: Math.round(Math.abs(change)) };
}

function getConfidence(transactionCount: number): 'high' | 'medium' | 'low' {
    if (transactionCount >= 20) return 'high';
    if (transactionCount >= 10) return 'medium';
    return 'low';
}

function generateAlerts(forecasts: CategoryForecast[], monthlyData: Record<string, Transaction[]>): ForecastAlert[] {
    const alerts: ForecastAlert[] = [];

    forecasts.forEach(forecast => {
        // Alert if predicted spending is significantly higher than average
        const increasePercent = ((forecast.predictedNextMonth - forecast.averageMonthly) / forecast.averageMonthly) * 100;

        if (increasePercent > 30 && forecast.confidence !== 'low') {
            alerts.push({
                type: 'warning',
                category: forecast.category,
                message: `Your ${forecast.category} spending is trending ${forecast.trendPercentage}% higher. Expected to spend ₹${forecast.predictedNextMonth.toLocaleString('en-IN')} next month.`,
                severity: increasePercent > 50 ? 'high' : 'medium',
                amount: forecast.predictedNextMonth
            });
        }

        // Alert if current month is already over average
        if (forecast.currentMonthSpending > forecast.averageMonthly * 1.2) {
            alerts.push({
                type: 'overspend',
                category: forecast.category,
                message: `You've already spent ₹${forecast.currentMonthSpending.toLocaleString('en-IN')} on ${forecast.category} this month (20% above average).`,
                severity: 'high',
                amount: forecast.currentMonthSpending - forecast.averageMonthly
            });
        }

        // Positive alert for decreasing spending
        if (forecast.trend === 'decreasing' && forecast.trendPercentage > 15) {
            alerts.push({
                type: 'savings',
                category: forecast.category,
                message: `Great job! Your ${forecast.category} spending is down ${forecast.trendPercentage}%. You're saving ₹${Math.round(forecast.averageMonthly - forecast.predictedNextMonth).toLocaleString('en-IN')}/month.`,
                severity: 'low',
                amount: forecast.averageMonthly - forecast.predictedNextMonth
            });
        }
    });

    return alerts.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
    });
}

function calculateMonthlyTrend(monthlyData: Record<string, Transaction[]>): { month: string; spending: number }[] {
    const months = Object.keys(monthlyData).sort().slice(-6); // Last 6 months

    return months.map(monthKey => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });

        const spending = monthlyData[monthKey].reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0);

        return {
            month: monthName,
            spending: Math.round(spending)
        };
    });
}
