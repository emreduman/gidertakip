'use client'

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { createUser } from "@/lib/admin-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ROLE_LABELS } from "@/lib/utils"
// We import directly from sonner, assuming it's set up in the layout with <Toaster />
import { toast } from "sonner"

interface Organization {
    id: string
    name: string
}

interface UserCreationFormProps {
    organizations: Organization[]
}

export function UserCreationForm({ organizations }: UserCreationFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        const result = await createUser(formData);

        if (result?.success) {
            toast.success(result.message);
            formRef.current?.reset();
            router.refresh();
        } else {
            toast.error(result?.message || 'Bir hata oluştu.');
        }
    }

    return (
        <form
            ref={formRef}
            action={handleSubmit}
            className="mb-4 bg-slate-50/50 p-5 rounded-xl border border-slate-100"
        >
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Yeni Kullanıcı Ekle</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div className="space-y-1.5 lg:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ad Soyad</label>
                    <Input name="name" placeholder="Örn: Ahmet Yılmaz" required className="h-10 bg-white border-slate-200 shadow-sm" />
                </div>
                <div className="space-y-1.5 lg:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">E-posta</label>
                    <Input name="email" type="email" placeholder="ornek@sirket.com" required className="h-10 bg-white border-slate-200 shadow-sm" />
                </div>
                <div className="space-y-1.5 lg:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Geçici Şifre</label>
                    <Input name="password" type="password" placeholder="******" required className="h-10 bg-white border-slate-200 shadow-sm" />
                </div>
                <div className="space-y-1.5 lg:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Yetki Rolü</label>
                    <select name="role" defaultValue="" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" required>
                        <option value="" disabled>Seçiniz</option>
                        {Object.keys(ROLE_LABELS).map(r => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5 lg:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Organizasyon</label>
                    <select name="organizationId" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500">
                        <option value="">Yok (Bağımsız)</option>
                        {organizations.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-2 lg:col-span-5 mt-2 flex justify-end">
                    <Button type="submit" className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">Kullanıcı Oluştur</Button>
                </div>
            </div>
        </form>
    )
}
