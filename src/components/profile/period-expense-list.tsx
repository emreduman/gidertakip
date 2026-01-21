'use client';

import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Expense {
    id: string;
    description: string;
    amount: any; // Decimal or string
    date: string | Date;
    status: string;
    merchant: string | null;
    period: {
        id: string;
        name: string;
    } | null;
}

interface PeriodExpenseListProps {
    expenses: Expense[];
}

export function PeriodExpenseList({ expenses }: PeriodExpenseListProps) {
    // Group expenses by Period Name
    const grouped = expenses.reduce((acc, expense) => {
        const key = expense.period?.name || 'Dönemsiz';
        if (!acc[key]) acc[key] = [];
        acc[key].push(expense);
        return acc;
    }, {} as Record<string, Expense[]>);

    // Sort periods? Maybe by recent date within them.
    // keys are just strings.
    const sortedKeys = Object.keys(grouped).sort(); // Or logic to sort by date

    return (
        <div className="space-y-4">
            {sortedKeys.map((periodName) => (
                <PeriodAccordion
                    key={periodName}
                    title={periodName}
                    items={grouped[periodName]}
                />
            ))}
        </div>
    );
}

function PeriodAccordion({ title, items }: { title: string, items: Expense[] }) {
    const [isOpen, setIsOpen] = useState(false);

    // Calculate totals
    const total = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const count = items.length;

    return (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    <span className="font-semibold text-gray-900">{title}</span>
                    <Badge variant="outline" className="ml-2 bg-white">{count} Harcama</Badge>
                </div>
                <span className="font-bold text-gray-900">{formatCurrency(total)}</span>
            </button>

            {isOpen && (
                <div className="divide-y border-t">
                    {items.map((expense) => {
                        let statusColor = "";
                        let statusText = "";

                        switch (expense.status) {
                            case 'APPROVED':
                                statusColor = "bg-green-100 text-green-700 hover:bg-green-100 border-green-200";
                                statusText = "Onaylandı";
                                break;
                            case 'REJECTED':
                                statusColor = "bg-red-100 text-red-700 hover:bg-red-100 border-red-200";
                                statusText = "Reddedildi";
                                break;
                            case 'PENDING':
                            case 'SUBMITTED':
                            default:
                                statusColor = "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200";
                                statusText = "Beklemede";
                                break;
                        }

                        return (
                            <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <div className="font-medium text-gray-900">{expense.description}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                        <span>{expense.merchant || 'Market'}</span>
                                        <span>•</span>
                                        <span>{format(new Date(expense.date), 'd MMMM yyyy', { locale: tr })}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="font-bold">{formatCurrency(Number(expense.amount))}</span>
                                    <Badge className={`${statusColor} border shadow-none font-normal text-xs`}>
                                        {statusText}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
