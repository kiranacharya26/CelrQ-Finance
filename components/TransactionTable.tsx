'use client';

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { UserStorage } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

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
import { ChevronLeft, ChevronRight, Info, Plus, X, RefreshCw, FileText, Tag as TagIcon, Filter } from "lucide-react";
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
import { detectRecurringTransactions } from "@/lib/recurring";
import { getTransactionDisplayInfo, getCategoryIcon } from "@/lib/merchants";
import { Checkbox } from "@/components/ui/checkbox";

interface TransactionTableProps {
    transactions: any[];
    onCategoryChange?: (index: number, newCategory: string) => void;
    currentCategoryFilter?: string;
    onCategoryFilterChange?: (category: string) => void;
    uniqueCategories?: string[];
}

const DEFAULT_CATEGORIES = [
    'Healthcare',
    'Groceries',
    'Restaurants & Dining',
    'Fuel',
    'Ride Services',
    'Public Transport',
    'Bills',
    'Telecom',
    'Online Shopping',
    'Retail & Stores',
    'Streaming Services',
    'Events & Recreation',
    'Housing',
    'Education',
    'Income',
    'Insurance',
    'Investments',
    'Personal Care',
    'Other'
];

export function TransactionTable({
    transactions,
    onCategoryChange,
    currentCategoryFilter = 'all',
    onCategoryFilterChange,
    uniqueCategories = []
}: TransactionTableProps) {
    const { data: session } = useSession();
    const [currentPage, setCurrentPage] = useState(1);
    const [localTransactions, setLocalTransactions] = useState(transactions);
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingNote, setEditingNote] = useState<{ index: number; note: string; tags: string } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const itemsPerPage = 10;

    // Sync localTransactions with transactions prop when it changes
    useEffect(() => {
        setLocalTransactions(transactions);
        setCurrentPage(1); // Reset to first page when transactions change
        setSelectedIds(new Set()); // Clear selection
    }, [transactions]);

    useEffect(() => {
        if (session?.user?.email) {
            const saved = UserStorage.getData(session.user.email, 'customCategories', []);
            setCustomCategories(saved);
        }
    }, [session]);

    const allCategories = [...DEFAULT_CATEGORIES, ...customCategories].sort();

    // Detect recurring transactions
    const recurringIndices = useMemo(() => {
        return detectRecurringTransactions(transactions);
    }, [transactions]);

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
        'Withdrawal Amt.',  // Redundant - we have type and amount
        'Deposit Amt.',     // Redundant - we have type and amount
        'withdrawal',       // Normalized version (if exists)
        'deposit'           // Normalized version (if exists)
    ];
    const headers = Object.keys(localTransactions[0]).filter(key => !hiddenColumns.includes(key));

    const categoryHeaderIndex = headers.findIndex(h => h.toLowerCase().includes('category'));
    const descriptionHeaderIndex = headers.findIndex(h => h.toLowerCase().includes('description') || h.toLowerCase().includes('narration'));

    const totalPages = Math.ceil(transactions.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTransactions = localTransactions.slice(startIndex, endIndex);

    const handlePrevious = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNext = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === currentTransactions.length) {
            setSelectedIds(new Set());
        } else {
            const newSelected = new Set(currentTransactions.map(t => t.id));
            setSelectedIds(newSelected);
        }
    };

    const toggleSelectRow = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleAddCustomCategory = () => {
        if (newCategoryName.trim() && !allCategories.includes(newCategoryName.trim()) && session?.user?.email) {
            const updated = [...customCategories, newCategoryName.trim()];
            setCustomCategories(updated);
            UserStorage.saveData(session.user.email, 'customCategories', updated);
            setNewCategoryName('');
            setIsAddingCategory(false);
        }
    };

    const handleCategoryChange = async (globalIndex: number, newCategory: string) => {
        if (!session?.user?.email) return;

        const transactionToUpdate = localTransactions[globalIndex];
        const isBulkUpdate = selectedIds.has(transactionToUpdate.id) && selectedIds.size > 1;

        const idsToUpdate = isBulkUpdate ? Array.from(selectedIds) : [transactionToUpdate.id];

        // Optimistic update
        const updatedLocal = [...localTransactions];

        idsToUpdate.forEach(id => {
            const idx = updatedLocal.findIndex(t => t.id === id);
            if (idx !== -1) {
                updatedLocal[idx] = { ...updatedLocal[idx], category: newCategory };
            }
        });

        setLocalTransactions(updatedLocal);

        try {
            // Update in Supabase
            const { error } = await supabase
                .from('transactions')
                .update({ category: newCategory })
                .in('id', idsToUpdate)
                .eq('user_email', session.user.email);

            if (error) {
                console.error('Error updating category:', error);
                // Revert on error
                setLocalTransactions(localTransactions);
                return;
            }

            // LEARNING SYSTEM: Extract keyword from transaction and save it (Local for now, can be moved to DB)
            // Only learn from the primary transaction to avoid spamming
            const narration = transactionToUpdate.narration || transactionToUpdate.description || '';
            let keyword = '';

            // Extract merchant name from UPI transactions
            if (narration.toLowerCase().includes('upi-')) {
                const parts = narration.split('-');
                if (parts.length >= 2) {
                    keyword = parts[1]
                        .trim()
                        .replace(/CO$/i, '')
                        .replace(/PVT$/i, '')
                        .replace(/LTD$/i, '')
                        .replace(/INC$/i, '')
                        .replace(/\d+$/i, '')
                        .trim()
                        .toLowerCase();
                }
            } else {
                // For non-UPI transactions, extract first meaningful word
                const words = narration.split(/[\s-]+/).filter((w: string) => w.length > 3);
                if (words.length > 0) {
                    keyword = words[0].toLowerCase();
                }
            }

            // Save the learned keyword if it's meaningful
            if (keyword && keyword.length > 2) {
                let learnedKeywords: Record<string, string[]> = UserStorage.getData(
                    session.user.email,
                    'learnedKeywords',
                    {}
                );

                // Handle double-stringified data from previous bug
                if (typeof learnedKeywords === 'string') {
                    try {
                        learnedKeywords = JSON.parse(learnedKeywords);
                    } catch (e) {
                        learnedKeywords = {};
                    }
                }

                if (!learnedKeywords[newCategory]) {
                    learnedKeywords[newCategory] = [];
                }

                // Add keyword if not already present
                if (!learnedKeywords[newCategory].includes(keyword)) {
                    learnedKeywords[newCategory].push(keyword);
                    UserStorage.saveData(session.user.email, 'learnedKeywords', learnedKeywords);
                    console.log(`Learned: "${keyword}" → ${newCategory}`);
                }
            }

            // Notify parent if callback provided
            if (onCategoryChange) {
                onCategoryChange(globalIndex, newCategory);
            }

            // Clear selection after bulk update
            if (isBulkUpdate) {
                setSelectedIds(new Set());
            }

        } catch (err) {
            console.error('Error in handleCategoryChange:', err);
            setLocalTransactions(localTransactions);
        }
    };

    return (
        <div className="space-y-4">
            <div className="w-full overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[50px] bg-muted/30 px-6 py-3">
                                <Checkbox
                                    checked={currentTransactions.length > 0 && selectedIds.size === currentTransactions.length}
                                    onCheckedChange={toggleSelectAll}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            {headers.map((header, idx) => {
                                const isCategory = idx === categoryHeaderIndex;
                                return (
                                    <TableHead key={header} className="whitespace-nowrap bg-muted/30 px-6 py-3 h-12 text-xs uppercase tracking-wider font-medium text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            {header}
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
                                                                    handleCategoryChange(globalIndex, value);
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
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className={isFirstColumn ? "font-medium text-foreground" : "text-muted-foreground"}>
                                                            {t[header]}
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
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100">
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

            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
