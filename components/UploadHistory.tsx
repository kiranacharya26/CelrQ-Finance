'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { Trash2, FileText, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { UploadRecord } from '@/types';
import { useTransactionsContext } from '@/context/TransactionsContext';

export function UploadHistory() {
    const { data: session } = useSession();
    const { refresh, transactions } = useTransactionsContext();
    const [uploads, setUploads] = useState<UploadRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isClearingAll, setIsClearingAll] = useState(false);

    const fetchUploads = async () => {
        if (!session?.user?.email) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/uploads?email=${encodeURIComponent(session.user.email)}`);
            const data = await res.json();
            if (data.uploads) {
                setUploads(data.uploads);
            }
        } catch (error) {
            console.error('Error fetching uploads:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUploads();
    }, [session]);

    const handleDelete = async (id: string) => {
        if (!session?.user?.email) return;
        try {
            setDeletingId(id);
            const res = await fetch(`/api/uploads?id=${id}&email=${encodeURIComponent(session.user.email)}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                // Remove from local state
                setUploads(prev => prev.filter(u => u.id !== id));
                // Refresh transactions context to update dashboard
                refresh();
            } else {
                console.error('Failed to delete upload');
            }
        } catch (error) {
            console.error('Error deleting upload:', error);
        } finally {
            setDeletingId(null);
        }
    };

    const handleClearAll = async () => {
        if (!session?.user?.email) return;
        try {
            setIsClearingAll(true);
            const res = await fetch('/api/transactions/clear-all', {
                method: 'POST',
            });

            if (res.ok) {
                setUploads([]);
                refresh();
            } else {
                console.error('Failed to clear all transactions');
            }
        } catch (error) {
            console.error('Error clearing all transactions:', error);
        } finally {
            setIsClearingAll(false);
        }
    };

    if (!session?.user?.email) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Upload History
                    </CardTitle>
                    <CardDescription>
                        Manage your uploaded statements. Deleting a file will remove all associated transactions.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {(uploads.length > 0 || transactions.length > 0) && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10 border-destructive/20"
                                    disabled={isClearingAll || loading}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Clear All Data
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Clear all transaction data?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete <strong>ALL</strong> transactions and upload records from your account.
                                        <br /><br />
                                        Your merchant rules (Memory Bank) and financial goals will be preserved.
                                        <br /><br />
                                        This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleClearAll}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        {isClearingAll ? 'Clearing...' : 'Clear Everything'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
                        ))}
                    </div>
                ) : uploads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No upload history found.</p>
                        <p className="text-xs mt-2">If you still see transactions, use the "Clear All Data" button above.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {uploads.map((upload) => (
                            <div
                                key={upload.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                            >
                                <div className="flex items-start gap-3 overflow-hidden">
                                    <div className="p-2 rounded-md bg-primary/10 mt-1">
                                        <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">{upload.file_name}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                                                {upload.bank_name}
                                            </Badge>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(upload.upload_date), 'MMM d, yyyy')}
                                            </span>
                                            <span>•</span>
                                            <span>{upload.transaction_count} txns</span>
                                        </div>
                                    </div>
                                </div>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            disabled={deletingId === upload.id}
                                        >
                                            {deletingId === upload.id ? (
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete this upload?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete the file record <strong>"{upload.file_name}"</strong> and remove all <strong>{upload.transaction_count}</strong> transactions associated with it.
                                                <br /><br />
                                                This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDelete(upload.id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
