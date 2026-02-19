import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { clsx } from "clsx"

export default async function ExpenseFormDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();

    const form = await prisma.expenseForm.findUnique({
        where: { id: params.id },
        include: {
            expenses: true,
            user: true
        }
    });

    if (!form) return <div>Form bulunamadı.</div>;

    // Check ownership if not admin/accountant (simple check)
    if (form.userId !== session?.user?.id && session?.user?.role === 'VOLUNTEER') {
        return <div>Bu formu görme yetkiniz yok.</div>
    }

    const totalAmount = form.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Masraf Formu Detayı</h1>
                    <p className="text-gray-500">
                        {new Date(form.submittedAt || form.createdAt).toLocaleDateString('tr-TR')} tarihinde oluşturuldu.
                    </p>
                </div>
                <div>
                    <span className={clsx(
                        "px-3 py-1 rounded text-sm font-medium",
                        {
                            'bg-yellow-100 text-yellow-800': form.status === 'SUBMITTED',
                            'bg-green-100 text-green-800': form.status === 'APPROVED',
                            'bg-red-100 text-red-800': form.status === 'REJECTED',
                        }
                    )}>
                        {form.status === 'SUBMITTED' ? 'Muhasebe Onayında' :
                            form.status === 'APPROVED' ? 'Onaylandı' : 'Reddedildi'}
                    </span>
                </div>
            </div>

            {form.status === 'REJECTED' && form.rejectionReason && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
                    <p className="font-bold">Red Nedeni:</p>
                    <p>{form.rejectionReason}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Form İçeriği</h2>
                    {form.expenses.map(expense => (
                        <div key={expense.id} className="border p-4 rounded bg-white shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                                <div className="font-bold text-gray-900">{expense.category}</div>
                                <div className="text-sm text-gray-500">{expense.description}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {expense.merchant} - {new Date(expense.date).toLocaleDateString('tr-TR')}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-lg">₺{Number(expense.amount).toFixed(2)}</div>
                                {expense.receiptUrl && (
                                    <div className="mt-1 text-sm text-blue-600 underline">
                                        <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">Fişi Görüntüle</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-end pt-4">
                        <div className="text-right p-4 bg-gray-50 rounded min-w-[200px]">
                            <p className="text-sm text-gray-500">Giderler Toplamı</p>
                            <p className="text-2xl font-bold text-gray-900">₺{totalAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
