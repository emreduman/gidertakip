'use client';

import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { useState } from "react";
import Link from 'next/link';

interface Form {
    id: string;
    title: string | null;
    formNumber: number;
    totalAmount: string; // serialized Decimal
    submittedAt: string; // serialized Date
    status: string;
    expenses: {
        period: { name: string } | null;
    }[];
}

interface PeriodFormListProps {
    forms: Form[];
}

export function PeriodFormList({ forms }: PeriodFormListProps) {
    const grouped = forms.reduce((acc, form) => {
        // Use first expense's period, or fallback
        const periodName = form.expenses[0]?.period?.name || 'Dönemsiz';
        if (!acc[periodName]) acc[periodName] = [];
        acc[periodName].push(form);
        return acc;
    }, {} as Record<string, Form[]>);

    const sortedKeys = Object.keys(grouped).sort();

    return (
        <div className="space-y-4">
            {sortedKeys.map((periodName) => (
                <PeriodFormAccordion
                    key={periodName}
                    title={periodName}
                    items={grouped[periodName]}
                />
            ))}
        </div>
    );
}

function PeriodFormAccordion({ title, items }: { title: string, items: Form[] }) {
    const [isOpen, setIsOpen] = useState(false);

    // Total of Forms in this period
    const total = items.reduce((sum, f) => sum + Number(f.totalAmount), 0);

    return (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    <span className="font-semibold text-gray-900">{title}</span>
                    <Badge variant="outline" className="ml-2 bg-white">{items.length} Form</Badge>
                </div>
                <span className="font-bold text-gray-900">₺{total.toFixed(2)}</span>
            </button>

            {isOpen && (
                <div className="divide-y border-t">
                    {items.map((form) => {
                        // Status Colors
                        let statusBadge;
                        switch (form.status) {
                            case 'APPROVED':
                                statusBadge = <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none">Onaylandı</Badge>;
                                break;
                            case 'REJECTED':
                                statusBadge = <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 shadow-none">Reddedildi</Badge>;
                                break;
                            case 'PAID':
                                statusBadge = <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-none">Ödendi</Badge>;
                                break;
                            default:
                                statusBadge = <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 shadow-none">Beklemede</Badge>;
                        }

                        return (
                            <Link
                                key={form.id}
                                href={`/dashboard/forms/${form.id}`}
                                className="block hover:bg-gray-50 transition-colors"
                            >
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{form.title || `Form #${form.formNumber}`}</div>
                                            <div className="text-xs text-gray-500">
                                                {format(new Date(form.submittedAt), 'd MMMM yyyy', { locale: tr })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="font-bold">₺{Number(form.totalAmount).toFixed(2)}</span>
                                        {statusBadge}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
