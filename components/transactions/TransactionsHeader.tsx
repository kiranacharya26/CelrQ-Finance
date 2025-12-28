'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from 'lucide-react';

interface TransactionsHeaderProps {
    monthParam: string | null;
}

export function TransactionsHeader({
    monthParam,
}: TransactionsHeaderProps) {
    const hasContent = monthParam && monthParam !== 'All Months';

    if (!hasContent) {
        return null;
    }

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <p className="text-sm text-muted-foreground">Viewing data for {monthParam}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
            </div>
        </div>
    );
}
