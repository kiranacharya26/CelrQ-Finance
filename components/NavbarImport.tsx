'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Upload } from 'lucide-react';
import { UploadHistory } from '@/components/UploadHistory';
import { FileUpload } from '@/components/FileUpload';
import { UploadSummary } from '@/components/UploadSummary';
import { useTransactionsContext } from '@/context/TransactionsContext';
import { usePathname } from 'next/navigation';

export function NavbarImport({ mobile = false }: { mobile?: boolean }) {
    const pathname = usePathname();
    const { refresh } = useTransactionsContext();

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [summaryData, setSummaryData] = useState<any>(null);

    // Only show on dashboard page
    if (pathname !== '/dashboard') {
        return null;
    }

    const handleUploadSuccess = (data: any) => {
        setSummaryData(data);
        refresh();
    };

    const handleCloseUpload = () => {
        setIsUploadOpen(false);
        setSummaryData(null);
    };

    return (
        <Dialog open={isUploadOpen} onOpenChange={(open) => {
            setIsUploadOpen(open);
            if (!open) setSummaryData(null);
        }}>
            <DialogTrigger asChild>
                <Button
                    variant={mobile ? "ghost" : "default"}
                    className={mobile
                        ? "justify-start px-0 text-lg font-medium text-muted-foreground hover:text-primary w-full"
                        : "shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 h-9"
                    }
                >
                    <Upload className={mobile ? "mr-2 h-5 w-5" : "mr-2 h-4 w-4"} />
                    <span>Import Statement</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{summaryData ? 'Statement Summary' : 'Import Bank Statement'}</DialogTitle>
                    <DialogDescription>
                        {summaryData
                            ? 'Here is a quick look at what we found in your statement.'
                            : 'Upload your bank statement (PDF, CSV, Excel) to analyze transactions.'}
                    </DialogDescription>
                </DialogHeader>

                {summaryData ? (
                    <UploadSummary data={summaryData} onClose={handleCloseUpload} />
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm flex items-start gap-2">
                            <div className="mt-0.5">ℹ️</div>
                            <div>
                                <strong>Tip:</strong> Name your files clearly (e.g., "HDFC-Aug-2024.pdf") to easily identify and manage them in your upload history later.
                            </div>
                        </div>
                        <FileUpload onSuccess={handleUploadSuccess} />

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or manage existing
                                </span>
                            </div>
                        </div>

                        <UploadHistory />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
