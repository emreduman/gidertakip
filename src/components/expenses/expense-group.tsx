import { Expense } from "@prisma/client"
import { FileText, ExternalLink, ChevronDown } from "lucide-react"
import { ExpenseActionsCell } from "./expense-actions-cell"

export function ExpenseGroup({ title, expenses }: { title: string, expenses: Expense[] }) {
    const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

    return (
        <details className="group bg-white border rounded-lg shadow-sm overflow-hidden open:pb-0" open>
            <summary className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center cursor-pointer list-none select-none hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2">
                    <ChevronDown className="w-5 h-5 text-gray-500 transition-transform duration-300 group-open:rotate-180" />
                    <h3 className="font-bold text-gray-700">{title}</h3>
                </div>
                <span className="text-sm font-medium bg-white px-2 py-1 rounded border shadow-sm">
                    Toplam: ₺{total.toFixed(2)}
                </span>
            </summary>
            <div className="overflow-x-auto animate-in slide-in-from-top-2 duration-300">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-gray-500 font-medium border-b text-xs uppercase hidden md:table-header-group">
                        <tr>
                            <th className="px-4 py-2">Gün</th>
                            <th className="px-4 py-2 hidden sm:table-cell">Fiş</th>
                            <th className="px-4 py-2 hidden md:table-cell">İşyeri</th>
                            <th className="px-4 py-2 hidden lg:table-cell">Kategori</th>
                            <th className="px-4 py-2 hidden xl:table-cell">Açıklama</th>
                            <th className="px-4 py-2 text-right">Tutar</th>
                            <th className="px-4 py-2">Durum</th>
                            <th className="px-4 py-2 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {expenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-gray-50 flex flex-col md:table-row p-4 md:p-0 border-b md:border-none relative">
                                {/* Mobile Header for Day */}
                                <td className="md:px-4 md:py-3 w-full md:w-auto flex justify-between md:table-cell items-center mb-2 md:mb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="font-bold text-lg text-gray-700 bg-gray-100 w-10 h-10 flex items-center justify-center rounded">
                                            {new Date(expense.date).getDate()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500 md:hidden">{new Date(expense.date).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</span>
                                            <span className="text-sm font-medium text-gray-900 md:hidden">{expense.merchant}</span>
                                        </div>
                                    </div>
                                    {/* Mobile Amount & Status */}
                                    <div className="md:hidden text-right">
                                        <div className="font-bold text-gray-900">₺{Number(expense.amount).toFixed(2)}</div>
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mt-1 ${expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                            expense.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                expense.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
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
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 font-medium hidden md:table-cell">{expense.merchant || '-'}</td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                    <span className="inline-block bg-gray-100 text-gray-600 rounded px-2 py-0.5 text-xs">
                                        {expense.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate hidden xl:table-cell" title={expense.description || ''}>{expense.description}</td>

                                {/* Desktop Amount */}
                                <td className="px-4 py-3 text-right font-bold text-gray-900 hidden md:table-cell">
                                    <div>₺{Number(expense.amount).toFixed(2)}</div>
                                </td>

                                {/* Desktop Status */}
                                <td className="px-4 py-3 hidden md:table-cell">
                                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                        expense.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                            expense.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'
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
