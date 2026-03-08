'use client';

import { useState } from "react";
import { Expense } from "@prisma/client";
import { ExpenseGroup } from "./expense-group";
import { BulkActions } from "./bulk-actions";

interface ExpenseListClientProps {
    groupedExpenses: Record<string, any[]>;
}

export function ExpenseListClient({ groupedExpenses }: ExpenseListClientProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const clearSelection = () => {
        setSelectedIds([]);
    };

    const handleSelectAllInGroup = (groupExpenses: Expense[], isSelected: boolean) => {
        // Only select actionable expenses (Pending/Submitted)
        const actionableIds = groupExpenses
            .filter(e => e.status === 'PENDING' || e.status === 'SUBMITTED')
            .map(e => e.id);

        if (isSelected) {
            // Add all actionable to selection
            setSelectedIds(prev => {
                const newIds = new Set([...prev, ...actionableIds]);
                return Array.from(newIds);
            });
        } else {
            // Remove actionable from selection
            setSelectedIds(prev => prev.filter(id => !actionableIds.includes(id)));
        }
    };

    if (Object.keys(groupedExpenses).length === 0) {
        return (
            <div className="text-center p-10 bg-gray-50 rounded border">
                <p className="text-gray-500">Kriterlere uygun harcama bulunamadı.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {Object.entries(groupedExpenses).map(([period, items]) => (
                <ExpenseGroup
                    key={period}
                    title={period}
                    expenses={items}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelection}
                    onSelectAll={(isSelected) => handleSelectAllInGroup(items, isSelected)}
                />
            ))}

            <BulkActions selectedIds={selectedIds} onClearSelection={clearSelection} />
        </div>
    );
}
