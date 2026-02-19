import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { revalidatePath } from "next/cache"

import { PeriodFormList } from "@/components/profile/period-form-list"

async function updateProfile(formData: FormData) {
    'use server'
    const session = await auth();
    if (!session?.user?.id) return;

    const iban = formData.get('iban') as string;
    const bankName = formData.get('bankName') as string;
    const bankBranch = formData.get('bankBranch') as string;
    const accountHolder = formData.get('accountHolder') as string;
    const currency = formData.get('currency') as string;
    const phone = formData.get('phone') as string;

    await prisma.user.update({
        where: { id: session.user.id },
        data: { iban, bankName, bankBranch, accountHolder, currency, phone }
    });
    revalidatePath('/dashboard/profile');
}

export default async function ProfilePage() {
    const session = await auth();

    // Fetch user details
    const user = await prisma.user.findUnique({
        where: { id: session?.user?.id },
        include: { organization: true }
    });

    // Fetch forms for the period-based view
    const rawForms = await prisma.expenseForm.findMany({
        where: { userId: session?.user?.id },
        include: {
            expenses: {
                include: { period: true }
            }
        },
        orderBy: { submittedAt: 'desc' },
        take: 20
    });

    const forms = rawForms.map(f => ({
        ...f,
        totalAmount: f.totalAmount.toString(),
        submittedAt: f.submittedAt.toISOString(),
        processedAt: f.processedAt?.toISOString(),
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
        expenses: f.expenses.map(e => ({
            ...e,
            amount: e.amount.toString(),
            date: e.date.toISOString(),
            // period is object
        }))
    }));

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Profilim</h1>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Personal Information & Settings */}
                <div className="bg-white p-6 rounded-xl shadow border h-fit">
                    <h2 className="text-xl font-semibold mb-6">Kişisel Bilgiler & Ayarlar</h2>
                    <div className="mb-6 space-y-2 text-sm">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">İsim:</span>
                            <span className="font-medium">{user?.name}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{user?.email}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Rol:</span>
                            <Badge variant="outline">{user?.role}</Badge>
                        </div>
                        {user?.organizationId && (
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Organizasyon:</span>
                                <span className="font-medium">{(user as any).organization?.name || 'Bağlı Değil'}</span>
                            </div>
                        )}
                    </div>

                    <form action={updateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Banka Bilgileri</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bankName" className="text-xs">Banka Adı</Label>
                                    <Input name="bankName" id="bankName" defaultValue={user?.bankName || ''} placeholder="Örn: Garanti BBVA" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankBranch" className="text-xs">Şube Adı/Kodu</Label>
                                    <Input name="bankBranch" id="bankBranch" defaultValue={user?.bankBranch || ''} placeholder="Örn: Kadıköy Şb." />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="accountHolder" className="text-xs">Hesap Sahibi</Label>
                                <Input name="accountHolder" id="accountHolder" defaultValue={user?.accountHolder || user?.name || ''} placeholder="Ad Soyad" />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="iban" className="text-xs">IBAN</Label>
                                    <Input name="iban" id="iban" defaultValue={user?.iban || ''} placeholder="TR..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency" className="text-xs">Para Birimi</Label>
                                    <select
                                        name="currency"
                                        id="currency"
                                        defaultValue={user?.currency || 'TRY'}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="TRY">TRY (₺)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                    </select>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground">Ödemeleriniz bu hesaba yapılacaktır.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon Numaranız</Label>
                            <Input name="phone" id="phone" defaultValue={user?.phone || ''} placeholder="+90..." />
                        </div>
                        <Button type="submit" className="w-full">Bilgileri Güncelle</Button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border">
                    <h2 className="text-xl font-semibold mb-6">Son Masraf Formlarım (Dönemsel)</h2>
                    {!forms.length ? (
                        <p className="text-center text-muted-foreground py-10">Henüz gönderilmiş bir formunuz yok.</p>
                    ) : (
                        <PeriodFormList forms={forms} />
                    )}
                </div>
            </div>
        </div>
    )
}
