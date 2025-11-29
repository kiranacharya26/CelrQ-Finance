'use client';

import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Filter, X } from 'lucide-react';

interface TransactionFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    categoryFilter: string;
    onCategoryChange: (value: string) => void;
    tagFilter: string;
    onTagChange: (value: string) => void;
    sortBy: string;
    onSortChange: (value: string) => void;
    uniqueCategories: string[];
    availableTags: string[];
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

export function TransactionFilters({
    searchQuery,
    onSearchChange,
    categoryFilter,
    onCategoryChange,
    tagFilter,
    onTagChange,
    sortBy,
    onSortChange,
    uniqueCategories,
    availableTags,
    hasActiveFilters,
    onClearFilters
}: TransactionFiltersProps) {
    return (
        <div className="space-y-4" role="search" aria-label="Transaction filters">
            {/* Search Bar - Full width */}
            <div className="relative w-full">
                <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    aria-label="Search transactions"
                    className="w-full pl-10"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Filter className="h-4 w-4" />
                </div>
                {searchQuery && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => onSearchChange('')}
                        aria-label="Clear search"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Filter Controls - Grid on mobile, Flex on desktop */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                <Select value={categoryFilter} onValueChange={onCategoryChange}>
                    <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by category">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {uniqueCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={tagFilter} onValueChange={onTagChange}>
                    <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by tag">
                        <SelectValue placeholder="Tags" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tags</SelectItem>
                        {availableTags.map(tag => (
                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={onSortChange}>
                    <SelectTrigger className="w-full sm:w-[180px]" aria-label="Sort transactions">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                        <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                        <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                        <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        aria-label="Clear all filters"
                        className="col-span-2 sm:col-span-1 w-full sm:w-auto"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                    </Button>
                )}
            </div>
        </div>
    );
}
