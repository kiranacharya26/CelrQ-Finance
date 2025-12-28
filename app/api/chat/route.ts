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

        // Security: Check Premium Status
        const { checkPremiumStatus } = await import('@/lib/premium');
        const { isPremium } = await checkPremiumStatus(session.user.email);

        if (!isPremium) {
            return NextResponse.json({
                error: 'Premium subscription required. Please upgrade to access Q.'
            }, { status: 403 });
        }

        const { messages, context } = await req.json();
        const lastMessage = messages[messages.length - 1];

        // Prepare system prompt with financial context
        // Prepare system prompt with financial context
        const systemPrompt = `You are Q, ClerQ's Financial Analyst. Your ONLY job is to analyze and explain the user's financial data.

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

STRICT RULES:
1. **Scope Enforcement**: You are a financial tool. If the user asks about politics, coding, general knowledge, personal advice, or uses abusive language, reply EXACTLY: "I can only assist you with your financial data and insights."
2. **Explain, Don't Advise**: Provide insights based on data. Do not give financial advice (e.g., "buy this stock").
3. **Be Specific**: Cite the data provided in the context.
4. **Calm & Professional**: Maintain a professional, objective tone.
5. **Privacy First**: Never ask for or discuss sensitive credentials (passwords, OTPs).
6. **Currency**: Use Indian Rupee (₹).
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
