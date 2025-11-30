'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Sparkles, TrendingUp, Target, Wallet } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Message } from '@/lib/assistant';
import { useTransactions } from '@/hooks/useTransactions';
import { useGoals } from '@/lib/goals';
import { cn } from '@/lib/utils';

export function ChatInterface() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! I'm your Smart Money Assistant. Ask me anything about your finances!",
            timestamp: new Date(),
        },
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { transactions } = useTransactions({
        userEmail: session?.user?.email || '',
        selectedBank: 'all'
    });
    const { goals } = useGoals();
    const [isPremium, setIsPremium] = useState(false);



    useEffect(() => {
        const checkPremiumStatus = async () => {
            if (session?.user?.email) {
                try {
                    const res = await fetch(`/api/payment/status?email=${session.user.email}`);
                    const data = await res.json();
                    setIsPremium(data.hasPaid || false);
                } catch (error) {
                    console.error('Failed to check premium status:', error);
                }
            }
        };
        checkPremiumStatus();
    }, [session?.user?.email]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputValue('');
        setIsTyping(true);

        try {
            // 1. Prepare Context Summary
            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

            const totalExpenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

            // Top Categories
            const expensesByCategory: Record<string, number> = {};
            transactions
                .filter(t => t.type === 'expense')
                .forEach(t => {
                    const cat = t.category || 'Uncategorized';
                    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (Number(t.amount) || 0);
                });

            const topCategories = Object.entries(expensesByCategory)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([category, amount]) => ({ category, amount }));

            const contextSummary = {
                summary: {
                    totalIncome,
                    totalExpenses,
                    netSavings: totalIncome - totalExpenses,
                    topCategories
                },
                recentTransactions: transactions.slice(0, 5).map(t => ({
                    date: t.date,
                    description: t.description || t.Narration,
                    amount: Number(t.amount) || Number(t['Withdrawal Amt.']) || Number(t.withdrawal) || 0,
                    category: t.category || 'Uncategorized'
                })),
                goals: goals.map(g => ({
                    name: g.name,
                    currentAmount: g.currentAmount,
                    targetAmount: g.targetAmount,
                    deadline: g.targetDate
                }))
            };

            // 2. Call API
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                    context: contextSummary
                })
            });

            if (!res.ok) throw new Error('Failed to get response');

            const data = await res.json();
            setMessages(prev => [...prev, { ...data, id: Date.now().toString() }]);

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again later.",
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(inputValue);
        }
    };

    const suggestions = [
        { label: 'Spending on Food', icon: '🍔', query: 'How much did I spend on food?' },
        { label: 'Recent Transactions', icon: '💳', query: 'Show me recent transactions' },
        { label: 'My Goals', icon: '🎯', query: 'Check my goals' },
        { label: 'Financial Advice', icon: '💡', query: 'Give me some advice' },
    ];

    if (!session || !isPremium) return null;

    return (
        <>
            {/* Floating Action Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all duration-300 z-50",
                    isOpen ? "rotate-90 scale-0 opacity-0" : "scale-100 opacity-100"
                )}
                size="icon"
                aria-label="Toggle chat assistant"
            >
                <Sparkles className="h-6 w-6" />
            </Button>

            {/* Chat Window */}
            <div
                className={cn(
                    "fixed bottom-6 right-6 z-50 flex flex-col transition-all duration-300 ease-in-out origin-bottom-right",
                    isOpen
                        ? "w-[380px] h-[600px] opacity-100 scale-100 translate-y-0"
                        : "w-[0px] h-[0px] opacity-0 scale-50 translate-y-10 pointer-events-none"
                )}
            >
                <Card className="flex flex-col h-full shadow-2xl border-primary/20 overflow-hidden">
                    {/* Header */}
                    <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-2 rounded-full">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Smart Assistant</h3>
                                <p className="text-xs text-primary-foreground/80">Ask me anything</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary-foreground hover:bg-white/20 rounded-full h-8 w-8"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close chat"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30" ref={scrollRef}>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full",
                                    msg.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-background border rounded-tl-none"
                                    )}
                                >
                                    {msg.content}

                                    {/* Render related data if any */}
                                    {msg.relatedData && msg.relatedData.type === 'transaction_list' && (
                                        <div className="mt-2 space-y-1">
                                            {msg.relatedData.data.slice(0, 3).map((t: any, i: number) => (
                                                <div key={i} className="text-xs bg-black/5 dark:bg-white/10 p-2 rounded flex justify-between">
                                                    <span className="truncate max-w-[120px]">{t.Narration || t.narration}</span>
                                                    <span className="font-mono">₹{t['Withdrawal Amt.'] || t.withdrawal || 0}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-background border p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
                                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Suggestions (only show if few messages) */}
                    {messages.length < 3 && (
                        <div className="px-4 pb-2">
                            <p className="text-xs text-muted-foreground mb-2 ml-1">Suggested questions:</p>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {suggestions.map((s) => (
                                    <button
                                        key={s.label}
                                        onClick={() => handleSendMessage(s.query)}
                                        className="flex items-center gap-1.5 whitespace-nowrap bg-background border px-3 py-1.5 rounded-full text-xs hover:bg-primary/5 hover:border-primary/30 transition-colors"
                                    >
                                        <span>{s.icon}</span>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-background border-t">
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="rounded-full bg-muted/50 border-transparent focus:bg-background focus:border-input transition-all"
                            />
                            <Button
                                onClick={() => handleSendMessage(inputValue)}
                                size="icon"
                                className="rounded-full shrink-0"
                                disabled={!inputValue.trim() || isTyping}
                                aria-label="Send message"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}
