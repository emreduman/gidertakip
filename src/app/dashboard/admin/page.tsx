import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ROLE_LABELS } from "@/lib/utils"
import { Role } from "@prisma/client"
import { redirect } from "next/navigation"
import {
    createOrganization, createProject, createPeriod, createUser,
    deleteOrganization, deleteProject, deletePeriod, deleteUser,
    updateOrganization, updateProject, updatePeriod, updateUser
} from "@/lib/admin-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditableItem } from "@/components/admin/editable-item"
import { UserListItem } from "@/components/admin/user-list-item"

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
        <main className="space-y-8">
            <h1 className="text-2xl font-bold">Yönetim Paneli</h1>

            {/* Organizations */}
            <section className="bg-white p-6 rounded shadow border">
                <h2 className="text-xl font-semibold mb-4">Organizasyonlar</h2>
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
            </section>

            {/* Projects */}
            <section className="bg-white p-6 rounded shadow border">
                <h2 className="text-xl font-semibold mb-4">Projeler</h2>
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
            </section>

            {/* Periods */}
            <section className="bg-white p-6 rounded shadow border">
                <h2 className="text-xl font-semibold mb-4">Dönemler</h2>
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
            </section>

            {/* User Management */}
            <section className="bg-white p-6 rounded shadow border">
                <h2 className="text-xl font-semibold mb-4">Kullanıcı Yönetimi</h2>
                <form action={createUser} className="space-y-4 mb-4 border p-4 rounded bg-slate-50">
                    <h3 className="text-sm font-medium">Yeni Kullanıcı Ekle</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Input name="name" placeholder="Ad Soyad" required />
                        <Input name="email" type="email" placeholder="E-posta" required />
                        <Input name="password" type="password" placeholder="Şifre" required />
                        <select name="role" className="border rounded p-2 text-sm" required>
                            <option value="">Rol Seç</option>
                            {Object.keys(ROLE_LABELS).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                        <select name="organizationId" className="border rounded p-2 text-sm">
                            <option value="">Organizasyon (Opsiyonel)</option>
                            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                        <Button type="submit">Kullanıcı Oluştur</Button>
                    </div>
                </form>

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
            </section>

        </main>
    );
}
