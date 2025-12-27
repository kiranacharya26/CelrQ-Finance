/**
 * Parse various date formats to a Date object
 * Safe for use in both Client and Server components
 */
export function parseDate(val: any): Date | null {
    if (!val) return null;

    // If it's already a Date object, we want to ensure it's treated as a calendar date
    if (val instanceof Date) {
        // If it's a valid date, return a new Date at UTC midnight of that local date
        if (!isNaN(val.getTime())) {
            return new Date(Date.UTC(val.getFullYear(), val.getMonth(), val.getDate()));
        }
        return null;
    }

    // Handle Excel serial dates (numbers)
    if (typeof val === 'number') {
        // Excel base date is Jan 1, 1900
        // Days since Dec 30, 1899
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        return new Date(excelEpoch.getTime() + val * 86400 * 1000);
    }

    const strVal = String(val).trim();

    // Try ISO format first (YYYY-MM-DD)
    const isoMatch = strVal.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
        return new Date(Date.UTC(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3])));
    }

    // Try common formats
    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = strVal.match(/^(\d{1,2})[\\/\-](\d{1,2})[\\/\-](\d{4})$/);
    if (dmyMatch) {
        return new Date(Date.UTC(parseInt(dmyMatch[3]), parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1])));
    }

    // DD/MM/YY or DD-MM-YY
    const dmyShortMatch = strVal.match(/^(\d{1,2})[\\/\-](\d{1,2})[\\/\-](\d{2})$/);
    if (dmyShortMatch) {
        const year = parseInt(dmyShortMatch[3]);
        const fullYear = year < 50 ? 2000 + year : 1900 + year;
        return new Date(Date.UTC(fullYear, parseInt(dmyShortMatch[2]) - 1, parseInt(dmyShortMatch[1])));
    }

    // Try standard Date.parse
    const parsed = Date.parse(strVal);
    if (!isNaN(parsed)) {
        const d = new Date(parsed);
        // Convert to UTC midnight of whatever date was parsed
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    }

    return null;
}
