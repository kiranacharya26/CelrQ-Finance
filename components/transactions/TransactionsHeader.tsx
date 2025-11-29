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
    dateRange: DateRange;
    onDateRangeChange: (range: DateRange) => void;
    onExportCSV: () => void;
    onExportPDF: () => void;
}

export function TransactionsHeader({
    selectedBank,
    onBankChange,
    availableBanks,
    monthParam,
    dateRange,
    onDateRangeChange,
    onExportCSV,
    onExportPDF
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

                {/* Month Range Selector */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                            <Filter className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">
                                {dateRange.from && dateRange.to
                                    ? `${dateRange.from.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} - ${dateRange.to.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
                                    : 'Month Range'}
                            </span>
                            <span className="sm:hidden">Range</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                        <div className="p-3 space-y-3">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">From Month</label>
                                <Input
                                    type="month"
                                    onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value + '-01') : null;
                                        onDateRangeChange({ ...dateRange, from: date });
                                    }}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">To Month</label>
                                <Input
                                    type="month"
                                    onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value + '-01') : null;
                                        onDateRangeChange({ ...dateRange, to: date });
                                    }}
                                    className="h-9"
                                />
                            </div>
                            {(dateRange.from || dateRange.to) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDateRangeChange({ from: null, to: null })}
                                    className="w-full"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Clear Range
                                </Button>
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

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
