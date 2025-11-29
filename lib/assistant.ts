import { Transaction } from '@/types';
import { Goal } from './goals';
import { Insights } from './insights';
import { format } from 'date-fns';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    relatedData?: any; // For showing charts or specific transactions
}

export interface AssistantContext {
    transactions: Transaction[];
    goals: Goal[];
    insights?: Insights;
}

type Intent =
    | 'GREETING'
    | 'GET_SPENDING'
    | 'LIST_TRANSACTIONS'
    | 'CHECK_BUDGET'
    | 'CHECK_GOALS'
    | 'ADVICE'
    | 'UNKNOWN';

interface ParsedQuery {
    intent: Intent;
    entities: {
        category?: string;
        merchant?: string;
        period?: 'this_month' | 'last_month' | 'recent';
        limit?: number;
    };
}

// Helper to parse amount
const parseAmount = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val || val === '') return 0;
    const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
    return isNaN(parsed) ? 0 : parsed;
};

// Simple intent recognition logic
function parseQuery(query: string): ParsedQuery {
    const lowerQuery = query.toLowerCase();
    const entities: ParsedQuery['entities'] = {
        period: 'this_month',
        limit: 5
    };

    // Detect period
    if (lowerQuery.includes('last month')) entities.period = 'last_month';
    if (lowerQuery.includes('recent') || lowerQuery.includes('latest')) entities.period = 'recent';

    // Detect intent
    if (/\b(hi|hello|hey|greetings)\b/.test(lowerQuery)) {
        return { intent: 'GREETING', entities };
    }

    if (/\b(spend|spent|cost|expense|much)\b/.test(lowerQuery)) {
        // Extract category or merchant
        // This is a basic extraction, can be improved
        if (lowerQuery.includes('food') || lowerQuery.includes('dining') || lowerQuery.includes('swiggy') || lowerQuery.includes('zomato')) {
            entities.category = 'Restaurants & Dining';
        } else if (lowerQuery.includes('grocery') || lowerQuery.includes('groceries') || lowerQuery.includes('blinkit') || lowerQuery.includes('zepto')) {
            entities.category = 'Groceries';
        } else if (lowerQuery.includes('shopping') || lowerQuery.includes('amazon') || lowerQuery.includes('flipkart')) {
            entities.category = 'Online Shopping';
        } else if (lowerQuery.includes('travel') || lowerQuery.includes('uber') || lowerQuery.includes('ola')) {
            entities.category = 'Ride Services';
        }

        return { intent: 'GET_SPENDING', entities };
    }

    if (/\b(show|list|see)\b.*\b(transactions|payments|history)\b/.test(lowerQuery)) {
        return { intent: 'LIST_TRANSACTIONS', entities };
    }

    if (/\b(goal|save|saving|target)\b/.test(lowerQuery)) {
        return { intent: 'CHECK_GOALS', entities };
    }

    if (/\b(advice|tip|help|save money)\b/.test(lowerQuery)) {
        return { intent: 'ADVICE', entities };
    }

    return { intent: 'UNKNOWN', entities };
}

export function processQuery(query: string, context: AssistantContext): Message {
    const { intent, entities } = parseQuery(query);
    const { transactions, goals } = context;

    let responseText = '';
    let relatedData = null;

    switch (intent) {
        case 'GREETING':
            responseText = "Hello! I'm your Smart Money Assistant. I can help you track your spending, check your goals, or give you financial insights. What would you like to know?";
            break;

        case 'GET_SPENDING':
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
            const relevantTransactions = transactions.filter(t => {
                // Filter by period (simplified to current month for now unless specified)
                // In a real app, we'd parse dates more robustly
                return true;
            });

            if (entities.category) {
                const total = relevantTransactions
                    .filter(t =>
                        (t.Category === entities.category || t.category === entities.category) ||
                        (t.Narration?.toLowerCase().includes(entities.category!.toLowerCase()))
                    )
                    .reduce((sum, t) => sum + parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0), 0);

                responseText = `You've spent ₹${total.toLocaleString('en-IN')} on ${entities.category} recently.`;
            } else {
                const total = relevantTransactions
                    .reduce((sum, t) => sum + parseAmount(t['Withdrawal Amt.'] || t.withdrawal || t.debit || 0), 0);
                responseText = `Your total spending is ₹${total.toLocaleString('en-IN')}.`;
            }
            break;

        case 'LIST_TRANSACTIONS':
            const recent = transactions.slice(0, entities.limit);
            responseText = "Here are your most recent transactions:";
            relatedData = { type: 'transaction_list', data: recent };
            break;

        case 'CHECK_GOALS':
            if (goals.length === 0) {
                responseText = "You haven't set any financial goals yet. Would you like to set one?";
            } else {
                const onTrackCount = goals.filter(g => {
                    const progress = (g.currentAmount / g.targetAmount) * 100;
                    return progress >= 50; // Simplified logic
                }).length;
                responseText = `You have ${goals.length} active goals. ${onTrackCount} of them are on track!`;
                relatedData = { type: 'goals_list', data: goals };
            }
            break;

        case 'ADVICE':
            responseText = "Based on your spending, here's a tip: Try to follow the 50/30/20 rule. 50% for needs, 30% for wants, and 20% for savings. Also, check if you have any recurring subscriptions you don't use anymore!";
            break;

        case 'UNKNOWN':
        default:
            responseText = "I'm not sure I understood that. You can ask me about your spending on specific categories (e.g., 'How much did I spend on food?'), check your recent transactions, or ask about your savings goals.";
            break;
    }

    return {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        relatedData
    };
}
