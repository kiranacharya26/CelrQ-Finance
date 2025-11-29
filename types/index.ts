// Core Transaction Types
export interface Transaction {
    date?: string;
    description?: string;
    narration?: string;
    particulars?: string;
    amount?: number | string;
    deposit?: number | string;
    withdrawal?: number | string;
    credit?: number | string;
    debit?: number | string;
    balance?: number | string;
    category?: string;
    _description?: string;
    [key: string]: any; // For dynamic CSV columns
}

// Bank Data Structure
export interface BankData {
    [bankName: string]: Transaction[];
}

// Transaction Note
export interface TransactionNote {
    note: string;
    tags: string[];
    timestamp: number;
}

// User Storage Keys
export type StorageKey =
    | 'bankTransactions'
    | 'transactions'
    | 'currentBank'
    | 'learnedKeywords'
    | 'customCategories'
    | 'transactionNotes'
    | 'budgets';

// Learned Keywords Structure
export interface LearnedKeywords {
    [category: string]: string[];
}

// Budget Structure
export interface Budget {
    category: string;
    limit: number;
    spent: number;
    period: 'monthly' | 'yearly';
}

// Date Range
export interface DateRange {
    from: Date | null;
    to: Date | null;
}

// Filter State
export interface TransactionFilters {
    searchQuery: string;
    categoryFilter: string;
    tagFilter: string;
    sortBy: string;
    dateRange: DateRange;
}

// Chart Data
export interface ChartDataPoint {
    name: string;
    value: number;
    fill?: string;
}

// Recurring Transaction Pattern
export interface RecurringPattern {
    merchantName: string;
    amount: number;
    frequency: 'weekly' | 'monthly' | 'yearly';
    indices: number[];
}

// API Response Types
export interface CategorizationResponse {
    results: Transaction[];
    newlyLearnedKeywords: LearnedKeywords;
}

export interface UploadResponse {
    transactions: Transaction[];
    newlyLearnedKeywords?: LearnedKeywords;
    message?: string;
}

// Component Props Types
export interface TransactionTableProps {
    transactions: Transaction[];
    onCategoryChange?: (index: number, newCategory: string) => void;
}

export interface DashboardChartsProps {
    transactions: Transaction[];
    amountKey?: string;
    depositKey?: string;
    withdrawalKey?: string;
    categoryKey?: string;
    dateKey?: string;
}

export interface FileUploadProps {
    onUploadSuccess?: () => void;
}

// Auth Types
export interface UserSession {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    expires: string;
}
