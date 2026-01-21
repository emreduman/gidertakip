'use client'

import { useState, useEffect } from 'react'
import { WifiOff, RotateCw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createExpense } from '@/lib/expense-actions'
import { toast } from 'sonner'

interface OfflineDraft {
    id: string;
    date: number;
    formData: {
        amount: string;
        date: string;
        category: string;
        description: string;
        merchant: string;
        warnings: string;
    };
    fileName?: string; // We can't easily store files in localStorage, this is a limitation
}

export function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        // Check initial state
        setIsOnline(navigator.onLine);

        // Listen for changes
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Load drafts
        const saved = localStorage.getItem('offline_expenses');
        if (saved) {
            try {
                setDrafts(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse offline drafts", e);
            }
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        let syncedCount = 0;
        let failedCount = 0;
        const newDrafts = [...drafts];

        for (const draft of drafts) {
            const formData = new FormData();
            formData.append('amount', draft.formData.amount);
            formData.append('date', draft.formData.date);
            formData.append('category', draft.formData.category);
            formData.append('description', draft.formData.description);
            formData.append('merchant', draft.formData.merchant);
            formData.append('warnings', draft.formData.warnings);

            // Note: We cannot recover the File object from localStorage directly.
            // Users will need to re-attach receipt images or we just submit without receipt
            // and ask them to add it later. For now, we submit without receipt.

            try {
                const result = await createExpense(null, formData);
                if (result?.message) {
                    console.error("Sync failed for", draft.id, result.message);
                    failedCount++;
                } else {
                    syncedCount++;
                    const index = newDrafts.findIndex(d => d.id === draft.id);
                    if (index > -1) newDrafts.splice(index, 1);
                }
            } catch (e) {
                console.error("Sync error", e);
                failedCount++;
            }
        }

        setDrafts(newDrafts);
        localStorage.setItem('offline_expenses', JSON.stringify(newDrafts));
        setIsSyncing(false);

        if (syncedCount > 0) toast.success(`${syncedCount} harcama senkronize edildi.`);
        if (failedCount > 0) toast.error(`${failedCount} harcama senkronize edilemedi.`);
    };

    if (isOnline && drafts.length === 0) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
            {!isOnline && (
                <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm font-medium">Çevrimdışı Mod</span>
                </div>
            )}

            {isOnline && drafts.length > 0 && (
                <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg flex flex-col gap-2 max-w-xs">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">{drafts.length} Bekleyen Harcama</span>
                    </div>
                    <p className="text-xs text-blue-100">
                        Çevrimdışı iken kaydettiğiniz harcamalar var. (Not: Görseller tekrar yüklenmelidir)
                    </p>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="w-full mt-1"
                    >
                        {isSyncing ? <RotateCw className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isSyncing ? 'Senkronize Ediliyor...' : 'Şimdi Gönder'}
                    </Button>
                </div>
            )}
        </div>
    )
}
