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
            <div className="flex p-1 bg-slate-100/50 rounded-xl w-fit mb-6 border border-slate-200/60">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'pending'
                        ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        }`}
                >
                    <Clock className={`w-4 h-4 ${activeTab === 'pending' ? 'text-indigo-500' : ''}`} />
                    Onay Bekleyenler
                    <Badge variant="secondary" className={`ml-1.5 transition-colors ${activeTab === 'pending' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100' : 'bg-slate-200 text-slate-600'}`}>
                        {pendingForms.length}
                    </Badge>
                </button>
                <button
                    onClick={() => setActiveTab('approved')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'approved'
                        ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        }`}
                >
                    <CheckCircle2 className={`w-4 h-4 ${activeTab === 'approved' ? 'text-emerald-500' : ''}`} />
                    Onaylananlar
                    <Badge variant="secondary" className={`ml-1.5 transition-colors ${activeTab === 'approved' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-200 text-slate-600'}`}>
                        {approvedForms.length}
                    </Badge>
                </button>
                <button
                    onClick={() => setActiveTab('rejected')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'rejected'
                        ? "bg-white text-rose-700 shadow-sm border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        }`}
                >
                    <XCircle className={`w-4 h-4 ${activeTab === 'rejected' ? 'text-rose-500' : ''}`} />
                    Reddedilenler
                    <Badge variant="secondary" className={`ml-1.5 transition-colors ${activeTab === 'rejected' ? 'bg-rose-100 text-rose-700 hover:bg-rose-100' : 'bg-slate-200 text-slate-600'}`}>
                        {rejectedForms.length}
                    </Badge>
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-4 font-semibold border-b border-slate-100 bg-slate-50/50 text-xs text-slate-500 uppercase tracking-wider">
                    <div>Kullanıcı</div>
                    <div>Tarih</div>
                    <div>Toplam Tutar</div>
                    <div>Form ID</div>
                    <div className="text-right">İşlem</div>
                </div>
                {forms.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {forms.map((form) => {
                            const totalAmount = form.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
                            return (
                                <div key={form.id} className="flex flex-col md:grid md:grid-cols-5 gap-y-3 gap-x-4 p-4 md:px-6 md:py-4 md:items-center hover:bg-slate-50/50 transition-colors group">
                                    <div className="md:col-span-1">
                                        <div className="flex justify-between items-start">
                                            <div className="font-semibold text-slate-800">{form.user?.name || 'Bilinmeyen Kullanıcı'}</div>
                                            <div className="md:hidden font-mono text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                                #{form.id.slice(0, 8)}
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 truncate">{form.user?.email}</div>
                                    </div>

                                    <div className="text-sm text-slate-600 flex md:block justify-between items-center mt-1 md:mt-0">
                                        <span className="md:hidden font-semibold text-slate-500 text-xs mr-2 uppercase tracking-wide">Tarih:</span>
                                        <span className="font-medium">{new Date(form.submittedAt || form.createdAt).toLocaleDateString('tr-TR')}</span>
                                    </div>

                                    <div className="flex md:block justify-between items-center">
                                        <span className="md:hidden font-semibold text-slate-500 text-xs mr-2 uppercase tracking-wide">Tutar:</span>
                                        <div className="flex items-center gap-1.5 font-bold text-slate-900 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md w-fit border border-emerald-100/50">
                                            <span>₺</span>
                                            <span>{totalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="hidden md:block">
                                        <span className="font-mono text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                            #{form.id.slice(0, 8)}
                                        </span>
                                    </div>

                                    <div className="flex justify-end mt-3 md:mt-0">
                                        <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                                            <Link href={`/dashboard/accounting/${form.id}`}>
                                                <Button size="sm" variant="outline" className="h-9 px-4 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900">İncele</Button>
                                            </Link>
                                            {/* Only show delete/edit actions for Pending/Rejected */}
                                            {(activeTab === 'pending' || activeTab === 'rejected') && (
                                                <FormActionsCell formId={form.id} status={activeTab === 'pending' ? 'SUBMITTED' : 'REJECTED'} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="px-6 py-16 text-center flex flex-col items-center justify-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm border ${activeTab === 'pending' ? 'bg-indigo-50 border-indigo-100' :
                                activeTab === 'approved' ? 'bg-emerald-50 border-emerald-100' :
                                    'bg-rose-50 border-rose-100'
                            }`}>
                            {activeTab === 'pending' && <Clock className="w-7 h-7 text-indigo-500" />}
                            {activeTab === 'approved' && <CheckCircle2 className="w-7 h-7 text-emerald-500" />}
                            {activeTab === 'rejected' && <XCircle className="w-7 h-7 text-rose-500" />}
                        </div>
                        <h3 className="text-base font-bold text-slate-800">Kayıt Bulunamadı</h3>
                        <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
                            Bu sekmede görüntüleyebileceğiniz herhangi bir masraf formu şu an için bulunmamaktadır.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
