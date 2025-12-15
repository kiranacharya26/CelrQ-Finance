import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ChartSkeleton() {
    return (
        <Card className="h-full w-full overflow-hidden">
            <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-[140px]" />
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full flex items-end gap-2">
                    {[45, 78, 32, 65, 89, 54, 72].map((height, i) => (
                        <Skeleton key={i} className="w-full" style={{ height: `${height}%` }} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function StatsSkeleton() {
    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="w-full overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[120px] mb-2" />
                        <Skeleton className="h-3 w-[80px]" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function TransactionStatsSkeleton() {
    return (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[140px] mb-2" />
                        <Skeleton className="h-3 w-[90px]" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function InsightSkeleton() {
    return (
        <Card className="h-full w-full overflow-hidden">
            <CardHeader>
                <Skeleton className="h-6 w-[140px]" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[95%]" />
                    <Skeleton className="h-4 w-[85%]" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                </div>
            </CardContent>
        </Card>
    );
}

export function TableSkeleton() {
    return (
        <Card className="w-full overflow-hidden">
            <CardHeader>
                <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-9 w-[250px]" />
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-[100px]" />
                            <Skeleton className="h-9 w-[100px]" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between space-y-2">
                <Skeleton className="h-8 w-[200px]" />
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-9 w-[100px]" />
                    <Skeleton className="h-9 w-[100px]" />
                </div>
            </div>

            {/* Stats Skeleton */}
            <StatsSkeleton />

            {/* Main Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Left Column (Charts & Budgets) - Spans 2 cols */}
                <div className="lg:col-span-2 space-y-6 w-full">
                    {/* Budget Manager Skeleton */}
                    <Card className="h-[200px] w-full">
                        <CardHeader><Skeleton className="h-6 w-[150px]" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>

                    {/* Charts Skeletons (Stacked) */}
                    <Card className="h-[400px] w-full">
                        <CardHeader><Skeleton className="h-6 w-[200px]" /></CardHeader>
                        <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
                    </Card>
                    <Card className="h-[400px] w-full">
                        <CardHeader><Skeleton className="h-6 w-[200px]" /></CardHeader>
                        <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
                    </Card>
                </div>

                {/* Right Column (Sidebar) - Spans 1 col */}
                <div className="space-y-6 w-full">
                    {/* Goal Tracker Skeleton */}
                    <Card className="h-[250px] w-full">
                        <CardHeader><Skeleton className="h-6 w-[150px]" /></CardHeader>
                        <CardContent><Skeleton className="h-[150px] w-full" /></CardContent>
                    </Card>

                    {/* Insights Skeleton */}
                    <Card className="h-[200px] w-full">
                        <CardHeader><Skeleton className="h-6 w-[150px]" /></CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[80%]" />
                            <Skeleton className="h-4 w-[90%]" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export function TransactionsSkeleton() {
    return (
        <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pt-4 sm:pt-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-4 w-[150px] mt-1" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-[140px]" />
                    <Skeleton className="h-9 w-[140px]" />
                    <Skeleton className="h-9 w-9" />
                </div>
            </div>

            <TransactionStatsSkeleton />

            {/* Filters Skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-9 w-full" />
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                    <Skeleton className="h-9 w-full sm:w-[180px]" />
                    <Skeleton className="h-9 w-full sm:w-[180px]" />
                    <Skeleton className="h-9 w-full sm:w-[180px]" />
                </div>
            </div>

            <TableSkeleton />
        </div>
    );
}

