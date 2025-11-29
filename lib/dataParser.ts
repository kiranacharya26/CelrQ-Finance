/**
 * Data parsing utilities for transactions
 */

/**
 * Safely parse a value to a number (amount)
 */
export function parseAmount(val: any): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse various date formats to a Date object
 */
export function parseDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;

    // Handle Excel serial dates (numbers)
    if (typeof val === 'number') {
        // Excel base date is Dec 30, 1899
        return new Date(Math.round((val - 25569) * 86400 * 1000));
    }

    const strVal = String(val).trim();

    // Try common formats
    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = strVal.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
        return new Date(parseInt(dmyMatch[3]), parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1]));
    }

    // DD/MM/YY or DD-MM-YY
    const dmyShortMatch = strVal.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
    if (dmyShortMatch) {
        return new Date(2000 + parseInt(dmyShortMatch[3]), parseInt(dmyShortMatch[2]) - 1, parseInt(dmyShortMatch[1]));
    }

    // Try standard Date.parse
    const parsed = Date.parse(strVal);
    if (!isNaN(parsed)) {
        return new Date(parsed);
    }

    return null;
}

/**
 * Determine transaction type from transaction data
 */
export function parseTransactionType(
    transaction: any,
    withdrawalKey?: string,
    depositKey?: string,
    amountKey?: string
): 'income' | 'expense' {
    if (withdrawalKey && transaction[withdrawalKey]) {
        return 'expense';
    }
    if (depositKey && transaction[depositKey]) {
        return 'income';
    }
    if (transaction.type) {
        return transaction.type;
    }
    if (amountKey && transaction[amountKey]) {
        const val = parseAmount(transaction[amountKey]);
        return val >= 0 ? 'income' : 'expense';
    }
    return 'expense'; // Default
}

/**
 * Extract category from transaction
 */
export function parseCategory(transaction: any, categoryKey?: string): string {
    if (categoryKey && transaction[categoryKey]) {
        return transaction[categoryKey];
    }

    // Fallback to description/narration if no category column
    const descKey = Object.keys(transaction).find(k =>
        k.toLowerCase().includes('description') ||
        k.toLowerCase().includes('narration') ||
        k.toLowerCase().includes('particulars')
    );

    if (descKey && transaction[descKey]) {
        // Use first word or two as pseudo-category
        return String(transaction[descKey]).split(' ').slice(0, 2).join(' ');
    }

    return 'Uncategorized';
}

/**
 * Format month and year from date
 */
export function formatMonthYear(date: Date): string {
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}
