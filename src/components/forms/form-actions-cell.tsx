'use client'

import { useState } from "react"
import { deleteForm } from "@/lib/form-actions"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2, Info } from "lucide-react"
import { toast } from "sonner"

export function FormActionsCell({ formId, status }: { formId: string, status: string }) {
    const [isDeleting, setIsDeleting] = useState(false);

    // Can only delete if NOT Approved or Paid
    const canDelete = status !== 'APPROVED' && status !== 'PAID';

    if (!canDelete) return null;

    async function handleDelete() {
        if (!confirm('Bu masraf formunu silmek istediğinize emin misiniz? Harcamalar "Harcamalarım" sayfasına geri dönecektir.')) return;

        setIsDeleting(true);
        try {
            const res = await deleteForm(formId);
            if (res.success) {
                toast.success('Form silindi. Harcamalar havuza aktarıldı.');
            } else {
                toast.error(res.message);
            }
        } catch (e) {
            toast.error('Bir hata oluştu');
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="flex gap-2 items-center">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Formu sil (Harcamalar korunur)"
            >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
        </div>
    )
}
