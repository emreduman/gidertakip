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
        <div className="p-3 border rounded bg-white flex justify-between items-center gap-4">
            {isEditing ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="İsim"
                        className="h-8"
                    />
                    <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="h-8"
                    />
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                        className="h-8 border rounded px-2 text-sm"
                    >
                        {Object.keys(ROLE_LABELS).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                    <div className="flex gap-1">
                        <select
                            value={orgId}
                            onChange={(e) => setOrgId(e.target.value)}
                            className="h-8 border rounded px-2 text-sm flex-1"
                        >
                            <option value="">Organizasyon Yok</option>
                            {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                        <Button size="sm" onClick={handleUpdate} variant="default" className="h-8 w-8 p-0 shrink-0">
                            <CheckIcon className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => setIsEditing(false)} variant="ghost" className="h-8 w-8 p-0 shrink-0">
                            <XIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex flex-col">
                        <span className="font-medium">{user.name || 'İsimsiz'}</span>
                        <span className="text-xs text-gray-500">
                            {user.email} • {ROLE_LABELS[user.role] || user.role} {user.organization ? `• ${user.organization.name}` : ''}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setIsEditing(true)}>
                            <PencilIcon className="w-4 h-4 text-gray-500" />
                        </Button>
                        <form action={onDelete}>
                            <input type="hidden" name="id" value={user.id} />
                            <Button
                                variant="ghost"
                                size="sm"
                                type="submit"
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
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
