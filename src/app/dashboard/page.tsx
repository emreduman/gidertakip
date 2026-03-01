import { auth } from "@/auth"
import React from 'react';

import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { prisma } from "@/lib/prisma"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { BudgetProgress } from "@/components/dashboard/budget-progress"

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

    // 5. Active Period & Budget
    const activePeriod = await prisma.period.findFirst({
        where: {
            isActive: true,
            startDate: { lte: end },
            endDate: { gte: start }
        }
    });

    const periodSpend = activePeriod
        ? expensesInRange.filter(e => e.periodId === activePeriod.id && e.status !== 'REJECTED').reduce((sum, e) => sum + Number(e.amount), 0)
        : 0;



    return (
        <main className="space-y-6 pb-8">
            {/* Premium Header */}
            <div className="relative z-30 overflow-visible rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-800 to-indigo-950 p-6 shadow-lg text-white mb-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="relative z-40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-1">Harcama Özeti</h1>
                        <p className="text-indigo-200 font-medium">
                            {year} yılı {period === 'all' ? 'genel özeti' : `${period} dönemi özeti`}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Welcome Text */}
                        <div className="text-sm md:text-base text-indigo-100 hidden md:block">
                            Hoş geldin, <Link href="/dashboard/profile" className="font-semibold text-white hover:text-indigo-200 transition-colors">{session?.user?.name}</Link>
                        </div>
                        {/* Desktop Notification Bell */}
                        <div className="hidden md:block bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors">
                            <NotificationBell />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="w-full bg-white p-2 rounded-2xl shadow-sm border border-slate-100 relative z-20 mx-auto max-w-5xl">
                <React.Suspense fallback={<div className="h-14 bg-gray-100 rounded-lg animate-pulse" />}>
                    <DashboardFilters />
                </React.Suspense>
            </div>

            {/* Budget Progress (Only show if there's an active period with a budget) */}
            {(activePeriod as any)?.budget && Number((activePeriod as any).budget) > 0 && (
                <div className="w-full">
                    <BudgetProgress
                        periodName={activePeriod?.name || ''}
                        targetBudget={Number((activePeriod as any).budget)}
                        currentSpend={periodSpend}
                    />
                </div>
            )}

            {/* KPI Cards */}
            <KPICards
                totalSpend={totalSpend}
                pendingAmount={pendingAmount}
                approvedAmount={approvedAmount}
                rejectedAmount={rejectedAmount}
                percentageChange={percentageChange}
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 w-full max-w-full overflow-hidden mt-6">
                {/* Main Chart */}
                <div className="col-span-4 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
                    <div className="p-5 md:p-6 pb-2 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="tracking-tight text-base font-semibold text-slate-800">Harcama Trendi</h3>
                    </div>
                    <div className="p-4 md:p-6 pt-6 pl-2">
                        <OverviewChart data={chartData} />
                    </div>
                </div>

                {/* Right Column: Recent & Categories */}
                <div className="col-span-3 space-y-6 w-full max-w-full overflow-hidden">
                    {/* Top Categories */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 md:p-6 overflow-hidden transition-all hover:shadow-md">
                        <h3 className="font-semibold mb-5 text-base text-slate-800">En Çok Harcanan Kategoriler</h3>
                        {topCategories.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">Veri yok.</p>
                        ) : (
                            <div className="space-y-4">
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
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 md:p-6 overflow-hidden transition-all hover:shadow-md">
                        <h3 className="font-semibold mb-5 text-base text-slate-800">Son Aktiviteler</h3>
                        {recentExpenses.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">Bu dönemde aktivite yok.</p>
                        ) : (
                            <div className="space-y-4">
                                {recentExpenses.map(expense => (
                                    <div key={expense.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 gap-3 group">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                            {expense.merchant ? expense.merchant.substring(0, 1).toUpperCase() : '?'}
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="font-semibold text-sm text-slate-700 truncate group-hover:text-indigo-700 transition-colors">{expense.merchant || 'Bilinmeyen'}</span>
                                            <span className="text-xs text-slate-500 truncate">{new Date(expense.date).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <div className="font-bold text-sm text-slate-800 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-md">
                                            {formatCurrency(Number(expense.amount))}
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
