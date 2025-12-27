/**
 * Financial Year Utility
 * Calculates the current financial year based on the system date.
 * Financial Year runs from April 1st to March 31st.
 */

export interface FinancialYearDetails {
    startDate: Date;
    endDate: Date;
    label: string; // e.g., "FY 2025-26"
    startYear: number;
    endYear: number;
}

export function getCurrentFinancialYear(): FinancialYearDetails {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11 (Jan is 0, Apr is 3)

    // If current month is Jan(0), Feb(1), or Mar(2), we are in the later part of the FY
    // So the FY started in the previous year.
    // Example: Feb 2026 -> FY started Apr 2025.
    // Example: Apr 2025 -> FY started Apr 2025.
    const startYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    const endYear = startYear + 1;

    const startDate = new Date(startYear, 3, 1); // April 1st
    // Set end date to March 31st of end year, at end of day
    const endDate = new Date(endYear, 2, 31, 23, 59, 59, 999);

    const label = `FY ${startYear}-${endYear.toString().slice(-2)}`;

    return {
        startDate,
        endDate,
        label,
        startYear,
        endYear
    };
}
