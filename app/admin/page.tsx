'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Users,
    CreditCard,
    Cpu,
    FileText,
    TrendingUp,
    DollarSign,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCcw,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface AdminStats {
    totalRevenue: number;
    totalAICostUSD: number;
    totalTokens: number;
    userCount: number;
    totalUploads: number;
    totalTransactions: number;
    profitMargin: number;
    accuracyRate: number;
    totalCorrections: number;
}

interface TopMiss {
    merchant: string;
    count: number;
    from: string;
    to: string;
}

interface PaymentRecord {
    id: string;
    order_id: string;
    email: string;
    amount: number;
    status: string;
    created_at: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
    const [topMisses, setTopMisses] = useState<TopMiss[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            setRefreshing(true);
            const res = await fetch('/api/admin/stats');
            if (!res.ok) throw new Error('Failed to fetch admin stats');
            const data = await res.json();
            setStats(data.stats);
            setRecentPayments(data.recentPayments || []);
            setTopMisses(data.topMisses || []);
        } catch (error) {
            toast.error('Unauthorized or API Error');
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="p-8 space-y-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
                <Button onClick={() => window.location.href = '/'}>Go Home</Button>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
                    <p className="text-muted-foreground">Real-time overview of CelrQ's performance and costs.</p>
                </div>
                <Button
                    variant="outline"
                    onClick={fetchStats}
                    disabled={refreshing}
                    className="shadow-sm"
                >
                    <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh Data
                </Button>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-md bg-gradient-to-br from-blue-500/10 to-transparent">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                            Lifetime earnings
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-purple-500/10 to-transparent">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">AI Burn Rate</CardTitle>
                        <Cpu className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalAICostUSD.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.totalTokens.toLocaleString()} tokens used
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-green-500/10 to-transparent">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.userCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Unique transacting users
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-orange-500/10 to-transparent">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                        <Activity className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.profitMargin.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            After AI costs (est.)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            AI Accuracy
                        </CardTitle>
                        <CardDescription>How often users keep the AI's guess.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <div className="relative h-32 w-32">
                            <svg className="h-full w-full" viewBox="0 0 36 36">
                                <path
                                    className="text-muted stroke-current"
                                    strokeWidth="3"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="text-blue-500 stroke-current"
                                    strokeWidth="3"
                                    strokeDasharray={`${stats.accuracyRate}, 100`}
                                    strokeLinecap="round"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-2xl font-bold">{stats.accuracyRate.toFixed(1)}%</span>
                                <span className="text-[10px] text-muted-foreground uppercase">Accuracy</span>
                            </div>
                        </div>
                        <div className="mt-6 w-full space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Transactions</span>
                                <span className="font-medium">{stats.totalTransactions}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Manual Corrections</span>
                                <span className="font-medium text-orange-500">{stats.totalCorrections}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Top AI Misses</CardTitle>
                        <CardDescription>Merchants users corrected most often.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topMisses.length > 0 ? topMisses.map((miss, i) => (
                                <div key={i} className="flex flex-col gap-1 p-2 rounded-md bg-muted/20">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold truncate max-w-[150px]">{miss.merchant}</span>
                                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                            {miss.count} fixes
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-muted-foreground line-through">{miss.from}</span>
                                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                                        <span className="text-blue-600 font-medium">{miss.to}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <Activity className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-xs">No corrections tracked yet.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>System Health</CardTitle>
                        <CardDescription>Overall platform statistics.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Total Transactions</p>
                                <p className="text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-500" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Total Uploads</p>
                                <p className="text-2xl font-bold">{stats.totalUploads.toLocaleString()}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-purple-500" />
                            </div>
                        </div>
                        <div className="pt-4 border-t">
                            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                All systems operational
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Payments</CardTitle>
                    <CardDescription>The last 10 payment attempts in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentPayments.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-background border">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium truncate max-w-[200px]">{payment.order_id}</p>
                                        <p className="text-xs text-muted-foreground">{payment.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold">₹{payment.amount}</p>
                                    <p className={`text-[10px] font-medium ${payment.status === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                                        {payment.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
