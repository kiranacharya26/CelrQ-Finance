'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface DateRangePickerProps {
    onRangeChange: (range: { from: Date | null; to: Date | null }) => void;
}

import { DateRange } from "react-day-picker";

// ... existing imports

export function DateRangePicker({ onRangeChange }: DateRangePickerProps) {
    const [preset, setPreset] = useState<string>('all');
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [isCustomOpen, setIsCustomOpen] = useState(false);

    const handlePresetChange = (value: string) => {
        setPreset(value);

        const now = new Date();
        let from: Date | null = null;
        let to: Date | null = null;

        switch (value) {
            case 'last7':
                from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                to = now;
                break;
            case 'last30':
                from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                to = now;
                break;
            case 'last90':
                from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                to = now;
                break;
            case 'thisYear':
                from = new Date(now.getFullYear(), 0, 1);
                to = now;
                break;
            case 'all':
            default:
                from = null;
                to = null;
                break;
        }

        onRangeChange({ from, to });
    };

    const handleCustomRangeSelect = (range: DateRange | undefined) => {
        setCustomRange(range);
        if (range?.from && range?.to) {
            setPreset('custom');
            onRangeChange({ from: range.from, to: range.to });
            setIsCustomOpen(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-[180px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="last7">Last 7 Days</SelectItem>
                    <SelectItem value="last30">Last 30 Days</SelectItem>
                    <SelectItem value="last90">Last 3 Months</SelectItem>
                    <SelectItem value="thisYear">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
            </Select>

            {preset === 'custom' && (
                <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                            {customRange?.from && customRange?.to ? (
                                `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d, yyyy')}`
                            ) : (
                                'Pick dates'
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="range"
                            selected={customRange}
                            onSelect={handleCustomRangeSelect}
                            numberOfMonths={2}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}
