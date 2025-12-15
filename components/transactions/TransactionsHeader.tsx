'use client';

import { Button } from '@/components/ui/button';
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
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Filter, Download, X } from 'lucide-react';
import { DateRange } from '@/types';

interface TransactionsHeaderProps {
    selectedBank: string;
    onBankChange: (value: string) => void;
    availableBanks: string[];
    monthParam: string | null;
    onExportCSV: () => void;
    onExportPDF: () => void;
    months: string[];
    selectedMonth: string;
    onMonthChange: (month: string) => void;
}

export function TransactionsHeader({
    selectedBank,
    onBankChange,
    availableBanks,
    monthParam,
    onExportCSV,
    onExportPDF,
    months,
    selectedMonth,
    onMonthChange
}: TransactionsHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Transactions</h1>
                {monthParam && monthParam !== 'All Months' && (
                    <p className="text-sm text-muted-foreground mt-1">Viewing data for {monthParam}</p>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedBank} onValueChange={onBankChange}>
                    <SelectTrigger className="w-full sm:w-[140px]" aria-label="Select bank account">
                        <SelectValue placeholder="Select Bank" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Banks</SelectItem>
                        {availableBanks.map(bank => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Month Selector */}
                <Select
                    value={selectedMonth}
                    onValueChange={onMonthChange}
                >
                    <SelectTrigger className="w-full sm:w-[140px]" aria-label="Select month">
                        <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Months">All Months</SelectItem>
                        {months.map(month => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Export Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" aria-label="Export options" className="shrink-0">
                            <Download className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onExportCSV}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onExportPDF}>
                            <Download className="h-4 w-4 mr-2" />
                            Export PDF
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
