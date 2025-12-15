import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { insights } = await req.json();

        if (!insights) {
            return NextResponse.json({ error: 'Insights data required' }, { status: 400 });
        }

        // Create a concise prompt with the key insights
        const prompt = `You are a financial advisor analyzing a user's spending data. Provide a brief, actionable summary (2-3 sentences) based on these insights:

Current Month Spending: ₹${insights.trends.currentTotal.toLocaleString('en-IN')}
Previous Month: ₹${insights.trends.previousTotal.toLocaleString('en-IN')}
Change: ${insights.trends.percentageChange.toFixed(1)}%

Top Categories:
${insights.trends.topCategories.map((c: any) => `- ${c.category}: ₹${c.amount.toLocaleString('en-IN')}`).join('\n')}

${insights.trends.biggestIncrease ? `Biggest Increase: ${insights.trends.biggestIncrease.category} (+${insights.trends.biggestIncrease.change.toFixed(0)}%)` : ''}
${insights.trends.biggestDecrease ? `Biggest Decrease: ${insights.trends.biggestDecrease.category} (${insights.trends.biggestDecrease.change.toFixed(0)}%)` : ''}

Alerts: ${insights.alerts.length > 0 ? insights.alerts.map((a: any) => a.message).join(', ') : 'None'}

Provide a natural, conversational summary highlighting the most important finding and one actionable recommendation. Keep it under 100 words.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful financial advisor. Be concise, friendly, and actionable. Use Indian Rupee (₹) format.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 200,
        });

        const summary = completion.choices[0]?.message?.content || 'Unable to generate summary at this time.';

        return NextResponse.json({ summary });
    } catch (error: any) {
        console.error('AI Summary Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate AI summary', details: error.message },
            { status: 500 }
        );
    }
}
