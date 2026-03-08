import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ExpenseHistoryFilter } from "@/components/expenses/expense-history-filter"
import { ExpenseListClient } from "@/components/expenses/expense-list-client"
import { ExportButton } from "@/components/expenses/export-button"

export default async function ExpensesPage(props: { searchParams: Promise<{ status?: string, month?: string }> }) {
    const searchParams = await props.searchParams;
    const session = await auth()

    // Build filter
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'OWNER';
    const where: any = {};
    
    // Non-admins only see their own expenses
    if (!isAdmin) {
        where.userId = session?.user?.id;
    }

    if (searchParams.status && searchParams.status !== 'ALL') {
        where.status = searchParams.status
    }

    // Date filtering (by month) - Simple implementation
    // Ideally we parse "2024-01"
    if (searchParams.month) {
        const [year, month] = searchParams.month.split('-').map(Number);
        if (year && month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of month
            where.date = {
                gte: startDate,
                lte: endDate
            }
        }
    }

    const expenses = await prisma.expense.findMany({
        where,
        include: { user: true },
        orderBy: { date: 'desc' }
    });

    // The `ExpenseListClient` expects serializable data.
    // Convert Prisma Decimal to standard JS numbers.
    const serializedExpenses = expenses.map(expense => ({
        ...expense,
        amount: Number(expense.amount),
        taxRate: expense.taxRate ? Number(expense.taxRate) : null,
        taxAmount: expense.taxAmount ? Number(expense.taxAmount) : null,
    }));

    // Group by Month-Year (e.g. "Ocak 2026")
    const groupedExpenses: { [key: string]: typeof serializedExpenses } = {};

    serializedExpenses.forEach(expense => {
        const date = new Date(expense.date);
        const key = date.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
        if (!groupedExpenses[key]) {
            groupedExpenses[key] = [];
        }
        groupedExpenses[key].push(expense);
    });

    return (
        <div className="w-full space-y-6 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Harcama Geçmişi</h1>
                    <p className="text-slate-500 mt-1">Tüm harcama kayıtlarınızı ve faturalarınızı yönetin</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="flex-1 md:flex-none">
                        <ExportButton />
                    </div>
                    <Link href="/dashboard/expenses/create" className="flex-1 md:flex-none">
                        <Button className="w-full hidden md:flex bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">+ Yeni Harcama</Button>
                        <Button className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl shadow-indigo-600/40 z-50 p-0 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white transition-transform active:scale-95">
                            <Plus className="h-7 w-7" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filter Component */}
            <ExpenseHistoryFilter />

            <ExpenseListClient groupedExpenses={groupedExpenses} />
        </div>
    )
}
