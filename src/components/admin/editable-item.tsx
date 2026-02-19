'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PencilIcon, XIcon, CheckIcon, TrashIcon } from 'lucide-react';

interface EditableItemProps {
    id: string;
    initialName: string;
    subText?: string;
    onUpdate: (formData: FormData) => Promise<void>;
    onDelete: (formData: FormData) => Promise<void>;
}

export function EditableItem({ id, initialName, subText, onUpdate, onDelete }: EditableItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(initialName);

    const handleUpdate = async () => {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('name', name);
        await onUpdate(formData);
        setIsEditing(false);
    };

    return (
        <div className="p-2 border rounded bg-gray-50 flex justify-between items-center">
            {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-8"
                    />
                    <Button size="sm" onClick={handleUpdate} variant="default" className="h-8 w-8 p-0">
                        <CheckIcon className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={() => setIsEditing(false)} variant="ghost" className="h-8 w-8 p-0">
                        <XIcon className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <div className="flex items-center justify-between flex-1">
                    <div>
                        <span className="font-medium text-sm">{name}</span>
                        {subText && <span className="text-xs text-gray-500 ml-2">{subText}</span>}
                    </div>
                    <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setIsEditing(true)}>
                            <PencilIcon className="w-4 h-4 text-gray-500" />
                        </Button>
                        <form action={onDelete}>
                            <input type="hidden" name="id" value={id} />
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600">
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
