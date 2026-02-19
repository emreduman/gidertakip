'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { FilterX } from 'lucide-react';

export function DashboardFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get current values
    const currentYear = searchParams.get('year') || new Date().getFullYear().toString();
    const currentPeriod = searchParams.get('period') || 'all';

    const handleYearChange = (year: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('year', year);
        router.push(`?${params.toString()}`);
    };

    const handlePeriodChange = (period: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('period', period);
        router.push(`?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push('/dashboard');
    };

    const years = [2024, 2025, 2026, 2027]; // You could generate this dynamically

    return (
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border shadow-sm mb-4 overflow-x-auto no-scrollbar">
            <span className="text-sm font-medium text-gray-500 ml-2 shrink-0">Filtrele:</span>

            <Select value={currentYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[100px] h-9">
                    <SelectValue placeholder="Yıl" />
                </SelectTrigger>
                <SelectContent>
                    {years.map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={currentPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Dönem" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tüm Yıl</SelectItem>
                    <SelectItem value="Q1">1. Çeyrek (Oca-Mar)</SelectItem>
                    <SelectItem value="Q2">2. Çeyrek (Nis-Haz)</SelectItem>
                    <SelectItem value="Q3">3. Çeyrek (Tem-Eyl)</SelectItem>
                    <SelectItem value="Q4">4. Çeyrek (Eki-Ara)</SelectItem>
                    <SelectItem value="H1">İlk 6 Ay</SelectItem>
                    <SelectItem value="H2">Son 6 Ay</SelectItem>
                </SelectContent>
            </Select>

            {(currentPeriod !== 'all' || currentYear !== new Date().getFullYear().toString()) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-gray-500 shrink-0">
                    <FilterX className="w-4 h-4 mr-1" />
                    Temizle
                </Button>
            )}
        </div>
    );
}
