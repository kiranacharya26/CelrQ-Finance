import { Transaction } from '@/types';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToCSV(transactions: Transaction[]) {
    const csv = Papa.unparse(transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'transactions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function exportToPDF(transactions: Transaction[]) {
    const doc = new jsPDF();

    doc.text('ClerQ - Financial Summary', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 22);

    // Helper to parse amount
    const parseAmount = (val: any): number => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    };

    // Calculate totals from various possible fields
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
        const deposit = parseAmount(t.deposit || t.credit);
        const withdrawal = parseAmount(t.withdrawal || t.debit);
        const amount = parseAmount(t.amount);

        if (deposit > 0) totalIncome += deposit;
        if (withdrawal > 0) totalExpenses += withdrawal;
        if (!deposit && !withdrawal && amount !== 0) {
            if (amount > 0) totalIncome += amount;
            else totalExpenses += Math.abs(amount);
        }
    });

    const netSavings = totalIncome - totalExpenses;

    doc.text(`Total Income: ₹${totalIncome.toFixed(2)}`, 14, 30);
    doc.text(`Total Expenses: ₹${totalExpenses.toFixed(2)}`, 14, 35);
    doc.text(`Net Savings: ₹${netSavings.toFixed(2)}`, 14, 40);

    const tableData = transactions.map(t => [
        t.date || '',
        t.description || t.narration || t.particulars || '',
        t.category || 'Other',
        `₹${parseAmount(t.amount || t.withdrawal || t.debit).toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [['Date', 'Description', 'Category', 'Amount']],
        body: tableData,
        startY: 50,
    });

    doc.save('summary.pdf');
}
