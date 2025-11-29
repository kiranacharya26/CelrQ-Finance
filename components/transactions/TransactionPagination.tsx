'use client';

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
                        value={currentPage}
                        onChange={(e) => {
                            const page = parseInt(e.target.value);
                            if (page >= 1 && page <= totalPages) {
                                onPageChange(page);
                            }
                        }}
                        onBlur={(e) => {
                            const page = parseInt(e.target.value);
                            if (isNaN(page) || page < 1) {
                                onPageChange(1);
                            } else if (page > totalPages) {
                                onPageChange(totalPages);
                            }
                        }}
                        className="w-16 h-9 text-center"
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
