import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ExpenseHistoryFilter } from "@/components/expenses/expense-history-filter"
import { ExpenseGroup } from "@/components/expenses/expense-group"
import { ExportButton } from "@/components/expenses/export-button"

export default async function ExpensesPage(props: { searchParams: Promise<{ status?: string, month?: string }> }) {
    const searchParams = await props.searchParams;
    const session = await auth()

    // Build filter
    const where: any = { userId: session?.user?.id }

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
        orderBy: { date: 'desc' }
    });

    // Group by Month-Year (e.g. "Ocak 2026")
    const groupedExpenses: { [key: string]: typeof expenses } = {};

    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const key = date.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
        if (!groupedExpenses[key]) {
            groupedExpenses[key] = [];
        }
        groupedExpenses[key].push(expense);
    });

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Harcama Geçmişi</h1>
                <div className="flex gap-2">
                    <ExportButton />
                    <Link href="/dashboard/expenses/create">
                        <Button>+ Yeni Harcama</Button>
                    </Link>
                </div>
            </div>

            {/* Filter Component */}
            <ExpenseHistoryFilter />

            <div className="space-y-8">
                {Object.keys(groupedExpenses).length === 0 ? (
                    <div className="text-center p-10 bg-gray-50 rounded border">
                        <p className="text-gray-500">Kriterlere uygun harcama bulunamadı.</p>
                    </div>
                ) : (
                    Object.entries(groupedExpenses).map(([period, items]) => (
                        <ExpenseGroup key={period} title={period} expenses={items} />
                    ))
                )}
            </div>
        </div>
    )
}
