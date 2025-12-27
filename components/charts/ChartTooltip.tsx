import { formatCurrency } from '@/lib/chartUtils';

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
}

export function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-md p-3 border border-white/20 rounded-xl shadow-xl ring-1 ring-black/5 min-w-[120px]">
                <p className="font-bold text-gray-900 text-sm mb-1">{label || payload[0].name}</p>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-gray-500 font-medium">Amount</span>
                    <span className="text-sm font-bold text-indigo-600">
                        {formatCurrency(payload[0].value)}
                    </span>
                </div>
            </div>
        );
    }
    return null;
}
