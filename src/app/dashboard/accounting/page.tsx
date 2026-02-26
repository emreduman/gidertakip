import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AccountingView } from "@/components/accounting/accounting-view"

export const dynamic = 'force-dynamic';

export default async function AccountingPage() {
    const session = await auth();
    // In real app, check role: if (session?.user?.role !== 'ACCOUNTANT' && session?.user?.role !== 'ADMIN') ...

    // Fetch lists in parallel
    const [pendingForms, approvedForms, rejectedForms] = await Promise.all([
        prisma.expenseForm.findMany({
            where: { status: 'SUBMITTED' },
            include: { user: true, expenses: true },
            orderBy: { submittedAt: 'asc' }
        }),
        prisma.expenseForm.findMany({
            where: { status: 'APPROVED' },
            include: { user: true, expenses: true },
            orderBy: { processedAt: 'desc' },
            take: 50 // Limit history
        }),
        prisma.expenseForm.findMany({
            where: { status: 'REJECTED' },
            include: { user: true, expenses: true },
            orderBy: { processedAt: 'desc' },
            take: 50 // Limit history
        })
    ]);

    // Helper to serialize Decimal and Date
    const serialize = (forms: any[]) => forms.map(f => ({
        ...f,
        totalAmount: f.totalAmount ? f.totalAmount.toString() : "0",
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
        submittedAt: f.submittedAt?.toISOString() || null,
        processedAt: f.processedAt?.toISOString() || null,
        expenses: f.expenses.map((e: any) => ({
            ...e,
            amount: e.amount.toString(),
            date: e.date.toISOString(),
            createdAt: e.createdAt.toISOString(),
            updatedAt: e.updatedAt.toISOString(),
        }))
    }));

    return (
        <main className="max-w-7xl mx-auto pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Muhasebe Paneli</h1>
                <p className="text-slate-500 mt-2">Personel masraf formlarını inceleyin, onaylayın veya reddedin.</p>
            </div>

            <AccountingView
                pendingForms={serialize(pendingForms)}
                approvedForms={serialize(approvedForms)}
                rejectedForms={serialize(rejectedForms)}
            />
        </main>
    );
}
