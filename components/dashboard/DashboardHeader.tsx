'use client';

import { useState } from 'react';
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
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { Filter, Trash2, Download, X, Upload } from 'lucide-react';
import { DateRange } from '@/types';
import { UploadHistory } from '@/components/UploadHistory';
import { FileUpload } from '@/components/FileUpload';

import { useAuth } from '@/hooks/useAuth';
import { useTransactionsContext } from '@/context/TransactionsContext';

interface DashboardHeaderProps {
    selectedBank: string;
    onBankChange: (bank: string) => void;
    availableBanks: string[];
    selectedMonth: string;
    onMonthChange: (month: string) => void;
    months: string[];
    dateRange: DateRange;
    onDateRangeChange: (range: DateRange) => void;
    onDeleteBankData: () => void;
    onExportCSV: () => void;
    onExportPDF: () => void;
}

export function DashboardHeader({
    selectedBank,
    onBankChange,
    availableBanks,
    selectedMonth,
    onMonthChange,
    months,
    dateRange,
    onDateRangeChange,
    onDeleteBankData,
    onExportCSV,
    onExportPDF
}: DashboardHeaderProps) {
    const { userEmail } = useAuth();
    const { refresh } = useTransactionsContext();
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pb-3 border-b mb-3">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight hidden md:block">Dashboard</h1>
                <h1 className="text-2xl font-bold tracking-tight md:hidden">{getGreeting()}</h1>
                <p className="text-sm text-muted-foreground">Overview of your financial health</p>
            </div>
            <div className="flex items-center gap-2">
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hidden md:flex">
                            <Upload className="mr-2 h-4 w-4" /> Import Statement
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Import Bank Statement</DialogTitle>
                            <DialogDescription>
                                Upload your bank statement (PDF, CSV, Excel) to analyze transactions.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm flex items-start gap-2">
                                <div className="mt-0.5">ℹ️</div>
                                <div>
                                    <strong>Tip:</strong> Name your files clearly (e.g., "HDFC-Aug-2024.pdf") to easily identify and manage them in your upload history later.
                                </div>
                            </div>
                            <FileUpload onUpload={async (file, bank) => {
                                if (!userEmail) {
                                    console.error('No user email found');
                                    return;
                                }

                                const formData = new FormData();
                                formData.append('file', file);
                                formData.append('bankAccount', bank);
                                formData.append('email', userEmail);

                                try {
                                    const response = await fetch('/api/upload', {
                                        method: 'POST',
                                        body: formData,
                                    });

                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        throw new Error(errorData.error || 'Upload failed');
                                    }

                                    // Refresh context to update transactions and charts
                                    refresh();

                                    // Close dialog or show success message?
                                    // For now, let's just log success. The UploadHistory component will also update if we trigger a re-fetch there,
                                    // but UploadHistory fetches on mount/session change. We might need to trigger it to refresh too.
                                    // Since UploadHistory is a child of this component, we can't easily trigger its internal fetch.
                                    // However, `refresh()` updates the global transaction context.
                                    // Ideally UploadHistory should also subscribe to some refresh trigger or we force re-render.
                                    // But for now, the main goal is to update the dashboard data.
                                    console.log('Upload successful');
                                    setIsUploadOpen(false);
                                } catch (error) {
                                    console.error('Upload error:', error);
                                    alert(`Upload failed: ${(error as Error).message}`);
                                }
                            }} />

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Or manage existing
                                    </span>
                                </div>
                            </div>

                            <UploadHistory />
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Bank Selector */}
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
                <Select value={selectedMonth} onValueChange={onMonthChange}>
                    <SelectTrigger className="w-full sm:w-[140px]" aria-label="Select month">
                        <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                        <SelectItem value="All Months">All Months</SelectItem>
                        {months.map(month => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Date Range Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                            <Filter className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">
                                {dateRange.from && dateRange.to
                                    ? `${dateRange.from.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} - ${dateRange.to.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
                                    : 'Range'}
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

                {/* Actions Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto min-w-[44px]"
                            aria-label="Filter options"
                        >
                            <Filter className="h-4 w-4" />
                            <span className="ml-2 sm:hidden">Options</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <div className="p-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Actions</p>
                            <div className="space-y-2">
                                {availableBanks.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onDeleteBankData}
                                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                        aria-label="Delete bank data"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Data
                                    </Button>
                                )}
                            </div>

                            <div className="my-3 border-t" />

                            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Export</p>
                            <div className="space-y-1">
                                <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer">
                                    <Download className="mr-2 h-4 w-4" />
                                    <span>Export as CSV</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onExportPDF} className="cursor-pointer">
                                    <Download className="mr-2 h-4 w-4" />
                                    <span>Export as PDF</span>
                                </DropdownMenuItem>
                            </div>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
