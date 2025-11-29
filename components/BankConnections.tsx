'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, RefreshCw, Trash2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface BankConnection {
    id: string;
    bank_name: string;
    account_number_masked: string;
    account_type: string;
    connection_status: 'pending' | 'active' | 'disconnected' | 'error';
    last_synced_at: string | null;
    created_at: string;
}

const INDIAN_BANKS = [
    'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank',
    'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India',
    'Bank of India', 'IndusInd Bank', 'Yes Bank', 'IDFC First Bank', 'Federal Bank',
    'RBL Bank', 'South Indian Bank', 'Karur Vysya Bank', 'City Union Bank'
];

export function BankConnections() {
    const { userEmail } = useAuth();
    const [connections, setConnections] = useState<BankConnection[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        bank_name: '',
        account_number: '',
        account_type: 'savings'
    });

    useEffect(() => {
        if (userEmail) {
            fetchConnections();
        }
    }, [userEmail]);

    const fetchConnections = async () => {
        try {
            const res = await fetch(`/api/bank-connections?email=${userEmail}`);
            if (res.ok) {
                const data = await res.json();
                setConnections(data.connections || []);
            }
        } catch (error) {
            console.error('Failed to fetch bank connections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        if (!formData.bank_name || !formData.account_number) return;

        try {
            const res = await fetch('/api/bank-connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    bank_name: formData.bank_name,
                    account_number: formData.account_number,
                    account_type: formData.account_type
                })
            });

            if (res.ok) {
                await fetchConnections();
                setDialogOpen(false);
                setFormData({ bank_name: '', account_number: '', account_type: 'savings' });
            }
        } catch (error) {
            console.error('Failed to connect bank:', error);
        }
    };

    const handleSync = async (connectionId: string) => {
        try {
            const res = await fetch(`/api/bank-connections/${connectionId}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });

            if (res.ok) {
                await fetchConnections();
            }
        } catch (error) {
            console.error('Failed to sync:', error);
        }
    };

    const handleDisconnect = async (connectionId: string) => {
        if (!confirm('Are you sure you want to disconnect this bank account?')) return;

        try {
            const res = await fetch(`/api/bank-connections/${connectionId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });

            if (res.ok) {
                await fetchConnections();
            }
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    };

    const getStatusIcon = (status: BankConnection['connection_status']) => {
        switch (status) {
            case 'active': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
            default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: BankConnection['connection_status']) => {
        const variants: Record<string, string> = {
            active: 'bg-green-50 text-green-700 border-green-200',
            error: 'bg-red-50 text-red-700 border-red-200',
            pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            disconnected: 'bg-gray-50 text-gray-700 border-gray-200'
        };

        return (
            <Badge variant="outline" className={variants[status]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    if (loading) {
        return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Connected Banks
                        </CardTitle>
                        <CardDescription>Auto-sync transactions from your bank accounts</CardDescription>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Connect Bank
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Connect Bank Account</DialogTitle>
                                <DialogDescription>
                                    Link your bank account for automatic transaction sync
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bank">Bank Name</Label>
                                    <Select value={formData.bank_name} onValueChange={(val) => setFormData({ ...formData, bank_name: val })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your bank" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {INDIAN_BANKS.map(bank => (
                                                <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account">Account Number</Label>
                                    <Input
                                        id="account"
                                        type="password"
                                        placeholder="Enter account number"
                                        value={formData.account_number}
                                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">We'll only store the last 4 digits</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Account Type</Label>
                                    <Select value={formData.account_type} onValueChange={(val) => setFormData({ ...formData, account_type: val })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="savings">Savings Account</SelectItem>
                                            <SelectItem value="current">Current Account</SelectItem>
                                            <SelectItem value="credit_card">Credit Card</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs text-blue-800">
                                        🔒 <strong>Secure Connection:</strong> We use bank-grade encryption. Your credentials are never stored.
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleConnect}>Connect</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {connections.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No banks connected yet</p>
                        <p className="text-sm mt-1">Connect your bank to auto-sync transactions</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {connections.map((conn) => (
                            <div key={conn.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(conn.connection_status)}
                                    <div>
                                        <p className="font-medium">{conn.bank_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            •••• {conn.account_number_masked} • {conn.account_type}
                                        </p>
                                        {conn.last_synced_at && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Last synced: {new Date(conn.last_synced_at).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(conn.connection_status)}
                                    {conn.connection_status === 'active' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSync(conn.id)}
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDisconnect(conn.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
