'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TransactionPaginationProps {
    currentPage: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
    totalItems: number;
    onPrevious: () => void;
    onNext: () => void;
    onPageChange: (page: number) => void;
}

export function TransactionPagination({
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
    onPrevious,
    onNext,
    onPageChange
}: TransactionPaginationProps) {
    const [inputValue, setInputValue] = useState(currentPage.toString());

    // Sync input value when currentPage prop changes
    useEffect(() => {
        setInputValue(currentPage.toString());
    }, [currentPage]);

    const handlePageSubmit = () => {
        const page = parseInt(inputValue);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
            onPageChange(page);
        } else {
            // Reset to current page if invalid
            setInputValue(currentPage.toString());
        }
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
            <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} transactions
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrevious}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                </Button>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground hidden sm:inline">Page</span>
                    <Input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handlePageSubmit();
                            }
                        }}
                        onBlur={handlePageSubmit}
                        className="w-16 h-9 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-sm text-muted-foreground">of {totalPages}</span>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={onNext}
                    disabled={currentPage === totalPages}
                >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}
