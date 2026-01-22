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
            <div className="flex space-x-2 border-b">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === 'pending'
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
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === 'approved'
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
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === 'rejected'
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
                <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b bg-gray-50 text-sm text-gray-500">
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
                            <div key={form.id} className="grid grid-cols-5 gap-4 p-4 border-b last:border-0 items-center hover:bg-gray-50 transition-colors">
                                <div>
                                    <div className="font-medium text-gray-900">{form.user?.name || 'Bilinmeyen Kullanıcı'}</div>
                                    <div className="text-xs text-gray-500">{form.user?.email}</div>
                                </div>
                                <div className="text-sm text-gray-600">
                                    {new Date(form.submittedAt || form.createdAt).toLocaleDateString('tr-TR')}
                                </div>
                                <div className="font-bold text-gray-900">₺{totalAmount.toFixed(2)}</div>
                                <div className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit">
                                    {form.id.slice(0, 8)}...
                                </div>
                                <div>
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
                )}
            </div>
        </div>
    )
}
