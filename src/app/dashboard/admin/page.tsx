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
        <details className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 transition-all hover:shadow-md" open={isOpen}>
            <summary className="p-5 md:p-6 font-bold text-lg text-slate-800 cursor-pointer list-none flex justify-between items-center transition-colors hover:bg-slate-50 select-none">
                <span className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    {title}
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <ChevronDown className="w-5 h-5 text-slate-500 transition-transform duration-300 group-open:rotate-180 group-hover:text-indigo-600" />
                </div>
            </summary>
            <div className="px-5 md:px-6 pb-6 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                <div className="pt-5">
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
        <main className="max-w-6xl mx-auto pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Yönetim Paneli</h1>
                <p className="text-slate-500 mt-2">Sistem yapılandırması, organizasyonlar ve kullanıcı hesaplarını yönetin.</p>
            </div>

            {/* Organizations */}
            <AdminSection title="Organizasyonlar (Şirketler)">
                <form action={createOrganization} className="flex flex-col sm:flex-row gap-4 mb-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="flex-1">
                        <Input name="name" placeholder="Yeni Organizasyon / Şirket Adı" required className="h-11 bg-white border-slate-200 shadow-sm focus-visible:ring-indigo-500" />
                    </div>
                    <Button type="submit" className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">Yeni Organizasyon Ekle</Button>
                </form>
                <div className="space-y-3">
                    {orgs.map(org => (
                        <div key={org.id} className="p-1 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/30 transition-all">
                            <EditableItem
                                id={org.id}
                                initialName={org.name}
                                onUpdate={updateOrganization}
                                onDelete={deleteOrganization}
                            />
                        </div>
                    ))}
                    {orgs.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Henüz organizasyon bulunmamaktadır.</p>}
                </div>
            </AdminSection>

            {/* Projects */}
            <AdminSection title="Projeler">
                <form action={createProject} className="mb-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4">Yeni Proje Oluştur</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                        <div className="space-y-1.5 md:col-span-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bağlı Olduğu Organizasyon</label>
                            <select name="organizationId" defaultValue="" className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" required>
                                <option value="" disabled>Seçiniz...</option>
                                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5 md:col-span-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proje Adı</label>
                            <Input name="name" placeholder="Örn: Merter Şantiye" required className="h-11 bg-white border-slate-200 shadow-sm" />
                        </div>
                        <div className="space-y-1.5 md:col-span-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Bütçe (₺)</label>
                            <Input name="budget" type="number" step="0.01" placeholder="İsteğe Bağlı" className="h-11 bg-white border-slate-200 shadow-sm" />
                        </div>
                        <div className="md:col-span-1 md:mt-6">
                            <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">Projeyi Ekle</Button>
                        </div>
                    </div>
                </form>
                <div className="space-y-3">
                    {projects.map(p => (
                        <div key={p.id} className="p-1 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/30 transition-all">
                            <EditableItem
                                id={p.id}
                                initialName={p.name}
                                subText={`📌 ${p.organization.name}`}
                                onUpdate={updateProject}
                                onDelete={deleteProject}
                            />
                        </div>
                    ))}
                    {projects.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Henüz proje bulunmamaktadır.</p>}
                </div>
            </AdminSection>

            {/* Periods */}
            <AdminSection title="Dönemler & Bütçeler">
                <form action={createPeriod} className="mb-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4">Yeni Dönem Oluştur</h4>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
                        <div className="space-y-1.5 md:col-span-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bağlı Olduğu Proje</label>
                            <select name="projectId" defaultValue="" className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" required>
                                <option value="" disabled>Seçiniz...</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dönem Adı</label>
                            <Input name="name" placeholder="Örn: 2024 Mart Ayı İşletme Giderleri" required className="h-11 bg-white border-slate-200 shadow-sm" />
                        </div>
                        <div className="space-y-1.5 md:col-span-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Başlangıç</label>
                            <Input name="startDate" type="date" required className="h-11 bg-white border-slate-200 shadow-sm" />
                        </div>
                        <div className="space-y-1.5 md:col-span-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bitiş</label>
                            <Input name="endDate" type="date" required className="h-11 bg-white border-slate-200 shadow-sm" />
                        </div>
                        <div className="space-y-1.5 md:col-span-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bütçe (₺)</label>
                            <Input name="budget" type="number" step="0.01" placeholder="İsteğe Bağlı" className="h-11 bg-white border-slate-200 shadow-sm" />
                        </div>
                        <div className="md:col-span-6 flex justify-end mt-2">
                            <Button type="submit" className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">Dönemi Ekle</Button>
                        </div>
                    </div>
                </form>
                <div className="space-y-3">
                    {periods.map((p: any) => (
                        <div key={p.id} className="p-1 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/30 transition-all">
                            <EditableItem
                                id={p.id}
                                initialName={p.name}
                                subText={`📅 ${p.project.name} | ${new Date(p.startDate).toLocaleDateString('tr-TR')} - ${new Date(p.endDate).toLocaleDateString('tr-TR')} ${p.budget ? `| 💰 ₺${Number(p.budget).toFixed(2)}` : ''}`}
                                onUpdate={updatePeriod}
                                onDelete={deletePeriod}
                            />
                        </div>
                    ))}
                    {periods.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Henüz dönem bulunmamaktadır.</p>}
                </div>
            </AdminSection>

            {/* User Management */}
            <AdminSection title="Kullanıcı Yönetimi" isOpen={true}>
                <div className="mb-8">
                    <UserCreationForm organizations={orgs} />
                </div>

                <div className="space-y-4 mt-8 border-t border-slate-100 pt-8">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Mevcut Kullanıcılar</h3>
                        <p className="text-sm text-slate-500 mb-6">Sisteme kayıtlı tüm kullanıcıların yetki ve organizasyon atamaları.</p>
                    </div>

                    <div className="space-y-3">
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
                </div>
            </AdminSection>

        </main>
    );
}

