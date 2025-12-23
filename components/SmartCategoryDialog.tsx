'use client';

import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface SmartCategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transactionDescription: string;
    similarCount: number;
    newCategory: string;
    onUpdateThis: () => void;
    onUpdateAll: () => void;
}

export function SmartCategoryDialog({
    open,
    onOpenChange,
    transactionDescription,
    similarCount,
    newCategory,
    onUpdateThis,
    onUpdateAll,
}: SmartCategoryDialogProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateThis = async () => {
        setIsUpdating(true);
        await onUpdateThis();
        setIsUpdating(false);
        onOpenChange(false);
    };

    const handleUpdateAll = async () => {
        setIsUpdating(true);
        await onUpdateAll();
        setIsUpdating(false);
        onOpenChange(false);
    };

    // Extract merchant name for display
    const getMerchantName = (desc: string): string => {
        if (!desc) return 'this merchant';

        // For UPI transactions
        if (desc.toLowerCase().includes('upi')) {
            const parts = desc.split(/[-/]/);
            if (parts.length >= 2) {
                return parts[1].trim().split(/[@\s]/)[0];
            }
        }

        // For other transactions, get first few words
        const words = desc.split(/\s+/).slice(0, 3);
        return words.join(' ').slice(0, 30);
    };

    const merchantName = getMerchantName(transactionDescription);

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        <AlertDialogTitle>Update Similar Transactions?</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-3 text-left" asChild>
                        <div className="text-muted-foreground text-sm space-y-3 text-left">
                            <p>
                                Found <Badge variant="secondary" className="mx-1 font-semibold">{similarCount}</Badge>
                                other transaction{similarCount !== 1 ? 's' : ''} from <strong>{merchantName}</strong>.
                            </p>
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <p className="font-medium text-foreground mb-1">Would you like to:</p>
                                <ul className="space-y-1 text-muted-foreground">
                                    <li>• Update all to <strong className="text-foreground">{newCategory}</strong>?</li>
                                    <li>• Or just update this one transaction?</li>
                                </ul>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                💡 Updating all similar transactions saves time for recurring payments like subscriptions!
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel
                        onClick={handleUpdateThis}
                        disabled={isUpdating}
                        className="sm:flex-1"
                    >
                        Update Only This
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleUpdateAll}
                        disabled={isUpdating}
                        className="sm:flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                        {isUpdating ? 'Updating...' : `Update All ${similarCount + 1}`}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
