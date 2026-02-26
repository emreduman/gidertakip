'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { bulkUpdateExpenses } from "@/lib/expense-actions";
import { toast } from "sonner";

interface BulkActionsProps {
    selectedIds: string[];
    onClearSelection: () => void;
}

export function BulkActions({ selectedIds, onClearSelection }: BulkActionsProps) {
    const [isPending, setIsPending] = useState(false);

    if (selectedIds.length === 0) return null;

    const handleAction = async (action: 'APPROVED' | 'REJECTED') => {
        setIsPending(true);
        try {
            const result = await bulkUpdateExpenses(selectedIds, action);
            if (result.success) {
                toast.success(result.message);
                onClearSelection(); // Clear selection after success
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("İşlem sırasında beklenmeyen bir hata oluştu.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
            <span className="font-medium bg-gray-800 px-3 py-1 rounded-full text-sm">
                {selectedIds.length} seçili
            </span>

            <div className="h-6 w-px bg-gray-700 mx-2"></div>

            <Button
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 gap-2"
                onClick={() => handleAction('APPROVED')}
                disabled={isPending}
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Toplu Onayla
            </Button>

            <Button
                size="sm"
                variant="destructive"
                className="rounded-full px-4 gap-2"
                onClick={() => handleAction('REJECTED')}
                disabled={isPending}
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Toplu Reddet
            </Button>

            <div className="h-6 w-px bg-gray-700 mx-2"></div>

            <button
                onClick={onClearSelection}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Seçimi Temizle"
                disabled={isPending}
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}
