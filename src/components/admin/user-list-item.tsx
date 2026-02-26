'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PencilIcon, XIcon, CheckIcon, TrashIcon } from 'lucide-react';
import { Role } from '@prisma/client';
import { ROLE_LABELS } from '@/lib/utils';

interface Organization {
    id: string;
    name: string;
}

interface UserListItemProps {
    user: {
        id: string;
        name: string | null;
        email: string | null;
        role: Role;
        organizationId: string | null;
        organization?: { name: string } | null;
    };
    organizations: Organization[];
    currentUserId?: string;
    onUpdate: (formData: FormData) => Promise<void>;
    onDelete: (formData: FormData) => Promise<void>;
}

export function UserListItem({ user, organizations, currentUserId, onUpdate, onDelete }: UserListItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.name || '');
    const [email, setEmail] = useState(user.email || '');
    const [role, setRole] = useState(user.role);
    const [orgId, setOrgId] = useState(user.organizationId || '');

    const handleUpdate = async () => {
        const formData = new FormData();
        formData.append('id', user.id);
        formData.append('name', name);
        formData.append('email', email);
        formData.append('role', role);
        formData.append('organizationId', orgId);
        await onUpdate(formData);
        setIsEditing(false);
    };

    return (
        <div className="p-4 border border-slate-100 rounded-xl bg-white flex justify-between items-center gap-4 transition-all hover:border-slate-200 hover:shadow-sm">
            {isEditing ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İsim</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="İsim"
                            className="h-9 bg-white border-slate-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-posta</label>
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="h-9 bg-white border-slate-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rol</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as Role)}
                            className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                        >
                            {Object.keys(ROLE_LABELS).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1 flex flex-col justify-end pb-0.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Organizasyon</label>
                        <div className="flex gap-2">
                            <select
                                value={orgId}
                                onChange={(e) => setOrgId(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 flex-1"
                            >
                                <option value="">Yok (Bağımsız)</option>
                                {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                            <Button size="sm" onClick={handleUpdate} className="h-9 w-9 p-0 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                                <CheckIcon className="w-4 h-4" />
                            </Button>
                            <Button size="sm" onClick={() => setIsEditing(false)} variant="outline" className="h-9 w-9 p-0 shrink-0 border-slate-200 text-slate-500 hover:bg-slate-100">
                                <XIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{user.name || 'İsimsiz Kullanıcı'}</span>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs font-medium text-slate-500">{user.email}</span>
                            <span className="text-slate-300 text-xs">•</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide
                                ${user.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' :
                                    user.role === 'ACCOUNTANT' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`
                            }>
                                {ROLE_LABELS[user.role] || user.role}
                            </span>
                            {user.organization && (
                                <>
                                    <span className="text-slate-300 text-xs">•</span>
                                    <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                        {user.organization.name}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" onClick={() => setIsEditing(true)}>
                            <PencilIcon className="w-4 h-4" />
                        </Button>
                        <form action={onDelete}>
                            <input type="hidden" name="id" value={user.id} />
                            <Button
                                variant="ghost"
                                size="sm"
                                type="submit"
                                className="h-9 w-9 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                disabled={user.id === currentUserId}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}
