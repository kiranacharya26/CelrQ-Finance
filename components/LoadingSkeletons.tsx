import { Card } from "@/components/ui/card";

export function DashboardSkeleton() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-9 w-48 bg-muted rounded"></div>
                <div className="flex items-center space-x-2">
                    <div className="h-10 w-[180px] bg-muted rounded"></div>
                    <div className="h-10 w-[200px] bg-muted rounded"></div>
                    <div className="h-10 w-10 bg-muted rounded"></div>
                </div>
            </div>

            {/* Hero Stats Skeleton */}
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6">
                        <div className="space-y-2">
                            <div className="h-4 w-24 bg-muted rounded"></div>
                            <div className="h-8 w-32 bg-muted rounded"></div>
                            <div className="h-3 w-20 bg-muted rounded"></div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid gap-6 md:grid-cols-7">
                <div className="md:col-span-4 space-y-6">
                    <Card className="p-6">
                        <div className="h-[300px] bg-muted rounded"></div>
                    </Card>
                </div>
                <div className="md:col-span-3 space-y-6">
                    <Card className="p-6">
                        <div className="h-[200px] bg-muted rounded"></div>
                    </Card>
                    <Card className="p-6">
                        <div className="h-[200px] bg-muted rounded"></div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export function TransactionsSkeleton() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-9 w-48 bg-muted rounded"></div>
                <div className="flex items-center space-x-2">
                    <div className="h-10 w-[180px] bg-muted rounded"></div>
                    <div className="h-10 w-[200px] bg-muted rounded"></div>
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6">
                        <div className="space-y-2">
                            <div className="h-4 w-24 bg-muted rounded"></div>
                            <div className="h-8 w-32 bg-muted rounded"></div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Filters Skeleton */}
            <div className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-[180px] bg-muted rounded"></div>
                ))}
            </div>

            {/* Table Skeleton */}
            <Card className="p-6">
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-muted rounded"></div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
