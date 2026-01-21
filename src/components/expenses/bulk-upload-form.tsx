'use client'

import { useState } from 'react'
import { parseReceiptAction, createBulkExpenses } from "@/lib/expense-actions"
import { checkExpensePolicy } from "@/lib/policy-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Trash2, CheckCircle, UploadCloud } from "lucide-react"

interface DraftExpense {
    id: string; // temp id
    file: File;
    status: 'pending' | 'parsing' | 'success' | 'error';
    data?: {
        date: string;
        amount: number;
        merchant: string;
        category: string;
        description: string;
        receiptUrl?: string;
    };
    error?: string;
    warning?: string; // Policy warning
}

export function BulkUploadForm() {
    const [drafts, setDrafts] = useState<DraftExpense[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        const newFiles = Array.from(e.target.files).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            status: 'pending' as const
        }));

        setDrafts(prev => [...prev, ...newFiles]);

        // Auto start parsing
        // In a real app we might want to queue this to avoid rate limits
        newFiles.forEach(draft => parseFile(draft));
    }

    const parseFile = async (baseDraft: DraftExpense) => {
        setDrafts(prev => prev.map(d => d.id === baseDraft.id ? { ...d, status: 'parsing' } : d));

        const formData = new FormData();
        formData.append('file', baseDraft.file);

        try {
            const result = await parseReceiptAction(formData);
            if (result.success && result.data) {
                // Check policy immediately if data is available
                let warning = undefined;
                if (result.data.category && result.data.amount) {
                    const policy = await checkExpensePolicy(result.data.category, result.data.amount);
                    if (policy.warning) warning = policy.warning;
                }

                setDrafts(prev => prev.map(d => d.id === baseDraft.id ? {
                    ...d,
                    status: 'success',
                    data: {
                        date: result.data.date || '',
                        amount: result.data.amount,
                        merchant: result.data.merchant || '',
                        category: result.data.category || '',
                        description: result.data.description || '',
                        receiptUrl: ''
                    },
                    warning
                } : d));
            } else {
                setDrafts(prev => prev.map(d => d.id === baseDraft.id ? { ...d, status: 'error', error: 'AI could not read' } : d));
            }
        } catch (e) {
            setDrafts(prev => prev.map(d => d.id === baseDraft.id ? { ...d, status: 'error', error: 'Parse failed' } : d));
        }
    }

    const updateDraft = async (id: string, field: string, value: any) => {
        // Optimistic update
        setDrafts(prev => prev.map(d => {
            if (d.id === id && d.data) {
                return { ...d, data: { ...d.data, [field]: value } }
            }
            return d;
        }));

        // Policy check if relevant fields change
        if (field === 'category' || field === 'amount') {
            const draft = drafts.find(d => d.id === id);
            if (draft && draft.data) {
                const newData = { ...draft.data, [field]: value };
                if (newData.category && newData.amount) {
                    const policy = await checkExpensePolicy(newData.category, Number(newData.amount));
                    setDrafts(prev => prev.map(d => d.id === id ? { ...d, warning: policy.warning || undefined } : d));
                }
            }
        }
    }

    const removeDraft = (id: string) => {
        setDrafts(prev => prev.filter(d => d.id !== id));
    }

    const handleBulkSave = async () => {
        const validDrafts = drafts.filter(d => d.status === 'success' && d.data);
        if (validDrafts.length === 0) return;

        setIsSubmitting(true);
        // Important: Order of expenses and files must match!
        const expenseData = validDrafts.map(d => d.data);

        const formData = new FormData();
        formData.append('expenses', JSON.stringify(expenseData));

        // Append files in order
        validDrafts.forEach(draft => {
            formData.append('files', draft.file);
        });

        const result = await createBulkExpenses(null, formData);

        setIsSubmitting(false);
        if (result.success) {
            setUploadStatus('success');
            setDrafts([]); // Clear or maybe keep failed ones? Clear for now.
        } else {
            setUploadStatus('error');
            alert(result.message);
        }
    }

    if (uploadStatus === 'success') {
        return (
            <div className="text-center p-10 bg-green-50 rounded border border-green-200">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-green-800">Başarıyla Kaydedildi!</h3>
                <p className="text-green-700 mb-4">Tüm fişleriniz sisteme işlendi.</p>
                <Button onClick={() => setUploadStatus('idle')} variant="outline">Yeni Yükleme Yap</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFiles}
                />
                <div className="flex flex-col items-center gap-2 text-gray-500">
                    <UploadCloud className="h-10 w-10" />
                    <span className="font-semibold text-lg">Dosyaları Buraya Sürükleyin veya Seçin</span>
                    <span className="text-sm">Resim veya PDF (Çoklu seçim yapılabilir)</span>
                </div>
            </div>

            {drafts.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Taslaklar ({drafts.length})</h3>
                    <div className="grid gap-4">
                        {drafts.map((draft, index) => (
                            <Card key={draft.id} className="relative">
                                <Button
                                    className="absolute top-2 right-2 h-8 w-8 p-0"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeDraft(draft.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>

                                <CardContent className="p-4 pt-4">
                                    <div className="flex gap-4 items-start">
                                        {/* Status / Preview */}
                                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center shrink-0">
                                            {draft.status === 'parsing' && <Loader2 className="animate-spin text-blue-500" />}
                                            {draft.status === 'error' && <span className="text-red-500 text-xs text-center font-bold">HATA</span>}
                                            {draft.status === 'success' && <CheckCircle className="text-green-500" />}
                                            {draft.status === 'pending' && <span className="text-xs text-gray-400">...</span>}
                                        </div>

                                        {/* Form Fields */}
                                        {draft.status === 'success' && draft.data ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full pr-8">
                                                <div>
                                                    <Label className="text-xs">Tarih</Label>
                                                    <Input
                                                        value={draft.data.date}
                                                        onChange={(e) => updateDraft(draft.id, 'date', e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Tutar</Label>
                                                    <Input
                                                        value={draft.data.amount}
                                                        type="number"
                                                        onChange={(e) => updateDraft(draft.id, 'amount', e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">İşyeri</Label>
                                                    <Input
                                                        value={draft.data.merchant}
                                                        onChange={(e) => updateDraft(draft.id, 'merchant', e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Kategori</Label>
                                                    <Input
                                                        value={draft.data.category}
                                                        onChange={(e) => updateDraft(draft.id, 'category', e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="col-span-2 md:col-span-4">
                                                    <Label className="text-xs">Açıklama</Label>
                                                    <Input
                                                        value={draft.data.description}
                                                        onChange={(e) => updateDraft(draft.id, 'description', e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center">
                                                <p className="text-sm text-gray-500">
                                                    {draft.status === 'parsing' ? 'AI analiz ediyor...' :
                                                        draft.status === 'error' ? 'Okunamadı. Lütfen manuel girin veya silin.' :
                                                            draft.file.name}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex justify-end pt-4 sticky bottom-4">
                        <Button onClick={handleBulkSave} disabled={isSubmitting || drafts.some(d => d.status === 'parsing')}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Tümünü Kaydet ({drafts.filter(d => d.status === 'success').length})
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
