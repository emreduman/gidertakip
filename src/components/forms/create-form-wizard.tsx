'use client';

import { useState } from 'react';
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

    const router = useRouter();

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
                <div className="bg-white p-4 rounded shadow mb-6 border-l-4 border-yellow-400">
                    <Label className="mb-2 block font-semibold text-yellow-800">Admin İşlemi: Kullanıcı Değiştir</Label>
                    <select
                        className="w-full border p-2 rounded bg-white"
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
                <Card>
                    <CardHeader>
                        <CardTitle>Kişisel Bilgiler</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="grid grid-cols-3">
                            <span className="text-muted-foreground">Ad Soyad:</span>
                            <span className="col-span-2 font-medium">{user.name}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-muted-foreground">E-posta:</span>
                            <span className="col-span-2 font-medium">{user.email}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-muted-foreground">Telefon:</span>
                            <span className="col-span-2 font-medium">{user.phone || 'Girilmemiş'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Banka Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="grid grid-cols-3">
                            <span className="text-muted-foreground">Banka:</span>
                            <span className="col-span-2 font-medium">{user.bankName || 'Girilmemiş'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-muted-foreground">IBAN:</span>
                            <span className="col-span-2 font-mono">{user.iban || 'Girilmemiş'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-muted-foreground">Hesap Sahibi:</span>
                            <span className="col-span-2 font-medium">{user.accountHolder || user.name}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-muted-foreground">Para Birimi:</span>
                            <span className="col-span-2 font-medium">{user.currency || 'TRY'}</span>
                        </div>
                        {!user.iban && (
                            <div className="mt-2 text-amber-600 flex items-center gap-1 text-xs">
                                <AlertCircle className="w-4 h-4" />
                                <span>Lütfen profil sayfasından banka bilgilerinizi tamamlayın.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 2. Detail Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Form Detayları</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 relative z-[60]">
                        <Label>Organizasyon</Label>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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

                    <div className="space-y-2 relative z-50">
                        <Label>Proje ({projects.length})</Label>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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

                    <div className="space-y-2">
                        <Label>Dönem ({periods.length})</Label>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 bg-white"
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

                    <div className="space-y-2">
                        <Label>Bildirim Tarihi</Label>
                        <Input
                            value={notificationDate}
                            onChange={(e) => setNotificationDate(e.target.value)}
                            type="date"
                            className="bg-white"
                        />
                        <input type="hidden" name="submissionDate" value={notificationDate} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="location">Lokasyon</Label>
                        <Input
                            id="location"
                            placeholder="Örn: İstanbul Ofis, Saha Görevi vb."
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 3. Expense Summary Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Harcama Özeti</CardTitle>
                    <CardDescription>Forma dahil edilecek harcamaları seçiniz.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4 border rounded-md p-2">
                        {pendingExpenses.map((expense) => (
                            <div key={expense.id} className="flex items-center space-x-3 border-b pb-2 last:border-0 last:pb-0 hover:bg-gray-50 p-2 rounded cursor-pointer" onClick={() => toggleExpense(expense.id)}>
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={selectedExpenseIds.includes(expense.id)}
                                    readOnly
                                />
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm select-none">
                                    <span className="text-muted-foreground">{new Date(expense.date).toLocaleDateString('tr-TR')}</span>
                                    <span className="font-medium">{expense.merchant}</span>
                                    <span>{expense.category}</span>
                                    <span className="font-bold text-right">₺{Number(expense.amount).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                        {pendingExpenses.length === 0 && (
                            <div className="text-center text-gray-400 py-4">Bu kullanıcı için bekleyen harcama yok.</div>
                        )}
                    </div>
                    <div className="flex justify-end items-center gap-2 text-lg font-bold border-t pt-4">
                        <span>Toplam Tutar:</span>
                        <span className="text-primary">{totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                </CardContent>
            </Card>

            {/* 4. Approvals */}
            <Card className="border-blue-200 bg-blue-50/20">
                <CardHeader>
                    <CardTitle>Onaylar</CardTitle>
                    <CardDescription>Ödeme talebi oluşturmadan önce lütfen aşağıdaki adımları onaylayın.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Receipts Logic */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Fiş ve Faturalar</Label>
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="r-yes"
                                    name="receipts"
                                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={receiptsDelivered === "yes"}
                                    onChange={() => setReceiptsDelivered("yes")}
                                />
                                <Label htmlFor="r-yes">Fiş ve faturaların asıllarını teslim ettim.</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="r-no"
                                    name="receipts"
                                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={receiptsDelivered === "no"}
                                    onChange={() => setReceiptsDelivered("no")}
                                />
                                <Label htmlFor="r-no">Fiş ve faturaların asıllarını henüz teslim etmedim.</Label>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-blue-100" />

                    {/* Verification Logic */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Bilgi Doğruluğu</Label>
                        <div className="flex items-start space-x-2 p-3 bg-white rounded border border-blue-100">
                            <input
                                type="checkbox"
                                id="verify"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                                checked={infoVerified}
                                onChange={(e) => setInfoVerified(e.target.checked)}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label
                                    htmlFor="verify"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Yukarıdaki banka ve iletişim bilgilerimin doğruluğunu onaylıyorum.
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Hatalı bildirimlerden doğacak sorumluluğu kabul ediyorum.
                                </p>
                            </div>
                        </div>
                    </div>

                </CardContent>
            </Card>

            <div className="sticky bottom-4 z-10 mx-auto max-w-2xl shadow-2xl rounded-lg">
                <Button
                    size="lg"
                    className="w-full text-lg h-14 bg-green-600 hover:bg-green-700 shadow-xl transition-all active:scale-[0.98]"
                    disabled={loading || selectedExpenseIds.length === 0 || !infoVerified}
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>İşleniyor...</span>
                        </div>
                    ) : (
                        <span>Ödeme İste</span>
                    )}
                </Button>
            </div>
        </form>
    );
}
