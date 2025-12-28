'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransactionsContext } from '@/context/TransactionsContext';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Calendar, X, Landmark, CalendarDays } from 'lucide-react';
import { NavbarActions } from './NavbarActions';

export function MobileFilterBar() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { availableBanks, availableMonths } = useTransactionsContext();

    const selectedBank = searchParams.get('bank') || 'all';
    const selectedMonth = searchParams.get('month') || 'All Months';
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const hasRange = fromParam || toParam;

    // Show on all protected pages
    const protectedRoutes = ['/dashboard', '/transactions', '/insights'];
    if (!protectedRoutes.some(route => pathname.startsWith(route))) {
        return null;
    }

    const handleBankChange = (bank: string) => {
        const params = new URLSearchParams(searchParams);
        if (bank && bank !== 'all') params.set('bank', bank);
        else params.delete('bank');
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleMonthChange = (month: string) => {
        const params = new URLSearchParams(searchParams);
        if (month && month !== 'All Months') {
            params.set('month', month);
            params.delete('from');
            params.delete('to');
        } else {
            params.delete('month');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleDateRangeChange = (type: 'from' | 'to', value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(type, value);
            params.delete('month');
        } else {
            params.delete(type);
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    const clearRange = () => {
        const params = new URLSearchParams(searchParams);
        params.delete('from');
        params.delete('to');
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="md:hidden flex items-center gap-2 px-4 py-2 overflow-x-auto no-scrollbar bg-background/80 backdrop-blur-md border-b relative">
            <div className="flex items-center gap-2 flex-1">
                {/* Bank Filter Chip */}
                <Select value={selectedBank} onValueChange={handleBankChange}>
                    <SelectTrigger className="h-8 w-auto min-w-[100px] gap-1.5 px-3 rounded-full bg-secondary/50 border-none text-xs font-medium">
                        <Landmark className="h-3 w-3 text-muted-foreground" />
                        <SelectValue placeholder="Bank" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Banks</SelectItem>
                        {availableBanks.map(bank => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Month Filter Chip */}
                <Select value={selectedMonth} onValueChange={handleMonthChange}>
                    <SelectTrigger className="h-8 w-auto min-w-[100px] gap-1.5 px-3 rounded-full bg-secondary/50 border-none text-xs font-medium">
                        <CalendarDays className="h-3 w-3 text-muted-foreground" />
                        <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <SelectItem value="All Months">All Months</SelectItem>
                        {availableMonths.map(month => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Date Range Chip */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="secondary"
                            size="sm"
                            className={`h-8 rounded-full gap-1.5 px-3 border-none text-xs font-medium ${hasRange ? 'bg-primary/10 text-primary' : 'bg-secondary/50'}`}
                        >
                            <Calendar className="h-3 w-3" />
                            <span>{hasRange ? "Custom" : "Range"}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-3 mt-2">
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">From Month</label>
                                <Input
                                    type="month"
                                    value={fromParam || ''}
                                    onChange={(e) => handleDateRangeChange('from', e.target.value)}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">To Month</label>
                                <Input
                                    type="month"
                                    value={toParam || ''}
                                    onChange={(e) => handleDateRangeChange('to', e.target.value)}
                                    className="h-9 text-sm"
                                />
                            </div>
                            {hasRange && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearRange}
                                    className="w-full text-xs h-8"
                                >
                                    <X className="h-3 w-3 mr-2" />
                                    Clear Range
                                </Button>
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Filter Icon (Actions) */}
            <div className="flex-shrink-0 border-l pl-2">
                <NavbarActions mobile={true} />
            </div>
        </div>
    );
}
