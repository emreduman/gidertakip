'use client'

import { useState } from "react"
import { deleteExpense, updateExpense } from "@/lib/expense-actions"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

export function ExpenseActionsCell({ expense }: { expense: any }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [open, setOpen] = useState(false);

    // Edit Form State
    // Note: Date formatting for input type="date" requires YYYY-MM-DD
    const formatDateForInput = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toISOString().split('T')[0];
    }

    // UI Format assumption: DD.MM.YYYY
    const formatInputToUI = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
    }

    async function handleDelete() {
        if (!confirm('Bu harcamayı silmek istediğinize emin misiniz?')) return;

        setIsDeleting(true);
        try {
            const res = await deleteExpense(expense.id);
            if (res.success) {
                toast.success('Harcama silindi');
            } else {
                toast.error(res.message);
            }
        } catch (e) {
            toast.error('Bir hata oluştu');
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleEdit(formData: FormData) {
        setIsEditing(true);

        // Convert YYYY-MM-DD back to DD.MM.YYYY for the server action
        const rawDate = formData.get('date') as string;
        formData.set('date', formatInputToUI(rawDate));

        try {
            const res = await updateExpense(expense.id, formData);
            if (res.success) {
                toast.success('Harcama güncellendi');
                setOpen(false);
            } else {
                toast.error(res.message);
            }
        } catch (e) {
            toast.error('Güncelleme hatası');
        } finally {
            setIsEditing(false);
        }
    }

    // Only allow actions if PENDING, REJECTED (or SUBMITTED if flexible, but usually locked)
    // User requirement: "Harcamalarım" -> My Expenses. usually PENDING.
    const canEdit = expense.status === 'PENDING' || expense.status === 'REJECTED';

    if (!canEdit) return null;

    return (
        <div className="flex gap-2 justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                        <Pencil className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Harcama Düzenle</DialogTitle>
                        <DialogDescription>
                            Harcama detaylarını güncelleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={handleEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Tarih</Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                defaultValue={formatDateForInput(expense.date)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="merchant">İşyeri</Label>
                            <Input
                                id="merchant"
                                name="merchant"
                                defaultValue={expense.merchant || ''}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Kategori</Label>
                            <Input
                                id="category"
                                name="category"
                                defaultValue={expense.category || ''}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Açıklama</Label>
                            <Input
                                id="description"
                                name="description"
                                defaultValue={expense.description || ''}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Tutar</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                defaultValue={expense.amount}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                            <Button type="submit" disabled={isEditing}>
                                {isEditing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Kaydet
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                onClick={handleDelete}
                disabled={isDeleting}
            >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
        </div>
    )
}
