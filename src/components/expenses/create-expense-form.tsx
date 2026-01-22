'use client'

import { useState, useActionState, useEffect } from 'react'
import { parseReceiptAction, createExpense } from "@/lib/expense-actions"
import { checkExpensePolicy } from "@/lib/policy-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertTriangle, Camera } from "lucide-react"

const initialState = {
    message: '',
}

export function CreateExpenseForm({ users }: { users?: any[] }) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [isParsing, setIsParsing] = useState(false)
    const [parsedData, setParsedData] = useState<any>(null)
    const [state, formAction, isPending] = useActionState(createExpense, initialState)

    // Policy Check State
    const [amount, setAmount] = useState<string>('')
    const [category, setCategory] = useState<string>('')
    const [warning, setWarning] = useState<string | null>(null)

    // Debounce check
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (amount && category) {
                const result = await checkExpensePolicy(category, Number(amount));
                setWarning(result.warning || null);
            } else {
                setWarning(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [amount, category]);

    // Update validation state when parsed data changes
    useEffect(() => {
        if (parsedData) {
            if (parsedData.amount) setAmount(parsedData.amount.toString());
            if (parsedData.category) setCategory(parsedData.category);
        }
    }, [parsedData]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // ...
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setPreview(URL.createObjectURL(selectedFile))
            setParsedData(null) // Reset previous data
        }
    }

    const handleParse = async () => {
        if (!file) return;

        setIsParsing(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const result = await parseReceiptAction(formData)
            if (result.success) {
                setParsedData(result.data)
            } else {
                alert(`AI Hata: ${result.error || "Fiş okunamadı"}`)
            }
        } catch (error) {
            console.error(error)
            alert("Bir hata oluştu.")
        } finally {
            setIsParsing(false)
        }
    }

    // Offline Handling
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        setIsOffline(!navigator.onLine);
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleOfflineSubmit = () => {
        // Collect form data manually since we are not using the server action
        // We use a simplified object for local storage
        const offlineData = {
            id: crypto.randomUUID(),
            date: Date.now(),
            formData: {
                amount: amount,
                date: (document.getElementById('date') as HTMLInputElement)?.value,
                category: category,
                description: (document.getElementById('description') as HTMLInputElement)?.value,
                merchant: (document.getElementById('merchant') as HTMLInputElement)?.value,
                warnings: parsedData?.warnings?.join('; ') || ''
            }
        };

        const existing = JSON.parse(localStorage.getItem('offline_expenses') || '[]');
        localStorage.setItem('offline_expenses', JSON.stringify([...existing, offlineData]));

        alert('Harcama çevrimdışı taslaklara kaydedildi. İnternet bağlantısı geldiğinde senkronize edebilirsiniz.');

        // Reset form (rough way)
        window.location.reload();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Upload & Preview */}
            <div className="space-y-4">
                <form action={formAction} className="space-y-6 max-w-2xl bg-white p-6 rounded shadow">
                    {state.message && (
                        <div className="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50" role="alert">
                            {state.message}
                        </div>
                    )}

                    {/* Admin User Selection */}
                    {users && users.length > 0 && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <Label htmlFor="targetUserId" className="text-yellow-800 font-semibold mb-2 block">Kullanıcı Seçimi (Admin)</Label>
                            <select
                                name="targetUserId"
                                id="targetUserId"
                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            >
                                <option value="">Kendim (Oturum Açan Kullanıcı)</option>
                                {users.map((u: any) => (
                                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                ))}
                            </select>
                            <p className="text-xs text-yellow-700 mt-1">Seçilen kullanıcı adına harcama kaydedilecektir.</p>
                        </div>
                    )}

                    {/* Policy Warning */}
                    {warning && (
                        <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 flex items-start gap-2 border border-yellow-200">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <span>{warning}</span>
                        </div>
                    )}

                    {/* File Upload */}
                    {/* File Upload */}
                    <div className="space-y-3">
                        <Label htmlFor="receipt">Fiş/Fatura Yükle (AI ile Otomatik Doldur)</Label>

                        <div className="flex gap-2">
                            {/* Camera Button for Mobile */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('camera_receipt')?.click()}
                                className="whitespace-nowrap gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200"
                            >
                                <Camera className="h-4 w-4" />
                                Fotoğraf Çek
                            </Button>

                            {/* Standard Input */}
                            <Input
                                id="receipt"
                                name="receipt"
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleFileChange}
                                className="flex-1"
                            />
                        </div>

                        {/* Hidden Input for Camera Capture */}
                        <input
                            type="file"
                            id="camera_receipt"
                            name="camera_receipt"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        <Button type="button" onClick={handleParse} disabled={!file || isParsing} className="w-full">
                            {isParsing ? 'Okunuyor...' : 'AI ile Oku'}
                        </Button>

                        <p className="text-xs text-gray-500">
                            Fiş fotoğrafını çekip veya yükleyip "AI ile Oku" butonuna basarsanız bilgiler otomatik doldurulur.
                        </p>
                    </div>

                    {preview && (
                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border bg-gray-100">
                            <img src={preview} alt="Fiş önizlemesi" className="object-contain w-full h-full" />
                            {isParsing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <div className="flex flex-col items-center text-white">
                                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                        <span>AI Analiz Ediyor...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Tarih</Label>
                            <Input
                                id="date"
                                name="date"
                                type="text"
                                placeholder="GG.AA.YYYY"
                                defaultValue={parsedData?.date}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Tutar</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                defaultValue={parsedData?.amount}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="merchant">İşyeri/Tedarikçi</Label>
                        <Input
                            id="merchant"
                            name="merchant"
                            type="text"
                            placeholder="Örn: Migros, Shell..."
                            defaultValue={parsedData?.merchant}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Kategori</Label>
                        <Input
                            id="category"
                            name="category"
                            type="text"
                            placeholder="Örn: Yemek, Ulaşım..."
                            defaultValue={parsedData?.category}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        />
                        <p className="text-xs text-gray-400">Örnek limitler: Yemek (500), Taksi (300)</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Açıklama</Label>
                        <Input
                            id="description"
                            name="description"
                            type="text"
                            placeholder="Harcama detayları..."
                            defaultValue={parsedData?.description}
                        />
                    </div>

                    <input type="hidden" name="receiptUrl" value={parsedData?.receiptUrl || ''} />
                    <input type="hidden" name="warnings" value={parsedData?.warnings?.join('; ') || ''} />

                    <Button
                        type={isOffline ? "button" : "submit"}
                        onClick={isOffline ? handleOfflineSubmit : undefined}
                        className="w-full"
                        disabled={isParsing || isPending}
                        variant={isOffline ? "secondary" : "default"}
                    >
                        {isOffline ? 'Taslağa Kaydet (Çevrimdışı)' : 'Harcamayı Kaydet'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
