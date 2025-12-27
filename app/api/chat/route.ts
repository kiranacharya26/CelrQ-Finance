import { NextResponse } from 'next/server';
import { openai } from '@/lib/categorizer';

export async function POST(req: Request) {
    try {
        if (!openai) {
            return NextResponse.json({ error: 'OpenAI not configured' }, { status: 503 });
        }

        const { getServerSession } = await import('next-auth');
        const { authOptions } = await import('@/lib/auth');
        const { checkRateLimit } = await import('@/lib/rate-limit');
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate Limit: 50 chat messages per hour
        const { allowed } = await checkRateLimit(session.user.email, 'chat', 50, 1);
        if (!allowed) {
            return NextResponse.json({
                error: 'Too many messages. Please take a break and try again in an hour.'
            }, { status: 429 });
        }

        const { messages, context } = await req.json();
        const lastMessage = messages[messages.length - 1];

        // Prepare system prompt with financial context
        const systemPrompt = `You are ClerQ's Financial Narrator. Your job is to explain the user's money in plain English, not to be a generic assistant.
        
CONTEXT:
User's Financial Snapshot:
- Total Income: ₹${context.summary.totalIncome}
- Total Expenses: ₹${context.summary.totalExpenses}
- Net Savings: ₹${context.summary.netSavings}
- Top Spending Categories: ${context.summary.topCategories.map((c: any) => `${c.category} (₹${c.amount})`).join(', ')}

Recent Transactions (last 5):
${context.recentTransactions.map((t: any) => `- ${t.date}: ${t.description} (₹${t.amount}) [${t.category}]`).join('\n')}

Active Goals:
${context.goals.map((g: any) => `- ${g.name}: ₹${g.currentAmount} / ₹${g.targetAmount} (${g.deadline})`).join('\n')}

RULES:
1. **Explain, Don't Advise**: Instead of "You should save more", say "You spent 20% more on dining out this month compared to last."
2. **Be Specific**: Always cite the data. "Your expenses are high" is bad. "Your expenses are ₹${context.summary.totalExpenses}, driven by ${context.summary.topCategories[0]?.category || 'spending'}." is good.
3. **No Generic Fluff**: Do not say "Budgeting is important." Do not give generic investment advice.
4. **Calm Tone**: Be objective and non-judgmental. Reduce anxiety.
5. **Privacy First**: If asked about bank logins or sensitive data, remind them we don't store that.
6. Use Indian Rupee (₹).
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.map((m: any) => ({ role: m.role, content: m.content }))
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const reply = response.choices[0].message.content;

        // Log Usage for Admin Dashboard
        if (response.usage && context.userEmail) {
            const { prompt_tokens, completion_tokens, total_tokens } = response.usage;
            // gpt-4o-mini pricing: $0.15 / 1M input, $0.60 / 1M output
            const cost = (prompt_tokens * 0.15 / 1000000) + (completion_tokens * 0.60 / 1000000);

            const { supabaseAdmin } = await import('@/lib/supabase');
            await supabaseAdmin.from('usage_logs').insert({
                user_email: context.userEmail,
                feature: 'chat',
                model: 'gpt-4o-mini',
                prompt_tokens,
                completion_tokens,
                total_tokens,
                estimated_cost_usd: cost
            });
        }

        return NextResponse.json({
            role: 'assistant',
            content: reply,
            timestamp: new Date()
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        const isDev = process.env.NODE_ENV === 'development';
        return NextResponse.json({
            error: isDev ? (error.message || 'Internal server error') : 'An error occurred while processing your request.'
        }, { status: 500 });
    }
}
