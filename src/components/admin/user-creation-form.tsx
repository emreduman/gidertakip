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
            // Optional: router.refresh() if revalidatePath isn't enough for client-side navigation cache
        } else {
            toast.error(result?.message || 'Bir hata oluştu.');
        }
    }

    return (
        <form
            ref={formRef}
            action={handleSubmit}
            className="space-y-4 mb-4 border p-4 rounded bg-slate-50"
        >
            <h3 className="text-sm font-medium">Yeni Kullanıcı Ekle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input name="name" placeholder="Ad Soyad" required />
                <Input name="email" type="email" placeholder="E-posta" required />
                <Input name="password" type="password" placeholder="Şifre" required />
                <select name="role" className="border rounded p-2 text-sm" required>
                    <option value="">Rol Seç</option>
                    {Object.keys(ROLE_LABELS).map(r => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                </select>
                <select name="organizationId" className="border rounded p-2 text-sm">
                    <option value="">Organizasyon (Opsiyonel)</option>
                    {organizations.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                </select>
                <Button type="submit">Kullanıcı Oluştur</Button>
            </div>
        </form>
    )
}
