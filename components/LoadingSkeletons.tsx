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
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <Skeleton className="h-8 w-[200px]" />
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-9 w-[100px]" />
                    <Skeleton className="h-9 w-[100px]" />
                </div>
            </div>
            <StatsSkeleton />
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <ChartSkeleton />
                </div>
                <div className="col-span-3">
                    <InsightSkeleton />
                </div>
            </div>
        </div>
    );
}

export function TransactionsSkeleton() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <Skeleton className="h-8 w-[200px]" />
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-9 w-[100px]" />
                </div>
            </div>
            <StatsSkeleton />
            <TableSkeleton />
        </div>
    );
}
