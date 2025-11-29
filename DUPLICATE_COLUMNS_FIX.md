# Duplicate Columns Fix

## Problem
The transaction table was showing duplicate columns:
- "Withdrawal Amt." AND "withdrawal"
- "Deposit Amt." AND "deposit"

This created visual clutter and confusion in the transaction table.

## Root Cause

In `hooks/useTransactions.ts`, when fetching transactions from Supabase and mapping them to the Transaction type, the code was creating BOTH:

1. **Original column names** from CSV files: `Withdrawal Amt.`, `Deposit Amt.`
2. **Normalized column names**: `withdrawal`, `deposit`

```typescript
// OLD CODE (Lines 48-62)
const mappedTransactions: Transaction[] = data.map(row => ({
    date: row.date,
    description: row.description,
    'Withdrawal Amt.': row.type === 'expense' ? row.amount : 0,  // ← Original
    'Deposit Amt.': row.type === 'income' ? row.amount : 0,      // ← Original
    withdrawal: row.type === 'expense' ? row.amount : 0,         // ← Duplicate!
    deposit: row.type === 'income' ? row.amount : 0,             // ← Duplicate!
    type: row.type,
    category: row.category,
    // ...
}));
```

Since the `TransactionTable` component displays ALL columns (except hidden ones), both sets of columns were showing up.

## Solution

### 1. **Removed Duplicate Column Creation** (`hooks/useTransactions.ts`)

Removed the normalized `withdrawal` and `deposit` columns since they're redundant:

```typescript
// NEW CODE
const mappedTransactions: Transaction[] = data.map(row => ({
    date: row.date,
    description: row.description,
    amount: row.amount,
    'Withdrawal Amt.': row.type === 'expense' ? row.amount : 0,
    'Deposit Amt.': row.type === 'income' ? row.amount : 0,
    // ✓ Removed: withdrawal, deposit
    type: row.type,
    category: row.category,
    // ...
}));
```

### 2. **Hidden Redundant Columns** (`components/TransactionTable.tsx`)

Added these columns to the `hiddenColumns` list so they won't display even if they exist:

```typescript
const hiddenColumns = [
    'id', 
    'merchant_name', 
    'merchantName', 
    'user_email', 
    'created_at', 
    'merchant_icon', 
    'merchantIcon', 
    'bank_name', 
    'bankName',
    'Withdrawal Amt.',  // ← Hidden (redundant with type + amount)
    'Deposit Amt.',     // ← Hidden (redundant with type + amount)
    'withdrawal',       // ← Hidden (normalized version)
    'deposit'           // ← Hidden (normalized version)
];
```

## Why Hide Withdrawal/Deposit Columns?

These columns are **redundant** because:

1. **`type` column** already shows if it's "income" or "expense"
2. **`amount` column** already shows the transaction amount
3. Having separate Withdrawal/Deposit columns just duplicates information

## Result

The transaction table now shows a **cleaner, more concise** set of columns:

### Before:
```
| Date | Description | Category | Type | Amount | Withdrawal Amt. | Deposit Amt. | withdrawal | deposit |
```

### After:
```
| Date | Description | Narration | Category | Type | Amount |
```

Much cleaner! 🎉

## Backward Compatibility

The code that reads these columns (in various lib files like `insights.ts`, `goals.ts`, etc.) uses fallback logic:

```typescript
const withdrawal = parseAmount(
    t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0
);
```

So even though we removed the duplicate columns, the code will still work because it checks multiple possible column names.

## Files Modified

1. `/Users/achkiran/Desktop/prj/hooks/useTransactions.ts`
   - Lines 48-62: Removed duplicate `withdrawal` and `deposit` columns

2. `/Users/achkiran/Desktop/prj/components/TransactionTable.tsx`
   - Lines 120-137: Added Withdrawal/Deposit columns to hidden list
