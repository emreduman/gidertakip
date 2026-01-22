import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { clsx } from "clsx"
import { FormActionsCell } from "@/components/forms/form-actions-cell"

export const dynamic = 'force-dynamic';

export default async function FormsPage() {
    const session = await auth();
    const forms = await prisma.expenseForm.findMany({
        where: { userId: session?.user?.id },
        orderBy: { submittedAt: 'desc' },
        include: { expenses: true }
    });

    return (
        <main>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Masraf Formlarım</h1>
                <Link href="/dashboard/forms/create">
                    <Button>+ Yeni Form Oluştur</Button>
                </Link>
            </div>

            <div className="bg-white rounded-md border shadow-sm">
                <div className="hidden md:grid grid-cols-5 gap-4 p-4 font-medium border-b bg-gray-50">
                    <div>Form ID</div>
                    <div>Oluşturulma Tarihi</div>
                    <div>Tutar</div>
                    <div>Durum</div>
                    <div>İşlemler</div>
                </div>
                {forms.map((form) => {
                    // Calculate dynamically
                    const totalAmount = form.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
                    return (
                        <div key={form.id} className="flex flex-col md:grid md:grid-cols-5 gap-y-3 gap-x-4 p-4 border-b last:border-0 md:items-center hover:bg-gray-50 transition-colors">
                            {/* Mobile Top Row: ID and Status */}
                            <div className="flex justify-between items-center md:block md:col-span-1">
                                <div className="font-mono text-xs text-gray-500">
                                    <span className="md:hidden font-bold text-gray-700 mr-2">ID:</span>
                                    {form.id.slice(0, 8)}...
                                </div>
                                <div className="md:hidden">
                                    <span className={clsx(
                                        "px-2 py-1 rounded text-xs font-medium",
                                        {
                                            'bg-yellow-100 text-yellow-800': form.status === 'SUBMITTED',
                                            'bg-green-100 text-green-800': form.status === 'APPROVED',
                                            'bg-red-100 text-red-800': form.status === 'REJECTED',
                                        }
                                    )}>
                                        {form.status === 'SUBMITTED' ? 'Bekliyor' :
                                            form.status === 'APPROVED' ? 'Onaylandı' : 'Reddedildi'}
                                    </span>
                                </div>
                            </div>

                            {/* Date */}
                            <div className="text-sm text-gray-600">
                                <span className="md:hidden font-bold text-gray-700 mr-2 text-xs">Tarih:</span>
                                {new Date(form.createdAt).toLocaleDateString('tr-TR')}
                            </div>

                            {/* Amount */}
                            <div className="font-bold text-gray-900">
                                <span className="md:hidden font-bold text-gray-700 mr-2 text-xs">Tutar:</span>
                                ₺{totalAmount.toFixed(2)}
                            </div>

                            {/* Desktop Status (Hidden on Mobile) */}
                            <div className="hidden md:block">
                                <span className={clsx(
                                    "px-2 py-1 rounded text-xs font-medium",
                                    {
                                        'bg-yellow-100 text-yellow-800': form.status === 'SUBMITTED',
                                        'bg-green-100 text-green-800': form.status === 'APPROVED',
                                        'bg-red-100 text-red-800': form.status === 'REJECTED',
                                    }
                                )}>
                                    {form.status === 'SUBMITTED' ? 'Bekliyor' :
                                        form.status === 'APPROVED' ? 'Onaylandı' : 'Reddedildi'}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end md:justify-start mt-2 md:mt-0">
                                <div className="flex items-center gap-2">
                                    <Link href={`/dashboard/forms/${form.id}`} className="text-blue-600 hover:underline text-sm font-medium">
                                        Detay
                                    </Link>
                                    <FormActionsCell formId={form.id} status={form.status} />
                                </div>
                            </div>
                        </div>
                    )
                })}
                {forms.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        Henüz oluşturulmuş masraf formu bulunmuyor.
                    </div>
                )}
            </div>
        </main>
    );
}
