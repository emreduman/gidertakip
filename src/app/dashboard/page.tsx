import { auth } from "@/auth"

import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { prisma } from "@/lib/prisma"
import { NotificationBell } from "@/components/dashboard/notification-bell"

// Function to get date range from period
function getDateRange(year: number, period: string) {
    let startMonth = 0; // Jan
    let endMonth = 11; // Dec

    switch (period) {
        case 'Q1': endMonth = 2; break; // Jan-Mar
        case 'Q2': startMonth = 3; endMonth = 5; break; // Apr-Jun
        case 'Q3': startMonth = 6; endMonth = 8; break; // Jul-Sep
        case 'Q4': startMonth = 9; endMonth = 11; break; // Oct-Dec
        case 'H1': endMonth = 5; break; // Jan-Jun
        case 'H2': startMonth = 6; break; // Jul-Dec
        default: break; // 'all'
    }

    const start = new Date(year, startMonth, 1);
    const end = new Date(year, endMonth + 1, 0); // Last day of endMonth
    return { start, end };
}

// Helper for Previous Period
function getPreviousPeriodParams(year: number, period: string) {
    if (period === 'all') return { year: year - 1, period: 'all' };

    if (period === 'Q1') return { year: year - 1, period: 'Q4' };
    if (period === 'Q2') return { year, period: 'Q1' };
    if (period === 'Q3') return { year, period: 'Q2' };
    if (period === 'Q4') return { year, period: 'Q3' };

    if (period === 'H1') return { year: year - 1, period: 'H2' };
    if (period === 'H2') return { year, period: 'H1' };

    return { year: year - 1, period: 'all' };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ year?: string, period?: string }> }) {
    const session = await auth()

    // Parse filters
    const { year: yearParam, period: periodParam } = await searchParams;
    const year = Number(yearParam) || new Date().getFullYear();
    const period = periodParam || 'all';

    const { start, end } = getDateRange(year, period);

    // 1. Fetch Expenses in Range
    const expensesInRange = await prisma.expense.findMany({
        where: {
            userId: session?.user?.id,
            date: { gte: start, lte: end }
        },
        orderBy: { date: 'desc' }
    });

    // 1.1 Fetch Previous Period Expenses for Comparison
    const prevParams = getPreviousPeriodParams(year, period);
    const { start: prevStart, end: prevEnd } = getDateRange(prevParams.year, prevParams.period);

    const prevExpenses = await prisma.expense.findMany({
        where: {
            userId: session?.user?.id,
            date: { gte: prevStart, lte: prevEnd }
        }
    });

    const recentExpenses = expensesInRange.slice(0, 5);

    // Filter out REJECTED expenses for effective spend calculations
    const activeExpenses = expensesInRange.filter(e => e.status !== 'REJECTED');

    // 2. Calculate KPI Metrics
    const totalSpend = activeExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const prevTotalSpend = prevExpenses.filter(e => e.status !== 'REJECTED').reduce((sum, e) => sum + Number(e.amount), 0);

    let percentageChange = 0;
    if (prevTotalSpend > 0) {
        percentageChange = ((totalSpend - prevTotalSpend) / prevTotalSpend) * 100;
    } else if (totalSpend > 0) {
        percentageChange = 100; // 0 to something is 100% increase (or Infinity)
    }

    const pendingAmount = expensesInRange.filter(e => e.status === 'PENDING' || e.status === 'SUBMITTED').reduce((sum, e) => sum + Number(e.amount), 0);
    const approvedAmount = expensesInRange.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + Number(e.amount), 0);
    const rejectedAmount = expensesInRange.filter(e => e.status === 'REJECTED').reduce((sum, e) => sum + Number(e.amount), 0);

    // 3. Prepare Chart Data (Monthly)
    const chartMap = new Map<string, number>();
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    // Initialize only months in range for cleanliness (or all for consistency)
    months.forEach(m => chartMap.set(m, 0));

    activeExpenses.forEach(e => {
        const monthIndex = new Date(e.date).getMonth();
        const monthName = months[monthIndex];
        chartMap.set(monthName, (chartMap.get(monthName) || 0) + Number(e.amount));
    });

    // Filter chart data to only show relevant months if period is selected
    let activeMonthIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    if (period === 'Q1') activeMonthIndices = [0, 1, 2];
    if (period === 'Q2') activeMonthIndices = [3, 4, 5];
    if (period === 'Q3') activeMonthIndices = [6, 7, 8];
    if (period === 'Q4') activeMonthIndices = [9, 10, 11];
    if (period === 'H1') activeMonthIndices = [0, 1, 2, 3, 4, 5];
    if (period === 'H2') activeMonthIndices = [6, 7, 8, 9, 10, 11];

    const chartData = activeMonthIndices.map(i => ({
        name: months[i],
        total: chartMap.get(months[i]) || 0
    }));

    // 4. Calculate Category Distribution (Simple Top 5)
    const categoryMap = new Map<string, number>();
    activeExpenses.forEach(e => {
        const cat = e.category || 'Diğer';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(e.amount));
    });

    const topCategories = Array.from(categoryMap.entries())
        .sort((a, b) => b[1] - a[1]) // Descending
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));




    return (
        <main className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Harcama Özeti</h1>
                    <p className="text-sm text-muted-foreground">
                        {year} yılı {period === 'all' ? 'genel özeti' : `${period} dönemi özeti`}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Welcome Text */}
                    <div className="text-sm text-muted-foreground hidden md:block">
                        Hoş geldin, <Link href="/dashboard/profile" className="font-semibold text-foreground hover:underline">{session?.user?.name}</Link>
                    </div>
                    {/* Desktop Notification Bell */}
                    <div className="hidden md:block">
                        <NotificationBell />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <DashboardFilters />

            {/* KPI Cards */}
            <KPICards
                totalSpend={totalSpend}
                pendingAmount={pendingAmount}
                approvedAmount={approvedAmount}
                rejectedAmount={rejectedAmount}
                percentageChange={percentageChange}
            />

            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Chart */}
                <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-4 md:p-6 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Harcama Trendi</h3>
                    </div>
                    <div className="p-4 md:p-6 pt-0 pl-2">
                        <OverviewChart data={chartData} />
                    </div>
                </div>

                {/* Right Column: Recent & Categories */}
                <div className="col-span-3 space-y-4 md:space-y-6">
                    {/* Top Categories */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-4 md:p-6">
                        <h3 className="font-semibold mb-4 text-sm md:text-base">En Çok Harcanan Kategoriler</h3>
                        {topCategories.length === 0 ? (
                            <p className="text-sm text-gray-500">Veri yok.</p>
                        ) : (
                            <div className="space-y-3">
                                {topCategories.map((cat, idx) => (

                                    <div key={cat.name} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" style={{ opacity: 1 - (idx * 0.15) }} />
                                            <span className="text-sm font-medium truncate">{cat.name}</span>
                                        </div>
                                        <div className="text-sm font-bold whitespace-nowrap">{formatCurrency(cat.value)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-4 md:p-6">
                        <h3 className="font-semibold mb-4 text-sm md:text-base">Son Aktiviteler</h3>
                        {recentExpenses.length === 0 ? (
                            <p className="text-sm text-gray-500">Bu dönemde aktivite yok.</p>
                        ) : (
                            <div className="space-y-4">
                                {recentExpenses.map(expense => (
                                    <div key={expense.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 gap-2">
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="font-medium text-sm truncate">{expense.merchant || 'Bilinmeyen'}</span>
                                            <span className="text-xs text-gray-500 truncate">{new Date(expense.date).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <div className="font-bold text-sm text-red-600 whitespace-nowrap">
                                            -{formatCurrency(Number(expense.amount))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
