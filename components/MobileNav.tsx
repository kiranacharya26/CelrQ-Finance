'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PieChart, Plus, List, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { FileUpload } from '@/components/FileUpload';

import { useAuth } from '@/hooks/useAuth';
import { useTransactionsContext } from '@/context/TransactionsContext';

export function MobileNav() {
    const pathname = usePathname();
    const { userEmail } = useAuth();
    const { refresh } = useTransactionsContext();

    const isActive = (path: string) => pathname === path;

    const handleUpload = async (file: File, bank: string) => {
        if (!userEmail) {
            console.error('No user email found');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('bankAccount', bank);
        formData.append('email', userEmail);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            // Refresh context to update transactions
            refresh();
            console.log('Upload successful');
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${(error as Error).message}`);
        }
    };

    if (!userEmail) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 block md:hidden">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-lg border-t border-border/50" />

            <div className="relative flex items-center justify-around h-16 px-2 pb-safe">
                {/* Home */}
                <Link href="/dashboard" className={`flex flex-col items-center justify-center w-12 h-12 gap-1 transition-colors ${isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Home className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                {/* Transactions */}
                <Link href="/transactions" className={`flex flex-col items-center justify-center w-12 h-12 gap-1 transition-colors ${isActive('/transactions') ? 'text-primary' : 'text-muted-foreground'}`}>
                    <List className="h-5 w-5" />
                    <span className="text-[10px] font-medium">History</span>
                </Link>

                {/* Upload (Center Floating) */}
                <div className="-mt-6">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                size="icon"
                                className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground border-4 border-background"
                            >
                                <Plus className="h-6 w-6" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Upload Statement</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <FileUpload onUpload={handleUpload} />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Insights */}
                <Link href="/insights" className={`flex flex-col items-center justify-center w-12 h-12 gap-1 transition-colors ${isActive('/insights') ? 'text-primary' : 'text-muted-foreground'}`}>
                    <PieChart className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Insights</span>
                </Link>

                {/* Settings */}
                <Link href="/settings" className={`flex flex-col items-center justify-center w-12 h-12 gap-1 transition-colors ${isActive('/settings') ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Settings className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Settings</span>
                </Link>
            </div>
        </div>
    );
}
