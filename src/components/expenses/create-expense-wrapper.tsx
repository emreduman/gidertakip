'use client'

import { useState } from "react"
import { CreateExpenseForm } from "@/components/expenses/create-expense-form"
import { BulkUploadForm } from "@/components/expenses/bulk-upload-form"
import { clsx } from "clsx"

export function CreateExpenseWrapper({ allUsers }: { allUsers?: any[] }) {
    const [mode, setMode] = useState<'single' | 'bulk'>('single')

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Yeni Harcama Ekle</h1>

            {/* Simple Tabs */}
            <div className="flex border-b">
                <button
                    className={clsx(
                        "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                        mode === 'single' ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                    onClick={() => setMode('single')}
                >
                    Tekli Ekleme
                </button>
                <button
                    className={clsx(
                        "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                        mode === 'bulk' ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                    onClick={() => setMode('bulk')}
                >
                    Toplu Yükleme (PDF/Resim)
                </button>
            </div>

            <div className="pt-4">
                {mode === 'single' ? (
                    <CreateExpenseForm users={allUsers} />
                ) : (
                    <BulkUploadForm />
                )}
            </div>
        </div>
    )
}
