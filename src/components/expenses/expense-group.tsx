import { Expense } from "@prisma/client"
import { FileText, ExternalLink, ChevronDown } from "lucide-react"
import { ExpenseActionsCell } from "./expense-actions-cell"

export function ExpenseGroup({
    title,
    expenses,
    selectedIds = [],
    onToggleSelect,
    onSelectAll
}: {
    title: string;
    expenses: Expense[];
    selectedIds?: string[];
    onToggleSelect?: (id: string) => void;
    onSelectAll?: (isSelected: boolean) => void;
}) {
    const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const hasActionable = expenses.some(e => e.status === 'PENDING' || e.status === 'SUBMITTED');
    const isAllSelected = hasActionable && expenses.filter(e => e.status === 'PENDING' || e.status === 'SUBMITTED').every(e => selectedIds.includes(e.id));

    return (
        <details className="group bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden open:pb-0 mb-4 transition-all hover:shadow-md" open>
            <summary className="bg-slate-50/80 px-5 py-4 border-b border-slate-100 flex justify-between items-center cursor-pointer list-none select-none hover:bg-slate-100/80 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-1 rounded-md bg-white border border-slate-200 shadow-sm group-hover:border-indigo-300 transition-colors">
                        <ChevronDown className="w-5 h-5 text-slate-500 transition-transform duration-300 group-open:rotate-180" />
                    </div>
                    <h3 className="font-semibold text-lg text-slate-800 tracking-tight">{title}</h3>
                </div>
                <span className="text-sm font-bold text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                    Toplam: ₺{total.toFixed(2)}
                </span>
            </summary>
            <div className="overflow-x-auto animate-in slide-in-from-top-2 duration-300">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100 text-[11px] uppercase tracking-wider hidden md:table-header-group">
                        <tr>
                            <th className="px-4 py-3 w-12 text-center">
                                {onSelectAll && hasActionable && (
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-colors"
                                        checked={isAllSelected}
                                        onChange={(e) => onSelectAll(e.target.checked)}
                                    />
                                )}
                            </th>
                            <th className="px-4 py-2">Gün</th>
                            <th className="px-4 py-2 hidden sm:table-cell">Fiş</th>
                            <th className="px-4 py-2 hidden md:table-cell">Kullanıcı</th>
                            <th className="px-4 py-2 hidden md:table-cell">İşyeri</th>
                            <th className="px-4 py-2 hidden lg:table-cell">Kategori</th>
                            <th className="px-4 py-2 hidden xl:table-cell">Açıklama</th>
                            <th className="px-4 py-2 text-right">Tutar</th>
                            <th className="px-4 py-2">Durum</th>
                            <th className="px-4 py-2 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {expenses.map((expense: any) => (
                            <tr key={expense.id} className={`hover:bg-slate-50/80 flex flex-col md:table-row p-4 md:p-0 border-b border-slate-100 md:border-none relative transition-all duration-200 ${selectedIds.includes(expense.id) ? 'bg-indigo-50/40' : ''}`}>
                                {/* Desktop Checkbox */}
                                <td className="hidden md:table-cell px-4 py-3 text-center align-middle">
                                    {onToggleSelect && (expense.status === 'PENDING' || expense.status === 'SUBMITTED') && (
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                                            checked={selectedIds.includes(expense.id)}
                                            onChange={() => onToggleSelect(expense.id)}
                                        />
                                    )}
                                </td>

                                {/* Mobile Header for Day */}
                                <td className="md:px-4 md:py-3 w-full md:w-auto flex justify-between md:table-cell items-center mb-2 md:mb-0">
                                    <div className="flex items-center gap-3">
                                        {/* Mobile Checkbox inline with date */}
                                        <div className="md:hidden">
                                            {onToggleSelect && (expense.status === 'PENDING' || expense.status === 'SUBMITTED') && (
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    checked={selectedIds.includes(expense.id)}
                                                    onChange={() => onToggleSelect(expense.id)}
                                                />
                                            )}
                                        </div>

                                        <div className="font-bold text-lg text-gray-700 bg-gray-100 w-10 h-10 flex items-center justify-center rounded">
                                            {new Date(expense.date).getDate()}
                                        </div>
                                        <div className="flex flex-col">
                                            {expense.user && (
                                              <span className="text-xs font-semibold text-indigo-600 md:hidden">{expense.user.name || expense.user.email}</span>
                                            )}
                                            <span className="text-sm font-medium text-gray-900 md:hidden">{expense.merchant}</span>
                                        </div>
                                    </div>
                                    {/* Mobile Amount & Status */}
                                    <div className="md:hidden text-right">
                                        <div className="font-bold text-slate-800 text-lg">₺{Number(expense.amount).toFixed(2)}</div>
                                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold mt-1 ring-1 ring-inset ${expense.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                                                expense.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 ring-rose-600/20' :
                                                    expense.status === 'SUBMITTED' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' :
                                                        'bg-amber-50 text-amber-700 ring-amber-600/20'
                                            }`}>
                                            {expense.status === 'APPROVED' ? 'Onaylandı' :
                                                expense.status === 'REJECTED' ? 'Reddedildi' :
                                                    expense.status === 'SUBMITTED' ? 'Formda' : 'Bekliyor'}
                                        </span>
                                    </div>
                                </td>

                                {/* Desktop Only Columns */}
                                <td className="px-4 py-3 hidden sm:table-cell">
                                    {expense.receiptUrl ? (
                                        <a
                                            href={expense.receiptUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                            title="Fişi Görüntüle"
                                        >
                                            <FileText className="h-5 w-5" />
                                        </a>
                                    ) : (
                                        <span className="text-slate-300">-</span>
                                    )}
                                </td>
                                
                                <td className="px-4 py-3 hidden md:table-cell">
                                    {expense.user ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-700">{expense.user.name || "İsimsiz"}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 italic">Bilinmiyor</span>
                                    )}
                                </td>

                                <td className="px-4 py-3 font-semibold text-slate-800 hidden md:table-cell">{expense.merchant || '-'}</td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                    <span className="inline-block bg-slate-100 text-slate-600 rounded-md px-2.5 py-1 text-xs font-medium">
                                        {expense.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate hidden xl:table-cell" title={expense.description || ''}>{expense.description}</td>

                                {/* Desktop Amount */}
                                <td className="px-4 py-3 text-right font-bold text-slate-800 text-base hidden md:table-cell">
                                    <div>₺{Number(expense.amount).toFixed(2)}</div>
                                </td>

                                {/* Desktop Status */}
                                <td className="px-4 py-3 hidden md:table-cell">
                                    <span className={`px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${expense.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                                            expense.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 ring-rose-600/20' :
                                                expense.status === 'SUBMITTED' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' :
                                                    'bg-amber-50 text-amber-700 ring-amber-600/20'
                                        }`}>
                                        {expense.status === 'APPROVED' ? 'Onaylandı' :
                                            expense.status === 'REJECTED' ? 'Reddedildi' :
                                                expense.status === 'SUBMITTED' ? 'Formda' : 'Bekliyor'}
                                    </span>
                                </td>

                                {/* Actions - Mobile: Absolute Position or Row? Row is better for touch. */}
                                <td className="md:px-4 md:py-3 w-full md:w-auto flex justify-between md:table-cell items-center mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-none border-gray-100">
                                    {/* Mobile Receipt Link */}
                                    <div className="md:hidden">
                                        {expense.receiptUrl ? (
                                            <a
                                                href={expense.receiptUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                                            >
                                                <FileText className="h-4 w-4" /> Fişi Gör
                                            </a>
                                        ) : <span className="text-xs text-gray-400">Fiş Yok</span>}
                                    </div>

                                    <ExpenseActionsCell expense={{
                                        ...expense,
                                        amount: Number(expense.amount),
                                        date: new Date(expense.date).toISOString()
                                    }} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </details>
    )
}
