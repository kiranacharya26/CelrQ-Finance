/**
 * Chart utility functions
 */

/**
 * Modern, harmonious color palette for charts
 */
export const CHART_COLORS = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#f43f5e', // Rose
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#84cc16', // Lime
    '#14b8a6', // Teal
    '#d946ef'  // Fuchsia
];

/**
 * Sort data by value in descending order
 */
export function sortByValue<T extends { value: number }>(data: T[]): T[] {
    return [...data].sort((a, b) => b.value - a.value);
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number, options?: Intl.NumberFormatOptions): string {
    return `₹${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options
    })}`;
}

/**
 * Format currency for chart axis (shorter format)
 */
export function formatCurrencyShort(value: number): string {
    if (value >= 10000000) {
        return `₹${(value / 10000000).toFixed(1)}Cr`;
    }
    if (value >= 100000) {
        return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
        return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value}`;
}

/**
 * Get color by index from chart colors
 */
export function getChartColor(index: number): string {
    return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
}

/**
 * Group data by key
 */
export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((result, item) => {
        const key = keyFn(item);
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(item);
        return result;
    }, {} as Record<string, T[]>);
}

/**
 * Sum values by key
 */
export function sumBy<T>(array: T[], valueFn: (item: T) => number): number {
    return array.reduce((sum, item) => sum + valueFn(item), 0);
}
