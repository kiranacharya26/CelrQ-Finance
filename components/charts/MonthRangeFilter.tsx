import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, X } from "lucide-react";
import { MonthRange } from "@/hooks/useMonthRangeFilter";

interface MonthRangeFilterProps {
    monthRange: MonthRange;
    onFromChange: (value: string | null) => void;
    onToChange: (value: string | null) => void;
    onClear: () => void;
    size?: "default" | "sm" | "lg";
    align?: "start" | "center" | "end";
}

export function MonthRangeFilter({
    monthRange,
    onFromChange,
    onToChange,
    onClear,
    size = "sm",
    align = "end"
}: MonthRangeFilterProps) {
    const displayText = monthRange.from && monthRange.to
        ? `${new Date(monthRange.from + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} - ${new Date(monthRange.to + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
        : 'Filter Range';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size={size} className="text-xs">
                    <Filter className="mr-2 h-3 w-3" />
                    {displayText}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-56">
                <div className="p-3 space-y-3">
                    <div className="space-y-2">
                        <label className="text-xs font-medium">From</label>
                        <Input
                            type="month"
                            value={monthRange.from || ''}
                            onChange={(e) => onFromChange(e.target.value || null)}
                            className="h-8 text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium">To</label>
                        <Input
                            type="month"
                            value={monthRange.to || ''}
                            onChange={(e) => onToChange(e.target.value || null)}
                            className="h-8 text-xs"
                        />
                    </div>
                    {(monthRange.from || monthRange.to) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClear}
                            className="w-full text-xs"
                        >
                            <X className="h-3 w-3 mr-2" />
                            Clear
                        </Button>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
