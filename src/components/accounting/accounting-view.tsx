"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { FormActionsCell } from "@/components/forms/form-actions-cell"

interface ExpenseForm {
    id: string
    title: string | null
    totalAmount: any // Decimal
    submittedAt: Date
    createdAt: Date
    user: {
        name: string | null
        email: string | null
    }
    expenses: any[]
}

interface AccountingViewProps {
    pendingForms: ExpenseForm[]
    approvedForms: ExpenseForm[]
    rejectedForms: ExpenseForm[]
}

export function AccountingView({ pendingForms, approvedForms, rejectedForms }: AccountingViewProps) {
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

    const getList = () => {
        switch (activeTab) {
            case 'pending': return pendingForms;
            case 'approved': return approvedForms;
            case 'rejected': return rejectedForms;
            default: return [];
        }
    };

    const forms = getList();

    return (
        <div className="space-y-6">
            <div className="flex space-x-2 border-b overflow-x-auto pb-1 no-scrollbar">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'pending'
                        ? "border-orange-500 text-orange-600 font-medium"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    Onay Bekleyenler
                    <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700 hover:bg-orange-100">
                        {pendingForms.length}
                    </Badge>
                </button>
                <button
                    onClick={() => setActiveTab('approved')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'approved'
                        ? "border-green-500 text-green-600 font-medium"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <CheckCircle2 className="w-4 h-4" />
                    Onaylananlar
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">
                        {approvedForms.length}
                    </Badge>
                </button>
                <button
                    onClick={() => setActiveTab('rejected')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'rejected'
                        ? "border-red-500 text-red-600 font-medium"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <XCircle className="w-4 h-4" />
                    Reddedilenler
                    <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700 hover:bg-red-100">
                        {rejectedForms.length}
                    </Badge>
                </button>
            </div>

            <div className="bg-white rounded-md border shadow-sm">
                <div className="hidden md:grid grid-cols-5 gap-4 p-4 font-medium border-b bg-gray-50 text-sm text-gray-500">
                    <div>Kullanıcı</div>
                    <div>Tarih</div>
                    <div>Tutar</div>
                    <div>Form ID</div>
                    <div>İşlem</div>
                </div>
                {forms.length > 0 ? (
                    forms.map((form) => {
                        const totalAmount = form.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
                        return (
                            <div key={form.id} className="flex flex-col md:grid md:grid-cols-5 gap-y-2 gap-x-4 p-4 border-b last:border-0 md:items-center hover:bg-gray-50 transition-colors">
                                <div className="md:col-span-1">
                                    <div className="flex justify-between items-start">
                                        <div className="font-medium text-gray-900">{form.user?.name || 'Bilinmeyen Kullanıcı'}</div>
                                        <div className="md:hidden font-mono text-xs text-gray-400 bg-gray-100 px-1 py-0.5 rounded">
                                            {form.id.slice(0, 8)}...
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">{form.user?.email}</div>
                                </div>

                                <div className="text-sm text-gray-600 flex md:block justify-between mt-1 md:mt-0">
                                    <span className="md:hidden font-bold text-gray-700 text-xs mr-2">Tarih:</span>
                                    <span>{new Date(form.submittedAt || form.createdAt).toLocaleDateString('tr-TR')}</span>
                                </div>

                                <div className="font-bold text-gray-900 flex md:block justify-between">
                                    <span className="md:hidden font-bold text-gray-700 text-xs mr-2">Tutar:</span>
                                    <span>₺{totalAmount.toFixed(2)}</span>
                                </div>

                                <div className="hidden md:block font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit">
                                    {form.id.slice(0, 8)}...
                                </div>

                                <div className="flex justify-end md:justify-start mt-2 md:mt-0">
                                    <div className="flex items-center gap-2">
                                        <Link href={`/dashboard/accounting/${form.id}`}>
                                            <Button size="sm" variant="outline" className="h-8">İncele</Button>
                                        </Link>
                                        {/* Only show delete/edit actions for Pending/Rejected */}
                                        {(activeTab === 'pending' || activeTab === 'rejected') && (
                                            <FormActionsCell formId={form.id} status={activeTab === 'pending' ? 'SUBMITTED' : 'REJECTED'} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="p-12 text-center">
                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            {activeTab === 'pending' && <Clock className="w-6 h-6 text-gray-400" />}
                            {activeTab === 'approved' && <CheckCircle2 className="w-6 h-6 text-gray-400" />}
                            {activeTab === 'rejected' && <XCircle className="w-6 h-6 text-gray-400" />}
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">Kayıt Bulunamadı</h3>
                        <p className="text-sm text-gray-500 mt-1">Bu kategoride gösterilecek masraf formu yok.</p>
                    </div>
                )
                }
            </div>
        </div>
    )
}
