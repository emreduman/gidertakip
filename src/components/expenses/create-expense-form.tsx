'use client'

import { useState, useActionState, useEffect } from 'react'
import { parseReceiptAction, createExpense } from "@/lib/expense-actions"
import { checkExpensePolicy } from "@/lib/policy-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertTriangle, Camera, Sparkles, CheckCircle2 } from "lucide-react"

const initialState = {
    message: '',
}

export function CreateExpenseForm({ users }: { users?: any[] }) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [isParsing, setIsParsing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
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

    const handleFile = (selectedFile: File) => {
        setFile(selectedFile)
        setPreview(URL.createObjectURL(selectedFile))
        setParsedData(null) // Reset previous data

        // Auto-trigger parse if desired. We'll leave it manual for now to let user confirm.
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            handleFile(droppedFile);

            // Assign to native input for FormData submission
            const fileInput = document.getElementById('receipt') as HTMLInputElement;
            if (fileInput) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(droppedFile);
                fileInput.files = dataTransfer.files;
            }

            e.dataTransfer.clearData();
        }
    };

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
                warnings: parsedData?.warnings ? parsedData.warnings.join('; ') : ''
            }
        };

        const existing = JSON.parse(localStorage.getItem('offline_expenses') || '[]');
        localStorage.setItem('offline_expenses', JSON.stringify([...existing, offlineData]));

        alert('Harcama çevrimdışı taslaklara kaydedildi. İnternet bağlantısı geldiğinde senkronize edebilirsiniz.');

        // Reset form (rough way)
        window.location.reload();
    };

    // Keyboard Shortcut (Cmd/Ctrl + Enter to Submit)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                // Trigger form submission
                const form = document.getElementById('create_expense_form') as HTMLFormElement;
                if (form) {
                    if (form.requestSubmit) {
                        form.requestSubmit();
                    } else {
                        form.submit();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left: Upload & Preview */}
            <div className="col-span-1 lg:col-span-5 space-y-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md h-full min-h-[500px] flex flex-col">
                    <h3 className="font-semibold text-lg text-slate-800 mb-4">Fiş / Fatura Görüntüsü</h3>

                    {!preview ? (
                        <div className="flex-1 flex flex-col justify-center">
                            {/* File Upload (Drag & Drop) */}
                            <div
                                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all duration-300 flex-1 ${isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
                                    }`}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onClick={() => document.getElementById('receipt')?.click()}
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                    <Camera className="h-8 w-8" />
                                </div>
                                <p className="text-base font-semibold text-slate-700 text-center mb-1">
                                    Dosyayı buraya sürükleyin veya <span className="text-indigo-600 underline cursor-pointer hover:text-indigo-700">seçin</span>
                                </p>
                                <p className="text-sm text-slate-500 mt-1">PNG, JPG, PDF (Maks. 5MB)</p>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={(e) => { e.stopPropagation(); document.getElementById('camera_receipt')?.click() }}
                                    className="mt-6 w-full max-w-[200px] gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border-indigo-200 rounded-lg sm:hidden"
                                >
                                    <Camera className="h-4 w-4" />
                                    Mobilden Çek
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-slate-200 shadow-inner bg-slate-900 group">
                            <img src={preview} alt="Fiş önizlemesi" className="object-contain w-full h-full transition-opacity group-hover:opacity-90" />
                            {isParsing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all">
                                    <div className="flex flex-col items-center text-white bg-slate-800/80 p-6 rounded-2xl border border-white/10 shadow-2xl">
                                        <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-400" />
                                        <span className="font-medium tracking-wide">AI Analiz Ediyor...</span>
                                    </div>
                                </div>
                            )}

                            {/* Option to clear/change file */}
                            {!isParsing && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPreview(null);
                                        setFile(null);
                                        setParsedData(null);
                                        const fileInput = document.getElementById('receipt') as HTMLInputElement;
                                        if (fileInput) fileInput.value = '';
                                    }}
                                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-md transition-colors"
                                    title="Görseli Değiştir"
                                >
                                    Değiştir
                                </button>
                            )}
                        </div>
                    )}

                    {/* Hidden Inputs for File Upload - Must remain outside conditional render to be included in FormData */}
                    <Input
                        id="receipt"
                        name="receipt"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        form="create_expense_form"
                    />
                    <input
                        type="file"
                        id="camera_receipt"
                        name="camera_receipt"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileChange}
                        form="create_expense_form"
                    />

                    {preview && (
                        <div className="mt-4">
                            <Button
                                type="button"
                                onClick={handleParse}
                                disabled={!file || isParsing}
                                className="w-full h-12 bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 hover:from-indigo-700 hover:via-indigo-600 hover:to-teal-600 text-white border-0 transition-all shadow-lg shadow-indigo-500/30 rounded-xl text-base font-medium"
                            >
                                {isParsing ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Okunuyor...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5" />
                                        <span>AI ile Otomatik Doldur</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Form Details */}
            <div className="col-span-1 lg:col-span-7">
                <form id="create_expense_form" action={formAction} className="space-y-6 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 relative transition-all hover:shadow-md">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-xl text-slate-800 tracking-tight">Harcama Detayları</h3>
                        {/* Keyboard Shortcut Hint */}
                        <div className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            <kbd className="font-mono font-medium text-slate-500">⌘</kbd> + <kbd className="font-mono font-medium text-slate-500">Enter</kbd>
                        </div>
                    </div>

                    {state.message && (
                        <div className="p-4 mb-4 text-sm text-indigo-800 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-3 animate-in fade-in zoom-in duration-300" role="alert">
                            <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
                            {state.message}
                        </div>
                    )}

                    {/* Admin User Selection */}
                    {users && users.length > 0 && (
                        <div className="mb-6 p-5 bg-amber-50/50 border border-amber-200/50 rounded-xl">
                            <Label htmlFor="targetUserId" className="text-amber-800 font-semibold mb-2 block">Kullanıcı Seçimi (Admin)</Label>
                            <select
                                name="targetUserId"
                                id="targetUserId"
                                className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Kendim (Oturum Açan Kullanıcı)</option>
                                {users?.map((u: any) => (
                                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                ))}
                            </select>
                            <p className="text-xs text-amber-700/80 mt-2">Harcama, seçilen kullanıcı adına kaydedilecektir.</p>
                        </div>
                    )}

                    {/* Policy Warning */}
                    {warning && (
                        <div className="p-4 mb-4 text-sm text-rose-800 rounded-xl bg-rose-50 flex items-start gap-3 border border-rose-200 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                            <span className="font-medium leading-relaxed">{warning}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                        <div className="space-y-2.5">
                            <Label htmlFor="date" className="text-slate-700 font-semibold text-sm">Tarih</Label>
                            <Input
                                id="date"
                                name="date"
                                type="text"
                                placeholder="GG.AA.YYYY"
                                defaultValue={parsedData?.date}
                                required
                                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500 shadow-sm"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <Label htmlFor="amount" className="text-slate-700 font-semibold text-sm">Tutar</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₺</span>
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
                                    className="h-11 pl-8 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500 shadow-sm font-semibold text-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                        <div className="space-y-2.5">
                            <Label htmlFor="taxRate" className="text-slate-700 font-semibold text-sm">KDV Oranı (%)</Label>
                            <div className="relative">
                                <Input
                                    id="taxRate"
                                    name="taxRate"
                                    type="number"
                                    step="0.01"
                                    placeholder="20"
                                    defaultValue={parsedData?.taxRate}
                                    className="h-11 pr-8 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500 shadow-sm"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <Label htmlFor="taxAmount" className="text-slate-700 font-semibold text-sm">KDV Tutarı</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₺</span>
                                <Input
                                    id="taxAmount"
                                    name="taxAmount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    defaultValue={parsedData?.taxAmount}
                                    className="h-11 pl-8 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {parsedData?.confidence && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm border shadow-sm ${parsedData.confidence >= 80 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            parsedData.confidence >= 50 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                            <CheckCircle2 className={`h-5 w-5 shrink-0 ${parsedData.confidence >= 80 ? 'text-emerald-600' : parsedData.confidence >= 50 ? 'text-amber-600' : 'text-rose-600'}`} />
                            <span>AI Okuma Güveni: <strong className="font-bold px-1.5 py-0.5 rounded-md bg-white/50 border border-black/5">% {parsedData.confidence}</strong></span>
                        </div>
                    )}

                    <div className="space-y-2.5">
                        <Label htmlFor="merchant" className="text-slate-700 font-semibold text-sm">İşyeri/Tedarikçi</Label>
                        <Input
                            id="merchant"
                            name="merchant"
                            type="text"
                            placeholder="Örn: Migros, Shell..."
                            defaultValue={parsedData?.merchant}
                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500 shadow-sm"
                        />
                    </div>

                    <div className="space-y-2.5">
                        <Label htmlFor="category" className="text-slate-700 font-semibold text-sm">Kategori</Label>
                        <Input
                            id="category"
                            name="category"
                            type="text"
                            placeholder="Örn: Yemek, Ulaşım..."
                            defaultValue={parsedData?.category}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500 shadow-sm"
                        />
                        <p className="text-xs text-slate-400/80 font-medium">Örnek tavsiye limitler: Yemek (500₺), Taksi (300₺)</p>
                    </div>

                    <div className="space-y-2.5">
                        <Label htmlFor="description" className="text-slate-700 font-semibold text-sm">Açıklama (İsteğe Bağlı)</Label>
                        <Input
                            id="description"
                            name="description"
                            type="text"
                            placeholder="Harcama hakkında ek detaylar..."
                            defaultValue={parsedData?.description}
                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500 shadow-sm"
                        />
                    </div>

                    <input type="hidden" name="receiptUrl" value={parsedData?.receiptUrl || ''} />
                    <input type="hidden" name="warnings" value={parsedData?.warnings ? parsedData.warnings.join('; ') : ''} />
                    <input type="hidden" name="confidence" value={parsedData?.confidence || ''} />

                    <div className="pt-4 mt-8 border-t border-slate-100">
                        <Button
                            type={isOffline ? "button" : "submit"}
                            onClick={isOffline ? handleOfflineSubmit : undefined}
                            className={`w-full h-12 rounded-xl text-base font-semibold shadow-lg transition-all ${isOffline
                                ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-900/20'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5'
                                }`}
                            disabled={isParsing || isPending}
                        >
                            {isPending || isParsing ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Kaydediliyor...</span>
                                </div>
                            ) : isOffline ? 'Taslağa Kaydet (Çevrimdışı)' : 'Harcamayı Kaydet'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
