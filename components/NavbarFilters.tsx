'use client';

import { useState, useEffect } from 'react';
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
import { Filter, X, Calendar } from 'lucide-react';

export function NavbarFilters({ mobile = false }: { mobile?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { availableBanks, availableMonths } = useTransactionsContext();

    const selectedBank = searchParams.get('bank') || 'all';
    const selectedMonth = searchParams.get('month') || 'All Months';
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Show on all protected pages
    const protectedRoutes = ['/dashboard', '/transactions', '/insights'];
    if (!protectedRoutes.some(route => pathname.startsWith(route))) {
        return null;
    }

    const handleBankChange = (bank: string) => {
        const params = new URLSearchParams(searchParams);
        if (bank && bank !== 'all') {
            params.set('bank', bank);
        } else {
            params.delete('bank');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleMonthChange = (month: string) => {
        const params = new URLSearchParams(searchParams);
        if (month && month !== 'All Months') {
            params.set('month', month);
            // Clear specific range if month is selected
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
            // Clear month if range is selected
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

    const hasRange = fromParam || toParam;

    return (
        <div className={mobile ? "flex flex-col gap-3 py-4 border-b mb-2" : "hidden md:flex items-center gap-2"}>
            <div className={mobile ? "flex flex-col gap-1.5" : "flex items-center gap-2"}>
                {mobile && <label className="text-xs font-medium text-muted-foreground ml-1">Filter by Bank</label>}
                <Select value={selectedBank} onValueChange={handleBankChange}>
                    <SelectTrigger className={mobile ? "w-full h-10" : "h-9 w-[110px] lg:w-[130px] bg-background/50 backdrop-blur-sm border-muted-foreground/20"}>
                        <SelectValue placeholder="Bank" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Banks</SelectItem>
                        {availableBanks.map(bank => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className={mobile ? "flex flex-col gap-1.5" : "flex items-center gap-2"}>
                {mobile && <label className="text-xs font-medium text-muted-foreground ml-1">Filter by Month</label>}
                <Select value={selectedMonth} onValueChange={handleMonthChange}>
                    <SelectTrigger className={mobile ? "w-full h-10" : "h-9 w-[110px] lg:w-[130px] bg-background/50 backdrop-blur-sm border-muted-foreground/20"}>
                        <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <SelectItem value="All Months">All Months</SelectItem>
                        {availableMonths.map(month => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Date Range Filter */}
            <div className={mobile ? "flex flex-col gap-1.5" : "flex items-center gap-2"}>
                {mobile && <label className="text-xs font-medium text-muted-foreground ml-1">Custom Range</label>}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={mobile
                                ? "w-full h-10 justify-start font-normal"
                                : `h-9 ${hasRange ? 'w-[110px] lg:w-[130px]' : 'w-9 lg:w-32'} justify-start font-normal bg-background/50 backdrop-blur-sm border-muted-foreground/20`
                            }
                        >
                            <Calendar className={mobile ? "mr-2 h-4 w-4" : (hasRange ? "mr-2 h-4 w-4" : "h-4 w-4")} />
                            <span className={mobile ? "" : (hasRange ? "truncate" : "hidden lg:inline")}>
                                {hasRange ? "Custom" : "Range"}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={mobile ? "center" : "end"} className="w-64 p-3">
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">From Month</label>
                                <Input
                                    type="month"
                                    value={fromParam || ''}
                                    onChange={(e) => handleDateRangeChange('from', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">To Month</label>
                                <Input
                                    type="month"
                                    value={toParam || ''}
                                    onChange={(e) => handleDateRangeChange('to', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            {hasRange && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearRange}
                                    className="w-full text-xs"
                                >
                                    <X className="h-3 w-3 mr-2" />
                                    Clear Range
                                </Button>
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
