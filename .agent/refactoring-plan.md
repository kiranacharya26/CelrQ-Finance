# Codebase Refactoring Plan

## Objective
Break down large files into smaller, focused components and custom hooks with clean state management.

## Phase 1: Custom Hooks Extraction

### 1.1 Chart Data Processing Hook
- **File**: `hooks/useChartData.ts`
- **Purpose**: Extract data processing logic from DashboardCharts
- **Responsibilities**:
  - Parse amounts and dates
  - Process transactions for charts
  - Calculate category and monthly data
  - Apply filters

### 1.2 Month Range Filter Hook
- **File**: `hooks/useMonthRangeFilter.ts`
- **Purpose**: Manage month range filtering state
- **Responsibilities**:
  - Month range state
  - Filter logic
  - Clear filter function

### 1.3 Transaction Table Hook
- **File**: `hooks/useTransactionTable.ts`
- **Purpose**: Extract table logic from TransactionTable
- **Responsibilities**:
  - Pagination state
  - Selection state
  - Category management
  - Sorting logic

## Phase 2: Component Breakdown

### 2.1 DashboardCharts Components
Break `components/DashboardCharts.tsx` into:
- `components/charts/SpendingByCategory.tsx` - Bar chart
- `components/charts/TopCategoriesPie.tsx` - Pie chart with legend
- `components/charts/MonthlyExpenses.tsx` - Monthly trend chart
- `components/charts/ChartTooltip.tsx` - Reusable tooltip
- `components/charts/MonthRangeFilter.tsx` - Reusable filter dropdown

### 2.2 TransactionTable Components
Break `components/TransactionTable.tsx` into:
- `components/transactions/TransactionTableDesktop.tsx` - Desktop table view
- `components/transactions/TransactionCardMobile.tsx` - Mobile card view
- `components/transactions/TransactionPagination.tsx` - Pagination controls
- `components/transactions/CategorySelector.tsx` - Category dropdown
- `components/transactions/BulkActions.tsx` - Bulk action toolbar

### 2.3 Dashboard Page Components
Break `app/dashboard/page.tsx` into:
- `components/dashboard/DashboardHeader.tsx` - Header with filters
- `components/dashboard/DashboardStats.tsx` - Hero stats cards
- `components/dashboard/DashboardLayout.tsx` - Main layout wrapper

### 2.4 Transactions Page Components
Break `app/transactions/page.tsx` into:
- `components/transactions/TransactionsHeader.tsx` - Header with controls
- `components/transactions/TransactionStats.tsx` - Stats cards
- `components/transactions/TransactionFilters.tsx` - Filter controls

## Phase 3: Utility Functions

### 3.1 Data Parsing Utilities
- **File**: `lib/dataParser.ts`
- **Functions**:
  - `parseAmount(val: any): number`
  - `parseDate(val: any): Date | null`
  - `parseTransactionType(transaction: any): 'income' | 'expense'`

### 3.2 Chart Utilities
- **File**: `lib/chartUtils.ts`
- **Functions**:
  - `sortByValue(data: any[]): any[]`
  - `formatCurrency(amount: number): string`
  - `getChartColors(): string[]`

## Phase 4: State Management

### 4.1 Context Providers (if needed)
- `contexts/FilterContext.tsx` - Global filter state
- `contexts/TransactionContext.tsx` - Transaction data state

## Implementation Order

1. ✅ Create utility functions (lib/dataParser.ts, lib/chartUtils.ts)
2. ✅ Create custom hooks (useChartData, useMonthRangeFilter, useTransactionTable)
3. ✅ Break down DashboardCharts into sub-components
4. ⚠️ Break down TransactionTable into sub-components (Partially done: Pagination extracted)
5. ✅ Refactor Dashboard page
6. ✅ Refactor Transactions page
7. ✅ Test and verify all functionality works

## Benefits

- **Maintainability**: Smaller, focused files are easier to understand and modify
- **Reusability**: Components and hooks can be reused across the app
- **Testability**: Smaller units are easier to test
- **Performance**: Can optimize individual components
- **Collaboration**: Multiple developers can work on different components
- **Type Safety**: Better TypeScript support with focused interfaces

## File Size Targets

- Components: < 200 lines
- Hooks: < 150 lines
- Utilities: < 100 lines per function
