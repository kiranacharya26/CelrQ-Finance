'use client';

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTransactionTable } from '@/hooks/useTransactionTable';
import { TransactionPagination } from '@/components/transactions/TransactionPagination';
import { SmartCategoryDialog } from '@/components/SmartCategoryDialog';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Info, Plus, X, RefreshCw, FileText, Tag as TagIcon, Filter } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveNote, getNote, deleteNote } from "@/lib/transactionNotes";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/types";
import { getTransactionDisplayInfo, getCategoryIcon } from "@/lib/merchants";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface TransactionTableProps {
    transactions: any[];
    onCategoryChange?: (index: number, newCategory: string) => void;
    currentCategoryFilter?: string;
    onCategoryFilterChange?: (category: string) => void;
    currentTypeFilter?: string;
    onTypeFilterChange?: (type: string) => void;
    uniqueCategories?: string[];
}



export function TransactionTable({
    transactions,
    onCategoryChange,
    currentCategoryFilter = 'all',
    onCategoryFilterChange,
    currentTypeFilter = 'all',
    onTypeFilterChange,
    uniqueCategories = []
}: TransactionTableProps) {
    const {
        session,
        currentPage,
        setCurrentPage,
        localTransactions,
        setLocalTransactions,
        customCategories,
        allCategories,
        selectedIds,
        toggleSelectAll,
        toggleSelectRow,
        handleCategoryChange,
        findSimilarTransactions,
        itemsPerPage,
        totalPages,
        startIndex,
        endIndex,
        currentTransactions,
        recurringIndices,
        isAddingCategory,
        setIsAddingCategory,
        newCategoryName,
        setNewCategoryName,
        handleAddCustomCategory,
    } = useTransactionTable({ transactions, onCategoryChange, uniqueCategories });

    const [editingNote, setEditingNote] = useState<{ index: number; note: string; tags: string } | null>(null);

    // Smart category update state
    const [smartCategoryDialog, setSmartCategoryDialog] = useState<{
        open: boolean;
        transaction: Transaction | null;
        globalIndex: number;
        newCategory: string;
        similarCount: number;
    }>({
        open: false,
        transaction: null,
        globalIndex: -1,
        newCategory: '',
        similarCount: 0,
    });

    // Wrapper for category change that checks for similar transactions
    const handleCategoryChangeWithCheck = async (globalIndex: number, newCategory: string) => {
        const transaction = localTransactions[globalIndex];
        const similar = findSimilarTransactions(transaction);

        // If there are similar transactions, show the dialog
        if (similar.length > 0) {
            setSmartCategoryDialog({
                open: true,
                transaction,
                globalIndex,
                newCategory,
                similarCount: similar.length,
            });
        } else {
            // No similar transactions, just update this one
            try {
                const result = await handleCategoryChange(globalIndex, newCategory, false);
                if (result) {
                    toast.success('Category updated successfully');
                }
            } catch (error) {
                toast.error('Failed to update category');
            }
        }
    };

    // Handle updating only the current transaction
    const handleUpdateThis = async () => {
        try {
            const result = await handleCategoryChange(
                smartCategoryDialog.globalIndex,
                smartCategoryDialog.newCategory,
                false
            );
            if (result) {
                toast.success('Category updated');
            }
        } catch (error) {
            toast.error('Failed to update category');
        }
    };

    // Handle updating all similar transactions
    const handleUpdateAll = async () => {
        try {
            const result = await handleCategoryChange(
                smartCategoryDialog.globalIndex,
                smartCategoryDialog.newCategory,
                true
            );
            if (result) {
                toast.success(`Updated ${result.updated} transaction${result.updated > 1 ? 's' : ''}`);
            }
        } catch (error) {
            toast.error('Failed to update categories');
        }
    };

    if (localTransactions.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No transactions found.</div>;
    }

    // Get headers from the first transaction
    // Filter out internal/unwanted columns
    const hiddenColumns = [
        'id',
        'merchant_name',
        'merchantName',
        'user_email',
        'created_at',
        'merchant_icon',
        'merchantIcon',
        'bank_name',
        'bankName',
        'narration',        // Merged into description
        'amount',           // Split into Debit/Credit
        'withdrawal',       // Normalized version (if exists)
        'deposit'           // Normalized version (if exists)
    ];
    const headers = Object.keys(localTransactions[0]).filter(key => !hiddenColumns.includes(key));

    const categoryHeaderIndex = headers.findIndex(h => h.toLowerCase().includes('category'));
    const descriptionHeaderIndex = headers.findIndex(h => h.toLowerCase().includes('description'));
    const typeHeaderIndex = headers.findIndex(h => h.toLowerCase() === 'type');
    const handlePrevious = () => {
        setCurrentPage(Math.max(currentPage - 1, 1));
    };

    const handleNext = () => {
        setCurrentPage(Math.min(currentPage + 1, totalPages));
    };



    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[50px] px-6 py-3 h-12">
                                <Checkbox
                                    checked={currentTransactions.length > 0 && selectedIds.size === currentTransactions.length}
                                    onCheckedChange={toggleSelectAll}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            {headers.map((header, idx) => {
                                const isCategory = idx === categoryHeaderIndex;
                                const isType = idx === typeHeaderIndex;
                                let displayHeader = header;
                                if (header === 'Withdrawal Amt.') displayHeader = 'Debit';
                                if (header === 'Deposit Amt.') displayHeader = 'Credit';
                                if (header === 'type') displayHeader = 'Type'; // Capitalize

                                return (
                                    <TableHead key={header} className="whitespace-nowrap bg-muted/30 px-6 py-3 h-12 text-xs uppercase tracking-wider font-medium text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            {displayHeader}
                                            {isCategory && (
                                                <div className="flex items-center gap-1">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info className="h-3 w-3 text-muted-foreground cursor-help opacity-50 hover:opacity-100" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs">
                                                                <p className="font-semibold mb-1">AI Categorized</p>
                                                                <p className="text-sm">Categories are automatically assigned by AI. If not accurate, click the dropdown to change to a suitable category or create a new one.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    {onCategoryFilterChange && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={`h-6 w-6 ml-1 hover:bg-muted-foreground/10 ${currentCategoryFilter !== 'all' ? 'text-primary bg-primary/10' : 'text-muted-foreground opacity-50 hover:opacity-100'}`}
                                                                    aria-label="Filter by category"
                                                                >
                                                                    <Filter className="h-3 w-3" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
                                                                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => onCategoryFilterChange('all')}
                                                                    className={currentCategoryFilter === 'all' ? 'bg-accent' : ''}
                                                                >
                                                                    All Categories
                                                                </DropdownMenuItem>
                                                                {uniqueCategories.map(cat => (
                                                                    <DropdownMenuItem
                                                                        key={cat}
                                                                        onClick={() => onCategoryFilterChange(cat)}
                                                                        className={currentCategoryFilter === cat ? 'bg-accent' : ''}
                                                                    >
                                                                        <div className="flex items-center gap-2 w-full">
                                                                            <span>{getCategoryIcon(cat).icon}</span>
                                                                            <span className="truncate">{cat}</span>
                                                                        </div>
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            )}
                                            {isType && onTypeFilterChange && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={`h-6 w-6 ml-1 hover:bg-muted-foreground/10 ${currentTypeFilter !== 'all' ? 'text-primary bg-primary/10' : 'text-muted-foreground opacity-50 hover:opacity-100'}`}
                                                            aria-label="Filter by type"
                                                        >
                                                            <Filter className="h-3 w-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-40">
                                                        <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => onTypeFilterChange('all')}
                                                            className={currentTypeFilter === 'all' ? 'bg-accent' : ''}
                                                        >
                                                            All Types
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => onTypeFilterChange('income')}
                                                            className={currentTypeFilter === 'income' ? 'bg-accent' : ''}
                                                        >
                                                            Income
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => onTypeFilterChange('expense')}
                                                            className={currentTypeFilter === 'expense' ? 'bg-accent' : ''}
                                                        >
                                                            Expense
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentTransactions.map((t, i) => {
                            const globalIndex = startIndex + i;
                            const isRecurring = recurringIndices.has(globalIndex);
                            const isSelected = selectedIds.has(t.id);

                            return (
                                <TableRow key={globalIndex} className={`hover:bg-muted/30 transition-colors ${isSelected ? 'bg-muted/50' : ''}`}>
                                    <TableCell className="px-6 py-4 align-top">
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleSelectRow(t.id)}
                                            aria-label="Select row"
                                        />
                                    </TableCell>
                                    {headers.map((header, headerIdx) => {
                                        const isCategory = headerIdx === categoryHeaderIndex;
                                        const isFirstColumn = headerIdx === 0;

                                        return (
                                            <TableCell key={`${globalIndex}-${header}`} className="min-w-[100px] max-w-[300px] break-words whitespace-normal px-6 py-4 align-top text-sm">
                                                {isCategory ? (
                                                    <div className="space-y-2">
                                                        <Select
                                                            value={t[header] || 'Other'}
                                                            onValueChange={(value) => {
                                                                if (value === '__add_new__') {
                                                                    setIsAddingCategory(true);
                                                                } else {
                                                                    handleCategoryChangeWithCheck(globalIndex, value);
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-full min-w-[140px] h-8 text-xs bg-transparent border-transparent hover:border-input focus:border-input transition-all px-2 -ml-2">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {allCategories.map(cat => {
                                                                    const { icon, color } = getCategoryIcon(cat);
                                                                    return (
                                                                        <SelectItem key={cat} value={cat}>
                                                                            <div className="flex items-center gap-2">
                                                                                <span style={{ color }}>{icon}</span>
                                                                                {cat}
                                                                            </div>
                                                                        </SelectItem>
                                                                    );
                                                                })}
                                                                <SelectItem value="__add_new__" className="text-primary">
                                                                    <div className="flex items-center gap-2">
                                                                        <Plus className="h-4 w-4" />
                                                                        Create New Category
                                                                    </div>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>

                                                        {isAddingCategory && (
                                                            <div className="flex gap-2 items-center absolute z-10 bg-background p-2 border rounded-md shadow-lg mt-1">
                                                                <Input
                                                                    placeholder="New category name"
                                                                    value={newCategoryName}
                                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCategory()}
                                                                    className="text-sm h-8 w-40"
                                                                    autoFocus
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    className="h-8"
                                                                    onClick={handleAddCustomCategory}
                                                                    disabled={!newCategoryName.trim()}
                                                                >
                                                                    Add
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0"
                                                                    onClick={() => {
                                                                        setIsAddingCategory(false);
                                                                        setNewCategoryName('');
                                                                    }}
                                                                    aria-label="Cancel adding category"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className={isFirstColumn ? "font-medium text-foreground" : "text-muted-foreground"}>
                                                            {header === 'Withdrawal Amt.' || header === 'Deposit Amt.' ? (
                                                                t[header] ? `₹${Number(t[header]).toLocaleString('en-IN')}` : '-'
                                                            ) : (
                                                                t[header]
                                                            )}
                                                        </span>

                                                        {(header.toLowerCase().includes('narration') || header.toLowerCase().includes('description')) && isRecurring && (
                                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                                Recurring
                                                            </Badge>
                                                        )}

                                                        {isFirstColumn && (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100" aria-label="Add note">
                                                                        <FileText className={`h-3 w-3 ${session?.user?.email && getNote(session.user.email, t) ? 'text-primary fill-primary/20' : 'text-muted-foreground'}`} />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-80">
                                                                    <div className="grid gap-4">
                                                                        <div className="space-y-2">
                                                                            <h4 className="font-medium leading-none">Notes & Tags</h4>
                                                                            <p className="text-sm text-muted-foreground">
                                                                                Add context to this transaction.
                                                                            </p>
                                                                        </div>
                                                                        <div className="grid gap-2">
                                                                            <div className="grid gap-1">
                                                                                <Label htmlFor="note">Note</Label>
                                                                                <Textarea
                                                                                    id="note"
                                                                                    defaultValue={session?.user?.email ? getNote(session.user.email, t)?.note || '' : ''}
                                                                                    placeholder="Add a note..."
                                                                                    className="h-20"
                                                                                    onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                                                                                        if (!session?.user?.email) return;
                                                                                        const note = e.target.value;
                                                                                        const currentTags = getNote(session.user.email, t)?.tags || [];
                                                                                        if (note || currentTags.length > 0) {
                                                                                            saveNote(session.user.email, t, note, currentTags);
                                                                                            setLocalTransactions([...localTransactions]);
                                                                                        } else {
                                                                                            deleteNote(session.user.email, t);
                                                                                            setLocalTransactions([...localTransactions]);
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div className="grid gap-1">
                                                                                <Label htmlFor="tags">Tags (comma separated)</Label>
                                                                                <Input
                                                                                    id="tags"
                                                                                    defaultValue={session?.user?.email ? getNote(session.user.email, t)?.tags.join(', ') || '' : ''}
                                                                                    placeholder="business, tax, personal..."
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        if (!session?.user?.email) return;
                                                                                        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                                                                                        const currentNote = getNote(session.user.email, t)?.note || '';
                                                                                        if (currentNote || tags.length > 0) {
                                                                                            saveNote(session.user.email, t, currentNote, tags);
                                                                                            setLocalTransactions([...localTransactions]);
                                                                                        } else {
                                                                                            deleteNote(session.user.email, t);
                                                                                            setLocalTransactions([...localTransactions]);
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        )}

                                                        {isFirstColumn && session?.user?.email && getNote(session.user.email, t)?.tags.map(tag => (
                                                            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground border-muted-foreground/30">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3">
                {currentTransactions.map((t, i) => {
                    const globalIndex = startIndex + i;
                    const isSelected = selectedIds.has(t.id);
                    const date = t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
                    const description = t.description || t.narration || 'No Description';
                    const amount = t['Withdrawal Amt.'] || t['Deposit Amt.'] || t.amount || 0;
                    const isCredit = !!t['Deposit Amt.'] || t.type === 'income';
                    const category = t.category || 'Other';
                    const { icon: categoryIcon, color: categoryColor } = getCategoryIcon(category);

                    return (
                        <div
                            key={globalIndex}
                            className={`relative rounded-lg border bg-card overflow-hidden transition-all ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
                        >
                            {/* Top Section - Description & Amount */}
                            <div className="p-4 pb-3">
                                <div className="flex items-start gap-3">
                                    {/* Checkbox */}
                                    <div className="pt-0.5 flex-shrink-0">
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleSelectRow(t.id)}
                                            aria-label="Select transaction"
                                            className="h-4 w-4"
                                        />
                                    </div>

                                    {/* Description & Date */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm leading-tight mb-1 line-clamp-2 break-words">
                                            {description}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {date}
                                        </p>
                                    </div>

                                    {/* Amount */}
                                    <div className="flex-shrink-0 text-right">
                                        <div className={`text-base font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                            {isCredit ? '+' : '-'}₹{Number(amount).toLocaleString('en-IN')}
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] mt-1 ${isCredit ? 'border-green-600/30 text-green-600' : 'border-red-600/30 text-red-600'}`}
                                        >
                                            {t.type || (isCredit ? 'Income' : 'Expense')}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Section - Category */}
                            <div className="px-4 pb-3 pt-2 border-t bg-muted/30">
                                <Select
                                    value={category}
                                    onValueChange={(value) => {
                                        if (value === '__add_new__') {
                                            setIsAddingCategory(true);
                                        } else {
                                            handleCategoryChangeWithCheck(globalIndex, value);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full h-9 text-xs border-border/50 bg-background hover:bg-background/80">
                                        <div className="flex items-center gap-2">
                                            <span style={{ color: categoryColor }}>{categoryIcon}</span>
                                            <span className="font-medium">{category}</span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allCategories.map(cat => {
                                            const { icon, color } = getCategoryIcon(cat);
                                            return (
                                                <SelectItem key={cat} value={cat}>
                                                    <div className="flex items-center gap-2">
                                                        <span style={{ color }}>{icon}</span>
                                                        <span>{cat}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                        <SelectItem value="__add_new__" className="text-primary">
                                            <div className="flex items-center gap-2">
                                                <Plus className="h-4 w-4" />
                                                <span>Create New Category</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    );
                })}
            </div>


            <TransactionPagination
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={localTransactions.length}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onPageChange={setCurrentPage}
            />

            {/* Smart Category Update Dialog */}
            <SmartCategoryDialog
                open={smartCategoryDialog.open}
                onOpenChange={(open) => setSmartCategoryDialog({ ...smartCategoryDialog, open })}
                transactionDescription={smartCategoryDialog.transaction?.description || ''}
                similarCount={smartCategoryDialog.similarCount}
                newCategory={smartCategoryDialog.newCategory}
                onUpdateThis={handleUpdateThis}
                onUpdateAll={handleUpdateAll}
            />
        </div>
    );
}
