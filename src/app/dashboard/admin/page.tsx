import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ROLE_LABELS } from "@/lib/utils"
import { Role } from "@prisma/client"
import { redirect } from "next/navigation"
import {
    createOrganization, createProject, createPeriod,
    deleteOrganization, deleteProject, deletePeriod, deleteUser,
    updateOrganization, updateProject, updatePeriod, updateUser
} from "@/lib/admin-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditableItem } from "@/components/admin/editable-item"
import { UserListItem } from "@/components/admin/user-list-item"
import { UserCreationForm } from "@/components/admin/user-creation-form"
import { ChevronDown } from "lucide-react"

function AdminSection({ title, children, isOpen = false }: { title: string, children: React.ReactNode, isOpen?: boolean }) {
    return (
        <details className="group bg-white rounded-lg shadow-sm border overflow-hidden" open={isOpen}>
            <summary className="p-6 font-semibold text-xl cursor-pointer list-none flex justify-between items-center transition-colors hover:bg-gray-50 select-none">
                {title}
                <ChevronDown className="w-5 h-5 text-gray-500 transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <div className="px-6 pb-6 border-t animate-in slide-in-from-top-1 duration-200">
                <div className="pt-4">
                    {children}
                </div>
            </div>
        </details>
    );
}

export default async function AdminPage() {
    const session = await auth();
    if (session?.user?.role !== Role.ADMIN) {
        // redirect('/dashboard'); 
    }

    const orgs = await prisma.organization.findMany();
    const projects = await prisma.project.findMany({ include: { organization: true } });
    const periods = await prisma.period.findMany({ include: { project: true } });
    const users = await prisma.user.findMany({ include: { organization: true }, orderBy: { createdAt: 'desc' } });

    return (
        <main className="space-y-4">
            <h1 className="text-2xl font-bold mb-6">Yönetim Paneli</h1>

            {/* Organizations */}
            <AdminSection title="Organizasyonlar">
                <form action={createOrganization} className="flex gap-4 mb-4">
                    <Input name="name" placeholder="Yeni Organizasyon Adı" required />
                    <Button type="submit">Ekle</Button>
                </form>
                <div className="space-y-2">
                    {orgs.map(org => (
                        <EditableItem
                            key={org.id}
                            id={org.id}
                            initialName={org.name}
                            onUpdate={updateOrganization}
                            onDelete={deleteOrganization}
                        />
                    ))}
                </div>
            </AdminSection>

            {/* Projects */}
            <AdminSection title="Projeler">
                <form action={createProject} className="space-y-4 mb-4">
                    <div className="flex gap-4">
                        <select name="organizationId" className="border rounded p-2 text-sm w-48" required>
                            <option value="">Organizasyon Seç</option>
                            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                        <Input name="name" placeholder="Proje Adı" required />
                        <Button type="submit">Ekle</Button>
                    </div>
                </form>
                <div className="space-y-2">
                    {projects.map(p => (
                        <EditableItem
                            key={p.id}
                            id={p.id}
                            initialName={p.name}
                            subText={`(${p.organization.name})`}
                            onUpdate={updateProject}
                            onDelete={deleteProject}
                        />
                    ))}
                </div>
            </AdminSection>

            {/* Periods */}
            <AdminSection title="Dönemler">
                <form action={createPeriod} className="space-y-4 mb-4">
                    <div className="flex gap-4 flex-wrap">
                        <select name="projectId" className="border rounded p-2 text-sm w-48" required>
                            <option value="">Proje Seç</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <Input name="name" placeholder="Dönem Adı (Örn: Ocak 2024)" required className="w-48" />
                        <Input name="startDate" type="date" required className="w-auto" />
                        <Input name="endDate" type="date" required className="w-auto" />
                        <Button type="submit">Ekle</Button>
                    </div>
                </form>
                <div className="space-y-2">
                    {periods.map(p => (
                        <EditableItem
                            key={p.id}
                            id={p.id}
                            initialName={p.name}
                            subText={`${p.project.name} | ${p.startDate.toLocaleDateString('tr-TR')} - ${p.endDate.toLocaleDateString('tr-TR')}`}
                            onUpdate={updatePeriod}
                            onDelete={deletePeriod}
                        />
                    ))}
                </div>
            </AdminSection>

            {/* User Management */}
            <AdminSection title="Kullanıcı Yönetimi" isOpen={true}>
                <UserCreationForm organizations={orgs} />

                <div className="space-y-2 mt-6">
                    <h3 className="text-sm font-medium mb-2">Mevcut Kullanıcılar</h3>
                    {users.map(u => (
                        <UserListItem
                            key={u.id}
                            user={u}
                            organizations={orgs}
                            currentUserId={session?.user?.id}
                            onUpdate={updateUser}
                            onDelete={deleteUser}
                        />
                    ))}
                </div>
            </AdminSection>

        </main>
    );
}

