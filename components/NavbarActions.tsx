'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Filter, Trash2, Download } from 'lucide-react';
import { useTransactionsContext } from '@/context/TransactionsContext';
import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { exportToCSV, exportToPDF } from '@/lib/export';
import { parseDate } from '@/lib/dateParser';

export function NavbarActions({ mobile = false }: { mobile?: boolean }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { transactions, deleteBank, loading } = useTransactionsContext();

    const selectedBank = searchParams.get('bank') || 'all';
    const selectedMonth = searchParams.get('month') || 'All Months';
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Calculate filtered transactions for export
    const filteredTransactions = useMemo(() => {
        let result = [...transactions];

        // Bank filter
        if (selectedBank !== 'all') {
            result = result.filter(t => t.bankName === selectedBank);
        }

        // Date Range / Month filter
        if (fromParam || toParam) {
            result = result.filter(t => {
                const transDate = parseDate(t.date);
                if (!transDate) return false;

                if (fromParam) {
                    const fromDate = new Date(fromParam + '-01');
                    if (transDate < fromDate) return false;
                }
                if (toParam) {
                    const toDate = new Date(toParam + '-01');
                    toDate.setMonth(toDate.getMonth() + 1);
                    toDate.setDate(0);
                    toDate.setHours(23, 59, 59);
                    if (transDate > toDate) return false;
                }
                return true;
            });
        } else if (selectedMonth !== 'All Months') {
            result = result.filter(t => {
                const date = parseDate(t.date);
                if (!date) return false;
                return date.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' }) === selectedMonth;
            });
        }

        return result;
    }, [transactions, selectedBank, selectedMonth, fromParam, toParam]);

    // Only show on dashboard page
    if (pathname !== '/dashboard') {
        return null;
    }

    const handleDeleteData = async () => {
        const message = selectedBank === 'all'
            ? "Are you sure you want to delete ALL your transaction data? This cannot be undone."
            : `Are you sure you want to delete all data for ${selectedBank}? This cannot be undone.`;

        if (confirm(message)) {
            await deleteBank(selectedBank);
        }
    };

    const handleExportCSV = () => exportToCSV(filteredTransactions);
    const handleExportPDF = () => exportToPDF(filteredTransactions);

    if (loading && transactions.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size={mobile ? "default" : "icon"}
                    className={mobile
                        ? "w-full justify-start h-10 font-medium text-muted-foreground hover:text-primary px-0 border-none bg-transparent"
                        : "h-9 w-9 bg-background/50 backdrop-blur-sm border-muted-foreground/20"
                    }
                >
                    {mobile ? (
                        <>
                            <Filter className="mr-2 h-5 w-5" />
                            <span>Data Options</span>
                        </>
                    ) : (
                        <Filter className="h-4 w-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={mobile ? "center" : "end"} className="w-64">
                <div className="p-2 space-y-4">
                    <div className="space-y-2">
                        <DropdownMenuLabel className="px-1 text-[10px] uppercase tracking-wider text-muted-foreground">Data Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={handleDeleteData}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer text-xs"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete {selectedBank === 'all' ? 'All' : selectedBank} Data</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer text-xs">
                            <Download className="mr-2 h-4 w-4" />
                            <span>Export as CSV</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer text-xs">
                            <Download className="mr-2 h-4 w-4" />
                            <span>Export as PDF</span>
                        </DropdownMenuItem>
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
