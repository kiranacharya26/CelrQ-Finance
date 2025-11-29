import { UserStorage } from './storage';

// Transaction notes and tags utility functions

interface TransactionNote {
    signature: string; // date+description+amount hash
    note: string;
    tags: string[];
}

// Generate unique signature for a transaction
export function getTransactionSignature(transaction: any): string {
    const dateKey = Object.keys(transaction).find(k => /^date$/i.test(k));
    const descKey = Object.keys(transaction).find(k => /description|narration|particulars/i.test(k));
    const withdrawalKey = Object.keys(transaction).find(k => /withdrawal|debit/i.test(k));
    const amountKey = Object.keys(transaction).find(k => /^amount$/i.test(k));

    const date = dateKey ? transaction[dateKey] : '';
    const desc = descKey ? transaction[descKey] : '';
    let amount = '';

    if (withdrawalKey && transaction[withdrawalKey]) {
        amount = String(transaction[withdrawalKey]);
    } else if (amountKey && transaction[amountKey]) {
        amount = String(transaction[amountKey]);
    }

    return `${date}-${desc}-${amount}`.toLowerCase().replace(/\s+/g, '');
}

// Get all notes from UserStorage
export function getAllNotes(userEmail: string): Record<string, TransactionNote> {
    return UserStorage.getData(userEmail, 'transactionNotes', {});
}

// Save all notes to UserStorage
export function saveAllNotes(userEmail: string, notes: Record<string, TransactionNote>): void {
    UserStorage.saveData(userEmail, 'transactionNotes', notes);
}

// Get note for a specific transaction
export function getNote(userEmail: string, transaction: any): TransactionNote | null {
    if (!userEmail) return null;
    const signature = getTransactionSignature(transaction);
    const allNotes = getAllNotes(userEmail);
    return allNotes[signature] || null;
}

// Save note for a transaction
export function saveNote(userEmail: string, transaction: any, note: string, tags: string[]): void {
    if (!userEmail) return;
    const signature = getTransactionSignature(transaction);
    const allNotes = getAllNotes(userEmail);

    allNotes[signature] = {
        signature,
        note,
        tags
    };

    saveAllNotes(userEmail, allNotes);
}

// Delete note for a transaction
export function deleteNote(userEmail: string, transaction: any): void {
    if (!userEmail) return;
    const signature = getTransactionSignature(transaction);
    const allNotes = getAllNotes(userEmail);
    delete allNotes[signature];
    saveAllNotes(userEmail, allNotes);
}

// Get all unique tags
export function getAllTags(userEmail: string): string[] {
    if (!userEmail) return [];
    const allNotes = getAllNotes(userEmail);
    const tagsSet = new Set<string>();

    Object.values(allNotes).forEach(note => {
        note.tags.forEach(tag => tagsSet.add(tag));
    });

    return Array.from(tagsSet).sort();
}
