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
    const { refresh } = useTransactionsContext();
    const [uploads, setUploads] = useState<UploadRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

    if (!session?.user?.email) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Upload History
                </CardTitle>
                <CardDescription>
                    Manage your uploaded statements. Deleting a file will remove all associated transactions.
                </CardDescription>
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
                        <p>No uploads found.</p>
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
