'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// import { createExpenseForm, testPing } from "@/lib/form-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
// Removed unused Shadcn imports to prevent conflict loops

export function CreateFormWizard({
    user,
    organizations = [],
    pendingExpenses,
    allUsers,
    selectedUserId
}: {
    user: any,
    organizations?: any[],
    pendingExpenses: any[],
    allUsers?: any[],
    selectedUserId?: string
}) {
    const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>(pendingExpenses.map(e => e.id));
    const [receiptsDelivered, setReceiptsDelivered] = useState("no");
    const [infoVerified, setInfoVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Re-sync selections if the underlying list changes (e.g. changing user)
    useEffect(() => {
        setSelectedExpenseIds(pendingExpenses.map(e => e.id));
    }, [pendingExpenses]);

    // State for Org, Project, Period
    const [selectedOrgId, setSelectedOrgId] = useState<string>(user?.organization?.id || "");
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
    const [notificationDate, setNotificationDate] = useState(new Date().toISOString().split('T')[0]);
    const [location, setLocation] = useState(""); // Location State

    // Safe Access to organization data
    const selectedOrg = organizations?.find((o: any) => o.id === selectedOrgId);
    const projects = selectedOrg?.projects || [];

    // Derived periods based on selection
    const selectedProject = projects.find((p: any) => p.id === selectedProjectId);
    const periods = selectedProject?.periods || [];

    const toggleExpense = (id: string) => {
        setSelectedExpenseIds(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const totalAmount = pendingExpenses
        .filter(e => selectedExpenseIds.includes(e.id))
        .reduce((sum, e) => sum + Number(e.amount), 0);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        console.log("Submitting form via API Route...");

        try {
            if (!infoVerified) {
                toast.error("Lütfen bilgilerin doğruluğunu onaylayın.");
                setLoading(false);
                return;
            }

            // Construct Payload from React State (Reliable) instead of FormData (Buggy)
            const data = {
                expenseIds: selectedExpenseIds,
                infoVerified: infoVerified,
                receiptsDelivered: receiptsDelivered === 'yes',
                location: location,
                organizationId: selectedOrgId,
                projectId: selectedProjectId,
                periodId: selectedPeriodId,
                submissionDate: notificationDate,
                targetUserId: selectedUserId
            };

            console.log("Sending JSON Payload:", data);

            const response = await fetch('/api/submit-form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                keepalive: true
            });

            console.log("API Status:", response.status, response.statusText);
            const textHTML = await response.text();
            console.log("API Response Text:", textHTML);

            let result;
            try {
                result = JSON.parse(textHTML);
            } catch (err) {
                console.error("JSON Parse Error:", err);
                result = { message: "Invalid JSON response", raw: textHTML };
            }

            console.log("API Response Object:", result);

            if (response.ok && result.success && result.formId) {
                toast.success("Masraf formu oluşturuldu!");

                // Manual Revalidation Pattern
                // This ensures data is fresh without risking Server Action/Route crashes
                try {
                    await fetch(`/api/revalidate?path=/dashboard/forms`);
                    await fetch(`/api/revalidate?path=/dashboard/expenses`);
                    await fetch(`/api/revalidate?path=/dashboard/accounting`);
                } catch (ignore) { console.error("Revalidation signal failed", ignore); }

                router.push(`/dashboard/forms/success?id=${result.formId}`);
            } else {
                console.error("API returned failure:", result);
                toast.error(`Hata (${response.status}): ${result?.message || "Sunucudan boş yanıt alındı."}`);
                setLoading(false);
            }
        } catch (e) {
            console.error("Exception in handleSubmit:", e);
            toast.error("Beklenmedik bir hata oluştu.");
            setLoading(false);
        }
    };

    return (
        <form action={handleSubmit} className="space-y-8 pb-20">
            {/* Admin User Selection */}
            {allUsers && allUsers.length > 0 && (
                <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-200/50 mb-6 transition-all">
                    <Label className="mb-2 block font-semibold text-amber-800">Admin İşlemi: Kullanıcı Değiştir</Label>
                    <select
                        className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedUserId || ''}
                        onChange={(e) => {
                            window.location.href = `/dashboard/forms/create?userId=${e.target.value}`;
                        }}
                    >
                        <option value="">Kullanıcı Seçiniz</option>
                        {allUsers.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.name || u.email}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Hidden Inputs for Form Action */}
            {selectedExpenseIds.map(id => <input key={id} type="hidden" name="expenseIds" value={id} />)}
            <input type="hidden" name="receiptsDelivered" value={receiptsDelivered === 'yes' ? 'on' : 'off'} />
            <input type="hidden" name="infoVerified" value={infoVerified ? 'on' : 'off'} />
            <input type="hidden" name="projectId" value={selectedProjectId} />
            <input type="hidden" name="periodId" value={selectedPeriodId} />

            {/* 1. Personal & Bank Info Review */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-all">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-slate-800 tracking-tight">Kişisel Bilgiler</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-5 text-sm">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="text-slate-500 font-medium">Ad Soyad</span>
                            <span className="font-semibold text-slate-800 text-right">{user.name}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="text-slate-500 font-medium">E-posta</span>
                            <span className="font-medium text-slate-800 text-right">{user.email}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Telefon</span>
                            <span className="font-medium text-slate-800 text-right">{user.phone || '-'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-all relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg font-semibold text-slate-800 tracking-tight">Banka Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-5 text-sm relative z-10">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="text-slate-500 font-medium">Banka</span>
                            <span className="font-semibold text-slate-800 text-right">{user.bankName || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="text-slate-500 font-medium">IBAN</span>
                            <span className="font-mono text-xs md:text-sm text-slate-800 text-right bg-slate-100 px-2 py-1 rounded">{user.iban || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="text-slate-500 font-medium">Hesap Sahibi</span>
                            <span className="font-medium text-slate-800 text-right">{user.accountHolder || user.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Para Birimi</span>
                            <span className="font-medium text-slate-800 text-right bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-xs">{user.currency || 'TRY'}</span>
                        </div>
                        {!user.iban && (
                            <div className="mt-3 p-3 bg-amber-50 text-amber-800 flex items-start gap-2 text-xs rounded-xl border border-amber-200/50">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span className="font-medium">Lütfen profil sayfasından banka bilgilerinizi tamamlayın. Eksik bilgi ile yapılan talepler gecikebilir.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 2. Detail Section */}
            <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-800 tracking-tight">Form Detayları</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:gap-6 md:grid-cols-2 p-5 md:p-6">
                    <div className="space-y-2.5 relative z-[60]">
                        <Label className="text-slate-700 font-semibold text-sm">Organizasyon</Label>
                        <select
                            className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 focus:bg-white"
                            value={selectedOrgId}
                            onChange={(e) => {
                                setSelectedOrgId(e.target.value);
                                setSelectedProjectId("");
                                setSelectedPeriodId("");
                            }}
                        >
                            <option value="" disabled>Organizasyon Seçiniz</option>
                            {organizations.map((org: any) => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                        <input type="hidden" name="organizationId" value={selectedOrgId} />
                    </div>

                    <div className="space-y-2.5 relative z-50">
                        <Label className="text-slate-700 font-semibold text-sm">Proje ({projects.length})</Label>
                        <select
                            className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 focus:bg-white"
                            value={selectedProjectId}
                            onChange={(e) => {
                                console.log("Selected Project:", e.target.value);
                                setSelectedProjectId(e.target.value);
                                setSelectedPeriodId("");
                            }}
                        >
                            <option value="" disabled>Proje Seçiniz</option>
                            {projects.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        {/* Hidden Input for Project */}
                        <input type="hidden" name="projectId" value={selectedProjectId} />
                    </div>

                    <div className="space-y-2.5">
                        <Label className="text-slate-700 font-semibold text-sm">Dönem ({periods.length})</Label>
                        <select
                            className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 focus:bg-white"
                            value={selectedPeriodId}
                            onChange={(e) => setSelectedPeriodId(e.target.value)}
                            disabled={!selectedProjectId}
                        >
                            <option value="" disabled>Dönem Seçiniz</option>
                            {periods.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        {/* Hidden Input for Period */}
                        <input type="hidden" name="periodId" value={selectedPeriodId} />
                    </div>

                    <div className="space-y-2.5">
                        <Label className="text-slate-700 font-semibold text-sm">Bildirim Tarihi</Label>
                        <Input
                            value={notificationDate}
                            onChange={(e) => setNotificationDate(e.target.value)}
                            type="date"
                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus-visible:ring-indigo-500 shadow-sm"
                        />
                        <input type="hidden" name="submissionDate" value={notificationDate} />
                    </div>
                    <div className="space-y-2.5 md:col-span-2">
                        <Label htmlFor="location" className="text-slate-700 font-semibold text-sm">Lokasyon (Proje Sahası / Ofis vb.)</Label>
                        <Input
                            id="location"
                            placeholder="Örn: İstanbul Ana Ofis, Ankara Saha Görevi vb."
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus-visible:ring-indigo-500 shadow-sm"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 3. Expense Summary Selection */}
            <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-800 tracking-tight">Harcama Özeti</CardTitle>
                    <CardDescription className="text-slate-500 mt-1">Forma dahil edilecek harcamaları seçiniz.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[400px] overflow-y-auto w-full">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100 text-[11px] uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 w-12 text-center"></th>
                                    <th className="px-4 py-3">Tarih</th>
                                    <th className="px-4 py-3">Belge</th>
                                    <th className="px-4 py-3">İşyeri</th>
                                    <th className="px-4 py-3">Kategori</th>
                                    <th className="px-4 py-3 text-right">Tutar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingExpenses.map((expense) => (
                                    <tr
                                        key={expense.id}
                                        onClick={() => toggleExpense(expense.id)}
                                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${selectedExpenseIds.includes(expense.id) ? 'bg-indigo-50/30' : ''}`}
                                    >
                                        <td className="px-4 py-3 text-center align-middle">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                                                checked={selectedExpenseIds.includes(expense.id)}
                                                readOnly
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{new Date(expense.date).toLocaleDateString('tr-TR')}</td>
                                        <td className="px-4 py-3">
                                            {expense.receiptUrl ? (
                                                <a
                                                    href={expense.receiptUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium text-xs"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Fişi Görüntüle"
                                                >
                                                    Belge
                                                </a>
                                            ) : (
                                                <span className="text-slate-300 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-700">{expense.merchant || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-block bg-slate-100 text-slate-600 rounded-md px-2 py-0.5 text-xs font-medium">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                                            ₺{Number(expense.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {pendingExpenses.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center text-slate-400 py-8 italic bg-slate-50/50">
                                            Bu kullanıcı için bekleyen harcama yok.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between items-center p-5 md:p-6 bg-slate-50/50 border-t border-slate-100">
                        <span className="text-base font-semibold text-slate-600">Seçilen Toplam:</span>
                        <span className="text-2xl font-bold tracking-tight text-indigo-700">
                            {totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* 4. Approvals */}
            <Card className="border-indigo-100 shadow-md rounded-2xl overflow-hidden group hover:shadow-lg transition-all relative mt-8">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-white to-teal-500/5 pointer-events-none"></div>
                <CardHeader className="bg-indigo-50/80 border-b border-indigo-100/50 pb-5 relative z-10">
                    <CardTitle className="text-xl font-bold text-indigo-900 tracking-tight">Onaylar & Taahhütler</CardTitle>
                    <CardDescription className="text-indigo-700/70 mt-1">Ödeme talebi oluşturmadan önce lütfen aşağıdaki adımları dikkatlice okuyup onaylayın.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 relative z-10">

                    {/* Receipts Logic */}
                    <div className="space-y-3">
                        <Label className="text-base font-bold text-slate-800">Fiziksel Belge Durumu</Label>
                        <div className="flex flex-col space-y-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <label className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${receiptsDelivered === "yes" ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}>
                                <input
                                    type="radio"
                                    name="receipts"
                                    className="mt-1 h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                    checked={receiptsDelivered === "yes"}
                                    onChange={() => setReceiptsDelivered("yes")}
                                />
                                <div className="flex flex-col cursor-pointer">
                                    <span className="text-sm font-semibold text-slate-700">Fiş ve faturaların asıllarını teslim ettim.</span>
                                    <span className="text-xs text-slate-500 mt-0.5">Muhasebe departmanına fiziksel belgeler ulaşmıştır.</span>
                                </div>
                            </label>

                            <label className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${receiptsDelivered === "no" ? 'bg-amber-50/50 border-amber-200 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}>
                                <input
                                    type="radio"
                                    name="receipts"
                                    className="mt-1 h-4 w-4 border-slate-300 text-amber-600 focus:ring-amber-500 transition-all cursor-pointer"
                                    checked={receiptsDelivered === "no"}
                                    onChange={() => setReceiptsDelivered("no")}
                                />
                                <div className="flex flex-col cursor-pointer">
                                    <span className="text-sm font-semibold text-slate-700">Fiş ve faturaların asıllarını henüz teslim etmedim.</span>
                                    <span className="text-xs text-amber-600/80 mt-0.5 font-medium">Ödemenin yapılması için asılların teslimi gerekebilir.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <Separator className="bg-slate-200/60" />

                    {/* Verification Logic */}
                    <div className="space-y-3">
                        <Label className="text-base font-bold text-slate-800">Bilgi Doğruluğu & Yasal Onay</Label>
                        <label className={`flex items-start space-x-3 p-4 bg-white rounded-xl border transition-all shadow-sm cursor-pointer ${infoVerified ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 border-l-4 border-l-indigo-400 hover:shadow-md'}`}>
                            <input
                                type="checkbox"
                                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer transition-all"
                                checked={infoVerified}
                                onChange={(e) => setInfoVerified(e.target.checked)}
                            />
                            <div className="flex flex-col leading-snug cursor-pointer">
                                <span className={`text-sm font-bold transition-colors ${infoVerified ? 'text-emerald-800' : 'text-slate-700'}`}>
                                    Yukarıdaki beyan edilen bilgilerin, banka hesaplarımın ve eklenen harcamaların doğruluğunu vicdanen ve hukuken onaylıyorum.
                                </span>
                                <span className="text-xs text-slate-500 mt-1.5 font-medium">
                                    Hatalı bildirimlerden doğacak kurumsal sorumluluğu peşinen kabul ediyorum. Şirket politikalarına aykırı harcamaların maaşımdan kesilebileceğini biliyorum.
                                </span>
                            </div>
                        </label>
                    </div>

                </CardContent>
            </Card>

            <div className="sticky bottom-6 z-40 mx-auto max-w-2xl mt-10">
                <Button
                    size="lg"
                    className={`w-full text-lg h-16 font-bold shadow-2xl transition-all duration-300 rounded-2xl ${infoVerified && selectedExpenseIds.length > 0 && !loading
                        ? 'bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        }`}
                    disabled={loading || selectedExpenseIds.length === 0 || !infoVerified}
                >
                    {loading ? (
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                            <span>Sisteme İşleniyor...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span>Resmi Ödeme Formunu Oluştur ve Gönder</span>
                        </div>
                    )}
                </Button>
                {(!infoVerified || selectedExpenseIds.length === 0) && (
                    <p className="text-center text-xs font-semibold text-slate-500 mt-3 mix-blend-multiply opacity-80 backdrop-blur-sm bg-white/50 py-1 px-4 rounded-full w-max mx-auto border border-black/5">
                        Devam etmek için en az bir harcama seçmeli ve onay kutusunu işaretlemelisiniz.
                    </p>
                )}
            </div>
        </form>
    );
}
