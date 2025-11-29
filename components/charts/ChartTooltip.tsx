import { formatCurrency } from '@/lib/chartUtils';

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
}

export function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 border rounded-lg shadow-lg">
                <p className="font-semibold text-gray-900">{label || payload[0].name}</p>
                <p className="text-sm text-gray-600">
                    {formatCurrency(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
}
