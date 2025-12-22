import { Transaction } from '@/types';
import { identifySubscriptions } from './recurring';

export interface CashFlowPoint {
    date: string;
    predictedBalance: number;
    expectedTransactions: {
        name: string;
        amount: number;
        type: 'income' | 'expense';
    }[];
}

/**
 * Predicts cash flow for the next 30 days.
 */
export function predictCashFlow(
    transactions: Transaction[],
    currentBalance: number = 0
): CashFlowPoint[] {
    const subscriptions = identifySubscriptions(transactions);
    const incomePatterns = transactions.filter(t => t.type === 'income');

    // Identify recurring income (e.g., Salary)
    const recurringIncome = identifySubscriptions(incomePatterns);

    const predictions: CashFlowPoint[] = [];
    const today = new Date();
    let runningBalance = currentBalance;

    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const expectedTxs: CashFlowPoint['expectedTransactions'] = [];

        // Check for expected subscriptions/bills
        subscriptions.forEach(sub => {
            if (sub.nextDate === dateStr) {
                expectedTxs.push({
                    name: sub.name,
                    amount: sub.amount,
                    type: 'expense'
                });
                runningBalance -= sub.amount;
            }
        });

        // Check for expected income
        recurringIncome.forEach(inc => {
            if (inc.nextDate === dateStr) {
                expectedTxs.push({
                    name: inc.name,
                    amount: inc.amount,
                    type: 'income'
                });
                runningBalance += inc.amount;
            }
        });

        predictions.push({
            date: dateStr,
            predictedBalance: runningBalance,
            expectedTransactions: expectedTxs
        });
    }

    return predictions;
}
