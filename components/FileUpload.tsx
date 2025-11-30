'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'; // I need to install this!
import { Upload, File, X, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    onUpload: (file: File, bankAccount: string) => Promise<void>;
}

export function FileUpload({ onUpload }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedBank, setSelectedBank] = useState<string>('');
    const [newBankName, setNewBankName] = useState('');
    const [isAddingNewBank, setIsAddingNewBank] = useState(false);

    // Get saved bank accounts from localStorage
    const [bankAccounts, setBankAccounts] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('bankAccounts');
            return saved ? JSON.parse(saved) : ['HDFC Bank', 'ICICI Bank'];
        }
        return ['HDFC Bank', 'ICICI Bank'];
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        maxFiles: 1,
    });

    const handleAddNewBank = () => {
        if (newBankName.trim()) {
            const updatedBanks = [...bankAccounts, newBankName.trim()];
            setBankAccounts(updatedBanks);
            localStorage.setItem('bankAccounts', JSON.stringify(updatedBanks));
            setSelectedBank(newBankName.trim());
            setNewBankName('');
            setIsAddingNewBank(false);
        }
    };

    const handleUpload = async () => {
        if (!file || !selectedBank) return;

        setIsUploading(true);
        setProgress(10);

        try {
            // Simulate progress
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);

            await onUpload(file, selectedBank);

            clearInterval(interval);
            setProgress(100);
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        setProgress(0);
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
                            <Select value={selectedBank} onValueChange={setSelectedBank}>
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
                                PDF, CSV or Excel (max 10MB)
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-md bg-primary/10">
                                    <File className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium truncate max-w-[200px]">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB • {selectedBank}
                                    </p>
                                </div>
                            </div>
                            {!isUploading && (
                                <Button variant="ghost" size="icon" onClick={removeFile} aria-label="Remove file">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {isUploading && (
                            <div className="space-y-2">
                                <Progress value={progress} />
                                <p className="text-xs text-center text-muted-foreground">
                                    Processing transactions...
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
        </div>
    );
}
