import Papa from 'papaparse';
import { Transaction } from '@/types';
import { parseDate } from './dateParser';


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
    // Use raw: true to get actual numbers (preserving decimals) instead of formatted strings
    const rawData = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex, defval: "", raw: true });

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

// @ts-ignore
import PDFParser from 'pdf2json';
import { openai } from './categorizer';

export async function parsePDF(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true); // true = enable text content extraction

        pdfParser.on("pdfParser_dataError", (errData: any) => {
            console.error('PDF Parser Error:', errData.parserError);
            reject(new Error(errData.parserError));
        });

        pdfParser.on("pdfParser_dataReady", async (pdfData: any) => {
            try {
                // Extract raw text content
                const text = pdfParser.getRawTextContent();

                if (!text || text.trim().length === 0) {
                    reject(new Error('PDF is empty or could not be read'));
                    return;
                }

                // Limit text to first 30000 chars
                const truncatedText = text.slice(0, 30000);
                console.log(`📄 PDF Text extracted (${text.length} chars). Sending to AI...`);

                if (!openai) {
                    reject(new Error('OpenAI API key not configured'));
                    return;
                }

                const prompt = `
**TASK**: Extract financial transactions from the following BANK STATEMENT text into a JSON array.

**INPUT TEXT**:
"""
${truncatedText}
"""

**INSTRUCTIONS**:
1. Identify the main transaction table. Ignore headers, footers, legal text, and summary tables.
2. Extract: Date, Description (Narration), Withdrawal Amount (Debit), and Deposit Amount (Credit).
3. **Date**: Convert to YYYY-MM-DD format.
4. **Withdrawal**: The amount debited/withdrawn. If none, set to 0.
5. **Deposit**: The amount credited/deposited. If none, set to 0.
6. **Description**: Combine multi-line descriptions into one string. Clean up extra spaces.

**OUTPUT FORMAT**:
Return ONLY a JSON object with a "transactions" key containing the array.
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Transaction details...",
      "withdrawal": 100.00,
      "deposit": 0
    },
    {
      "date": "YYYY-MM-DD",
      "description": "Salary",
      "withdrawal": 0,
      "deposit": 5000.00
    }
  ]
}
`;

                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You are a precise data extraction assistant. You convert unstructured bank statement text into structured JSON." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0,
                    response_format: { type: "json_object" }
                });

                const content = response.choices[0].message.content;
                if (!content) {
                    reject(new Error('AI returned empty response'));
                    return;
                }

                const parsed = JSON.parse(content);

                if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
                    reject(new Error('AI failed to extract transactions array'));
                    return;
                }

                console.log(`✅ AI extracted ${parsed.transactions.length} transactions from PDF`);
                resolve(parsed.transactions);

            } catch (error) {
                console.error('Error processing PDF text with AI:', error);
                reject(error);
            }
        });

        // Parse the buffer
        pdfParser.parseBuffer(buffer);
    });
}

export { parseDate } from './dateParser';
