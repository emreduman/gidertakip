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
                        <div key={form.id} className="grid grid-cols-2 md:grid-cols-5 gap-y-2 gap-x-4 p-4 border-b last:border-0 items-center">
                            <div className="font-mono text-xs text-gray-500 col-span-2 md:col-span-1">
                                <span className="md:hidden font-bold text-gray-700 mr-2">ID:</span>
                                {form.id.slice(0, 8)}...
                            </div>
                            <div className="text-sm">
                                <span className="md:hidden font-bold text-gray-700 block text-xs">Tarih</span>
                                {new Date(form.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                            <div className="font-bold">
                                <span className="md:hidden font-bold text-gray-700 block text-xs">Tutar</span>
                                ₺{totalAmount.toFixed(2)}
                            </div>
                            <div>
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
                            <div>
                                <div className="flex items-center gap-2 justify-end md:justify-start">
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
