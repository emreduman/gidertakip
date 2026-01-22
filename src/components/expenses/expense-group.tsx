import { Expense } from "@prisma/client"
import { FileText, ExternalLink } from "lucide-react"
import { ExpenseActionsCell } from "./expense-actions-cell"

export function ExpenseGroup({ title, expenses }: { title: string, expenses: Expense[] }) {
    const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

    return (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-700">{title}</h3>
                <span className="text-sm font-medium bg-white px-2 py-1 rounded border shadow-sm">
                    Toplam: ₺{total.toFixed(2)}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-gray-500 font-medium border-b text-xs uppercase">
                        <tr>
                            <th className="px-4 py-2">Gün</th>
                            <th className="px-4 py-2">Fiş</th>
                            <th className="px-4 py-2">İşyeri</th>
                            <th className="px-4 py-2">Kategori</th>
                            <th className="px-4 py-2">Açıklama</th>
                            <th className="px-4 py-2 text-right">Tutar</th>
                            <th className="px-4 py-2">Durum</th>
                            <th className="px-4 py-2 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {expenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 w-[100px]">
                                    <div className="font-bold text-lg text-gray-700">
                                        {new Date(expense.date).getDate()}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {new Date(expense.date).toLocaleDateString('tr-TR', { weekday: 'short' })}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
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
                                <td className="px-4 py-3 font-medium">{expense.merchant || '-'}</td>
                                <td className="px-4 py-3">
                                    <span className="inline-block bg-gray-100 text-gray-600 rounded px-2 py-0.5 text-xs">
                                        {expense.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={expense.description || ''}>{expense.description}</td>
                                <td className="px-4 py-3 text-right font-bold text-gray-900">₺{Number(expense.amount).toFixed(2)}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                        expense.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                            expense.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {expense.status === 'APPROVED' ? 'Onaylandı' :
                                            expense.status === 'REJECTED' ? 'Reddedildi' :
                                                expense.status === 'SUBMITTED' ? 'Formda' : 'Bekliyor'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <ExpenseActionsCell expense={expense} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
