'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File as FileIcon, X, Loader2, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { UserStorage } from '@/lib/storage';
import { useSession } from 'next-auth/react';

interface FileUploadProps {
    onUpload?: (file: File, bankAccount: string) => Promise<void>;
    onSuccess?: (data: any) => void;
}

export function FileUpload({ onUpload, onSuccess }: FileUploadProps) {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [selectedBank, setSelectedBank] = useState<string>('');
    const [newBankName, setNewBankName] = useState('');
    const [isAddingNewBank, setIsAddingNewBank] = useState(false);
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
    const [showExitModal, setShowExitModal] = useState(false);

    const { data: session } = useSession();
    const userEmail = session?.user?.email;

    // Get saved bank accounts from user-scoped storage
    const [bankAccounts, setBankAccounts] = useState<string[]>(['HDFC Bank', 'ICICI Bank']);

    useEffect(() => {
        if (userEmail) {
            const saved = UserStorage.getData<string[]>(userEmail, 'bankAccounts', ['HDFC Bank', 'ICICI Bank']);
            setBankAccounts(saved);
        }
    }, [userEmail]);

    const [isEditingName, setIsEditingName] = useState(false);
    const [editedFileName, setEditedFileName] = useState('');

    // Persistence and Exit Prevention
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isUploading) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isUploading]);

    // Check for existing upload on mount
    useEffect(() => {
        if (userEmail) {
            const data = UserStorage.getData<any>(userEmail, 'current_upload', null);
            if (data) {
                // If it's the same session/file, we could resume, but for now let's just clear if it's old
                if (Date.now() - data.timestamp > 10 * 60 * 1000) {
                    UserStorage.saveData(userEmail, 'current_upload', null);
                }
            }
        }
    }, [userEmail]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setEditedFileName(acceptedFiles[0].name);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/pdf': ['.pdf']
        },
        maxFiles: 1,
    });

    const handleAddNewBank = () => {
        if (newBankName.trim() && userEmail) {
            const updatedBanks = [...bankAccounts, newBankName.trim()];
            setBankAccounts(updatedBanks);
            UserStorage.saveData(userEmail, 'bankAccounts', updatedBanks);
            setSelectedBank(newBankName.trim());
            setNewBankName('');
            setIsAddingNewBank(false);
        }
    };

    const handleUpload = async () => {
        if (!file || !selectedBank) return;

        setIsUploading(true);
        setProgress(5);
        setElapsedTime(0);

        // Estimate: ~45 seconds for a standard statement
        const totalEstimate = 45;
        setEstimatedTimeRemaining(totalEstimate);

        const startTime = Date.now();

        // Save to user-scoped storage for persistence
        if (userEmail) {
            UserStorage.saveData(userEmail, 'current_upload', {
                fileName: file.name,
                bank: selectedBank,
                timestamp: startTime,
                status: 'processing'
            });
        }

        const timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setElapsedTime(elapsed);
            setEstimatedTimeRemaining(Math.max(0, totalEstimate - elapsed));
        }, 1000);

        try {
            // Simulate progress more realistically
            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 95) {
                        clearInterval(progressInterval);
                        return 95;
                    }
                    const increment = prev < 50 ? 5 : (prev < 80 ? 2 : 1);
                    return prev + increment;
                });
            }, 800);

            // Capture the response data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bankAccount', selectedBank);
            formData.append('email', userEmail || '');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Upload failed');
            }

            const data = await response.json();

            clearInterval(progressInterval);
            clearInterval(timerInterval);
            setProgress(100);
            setEstimatedTimeRemaining(0);

            if (userEmail) UserStorage.saveData(userEmail, 'current_upload', null);

            // Pass the data back to parent
            if (onSuccess) {
                onSuccess(data);
            }

            return data;
        } catch (error: any) {
            console.error('Upload failed', error);
            clearInterval(timerInterval);
            if (userEmail) UserStorage.saveData(userEmail, 'current_upload', null);

            // Show specific error message
            const message = error.message || 'Failed to upload file';
            alert(`Upload Error: ${message}`);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        setProgress(0);
        setElapsedTime(0);
    };

    const handleRenameFile = () => {
        if (file && editedFileName.trim()) {
            const renamedFile = new File([file], editedFileName.trim(), { type: file.type });
            setFile(renamedFile);
            setIsEditingName(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            {/* Bank Account Selector */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="h-4 w-4" />
                        Select Bank Account
                    </div>

                    {!isAddingNewBank ? (
                        <div className="space-y-2">
                            <Select value={selectedBank} onValueChange={setSelectedBank} disabled={isUploading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose bank account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bankAccounts.map(bank => (
                                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => setIsAddingNewBank(true)}
                                disabled={isUploading}
                            >
                                + Add New Bank
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Input
                                placeholder="Enter bank name (e.g., SBI, Axis Bank)"
                                value={newBankName}
                                onChange={(e) => setNewBankName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddNewBank()}
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={handleAddNewBank}
                                    disabled={!newBankName.trim()}
                                >
                                    Add
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddingNewBank(false);
                                        setNewBankName('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* File Upload Area */}
            {!file ? (
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
                        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                        !selectedBank && "opacity-50 pointer-events-none"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="p-4 rounded-full bg-muted">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">
                                {selectedBank ? 'Drag & drop your statement here' : 'Select a bank account first'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                CSV, Excel, or PDF (max 10MB)
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="p-2 rounded-md bg-primary/10 shrink-0">
                                    <FileIcon className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-1 flex-1 min-w-0">
                                    {isEditingName ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={editedFileName}
                                                onChange={(e) => setEditedFileName(e.target.value)}
                                                onBlur={handleRenameFile}
                                                onKeyDown={(e) => e.key === 'Enter' && handleRenameFile()}
                                                className="h-7 text-sm"
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group">
                                            <p
                                                className="text-sm font-medium truncate max-w-[200px] cursor-pointer hover:underline decoration-dashed underline-offset-4"
                                                onClick={() => !isUploading && setIsEditingName(true)}
                                                title="Click to rename"
                                            >
                                                {file.name}
                                            </p>
                                            {!isUploading && (
                                                <button
                                                    onClick={() => setIsEditingName(true)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB • {selectedBank}
                                    </p>
                                </div>
                            </div>
                            {!isUploading ? (
                                <Button variant="ghost" size="icon" onClick={removeFile} aria-label="Remove file" className="shrink-0 ml-2">
                                    <X className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowExitModal(true)}
                                    className="shrink-0 ml-2 text-muted-foreground hover:text-red-500"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {isUploading && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <div className="flex flex-col">
                                        {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 ? (
                                            <span className="text-blue-500 font-medium">Est. remaining: ~{estimatedTimeRemaining}s</span>
                                        ) : (
                                            <span className="text-orange-500 font-medium italic animate-pulse">Finalizing forensic analysis...</span>
                                        )}
                                    </div>
                                    <span className="font-bold text-foreground">{progress}%</span>
                                </div>
                                <Progress value={progress} />
                                <p className="text-[10px] text-center text-muted-foreground italic">
                                    {progress < 30 && "Extracting transaction data..."}
                                    {progress >= 30 && progress < 70 && "Running AI forensic merchant identification..."}
                                    {progress >= 70 && progress < 95 && "Categorizing and mapping insights..."}
                                    {progress >= 95 && "Completing deep scan..."}
                                </p>
                            </div>
                        )}

                        <Button
                            className="w-full"
                            onClick={handleUpload}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                'Analyze Statement'
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}
            {/* Exit Prevention Modal */}
            <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
                <DialogContent className="sm:max-w-[425px] bg-slate-950 border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-white">Analysis in Progress</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Please do not exit or cancel while the AI is performing forensic analysis.
                            Interrupting this process may lead to incomplete data.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end">
                        <Button onClick={() => setShowExitModal(false)} className="bg-blue-600 hover:bg-blue-700">
                            Got it, I'll wait
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
