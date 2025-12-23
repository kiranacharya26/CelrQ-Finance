import Papa from 'papaparse';
import { Transaction } from '@/types';

export async function parsePDF(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const PDFParser = require('pdf2json');
            const pdfParser = new PDFParser();

            pdfParser.on('pdfParser_dataError', (errData: any) => {
                console.error("PDF parsing error:", errData.parserError);
                reject(new Error("Failed to parse PDF file. Please ensure the file is a valid PDF."));
            });

            pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
                try {
                    // Extract text from all pages
                    let text = '';
                    if (pdfData.Pages) {
                        pdfData.Pages.forEach((page: any) => {
                            if (page.Texts) {
                                page.Texts.forEach((textItem: any) => {
                                    if (textItem.R) {
                                        textItem.R.forEach((run: any) => {
                                            if (run.T) {
                                                text += decodeURIComponent(run.T) + ' ';
                                            }
                                        });
                                    }
                                });
                                text += '\n';
                            }
                        });
                    }
                    resolve(text);
                } catch (error) {
                    console.error("Error extracting text from PDF:", error);
                    reject(new Error("Failed to extract text from PDF."));
                }
            });

            pdfParser.parseBuffer(buffer);
        } catch (error) {
            console.error("PDF parser initialization error:", error);
            reject(new Error("Failed to initialize PDF parser."));
        }
    });
}

export async function parseCSV(content: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error: any) => reject(error),
        });
    });
}

export async function parseExcel(buffer: Buffer): Promise<any[]> {
    const XLSX = require('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to array of arrays to find the header row
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });

    let headerRowIndex = 0;
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        // Heuristic: Look for a row that contains "Date" and ("Description" or "Narration" or "Particulars")
        const rowString = row.join(' ').toLowerCase();
        if (rowString.includes('date') && (rowString.includes('narration') || rowString.includes('description') || rowString.includes('particulars') || rowString.includes('withdrawal'))) {
            headerRowIndex = i;
            break;
        }
    }

    // Parse again starting from the detected header row with cellDates enabled
    const rawData = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex, defval: "", raw: false, dateNF: 'yyyy-mm-dd' });

    // Filter out invalid rows by checking if the date column contains a valid date
    const filtered = rawData.filter((row: any) => {
        // Find the date column (case-insensitive)
        const dateKey = Object.keys(row).find(k => /^date$/i.test(k.trim()));
        if (!dateKey) return false;

        const dateValue = row[dateKey];
        if (!dateValue) return false;

        // Check if it's a valid date format (not asterisks or text like "STATEMENT SUMMARY")
        const dateStr = String(dateValue).trim();

        // Reject if it contains only asterisks or special characters
        if (/^[\*\-\=\s]+$/.test(dateStr)) return false;

        // Reject if it's clearly text (contains multiple words or common non-date keywords)
        if (/statement|summary|total|balance|opening|closing/i.test(dateStr)) return false;

        // Reject unrealistic Excel serial dates (before 1990 or after 2050)
        if (typeof dateValue === 'number') {
            // Excel serial date: 32874 = Jan 1, 1990; 54789 = Dec 31, 2049
            if (dateValue < 32874 || dateValue > 54789) return false;
        }

        // Accept if it looks like a date (DD/MM/YY, DD-MM-YYYY, etc.)
        if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(dateStr)) return true;

        // Accept if it's an ISO date
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return true;

        // Try parsing as a date
        const parsed = parseDate(dateValue);
        if (parsed === null) return false;

        // Ensure parsed date is reasonable (between 1990 and 2050)
        const year = parsed.getFullYear();
        return year >= 1990 && year <= 2050;
    });

    return filtered;
}

// Simple regex-based extraction for demonstration (will be replaced/enhanced by OpenAI)
export function extractTransactionsFromText(text: string): Transaction[] {
    const lines = text.split('\n');
    const transactions: Transaction[] = [];

    // Regex for date (MM/DD/YYYY or similar) and amount
    // This is very basic and specific to a generic format. 
    // Real world bank statements vary wildly.
    // We will rely on OpenAI for robust extraction later.

    return transactions;
}

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
