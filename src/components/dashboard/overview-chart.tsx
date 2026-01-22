'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useEffect, useState } from 'react';

interface OverviewChartProps {
    data: { name: string; total: number }[];
}

export function OverviewChart({ data }: OverviewChartProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-[350px] w-full flex items-center justify-center bg-gray-50 text-gray-400">Yükleniyor...</div>;
    }

    if (!data || data.length === 0) {
        return <div className="h-[350px] w-full flex items-center justify-center bg-gray-50 text-gray-400">Veri bulunamadı</div>;
    }

    return (
        <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        minTickGap={10}
                        tickFormatter={(value: any) => String(value).slice(0, 3)}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={40} // Reserve consistent width
                        tickFormatter={(value) => `₺${value}`}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`₺${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 'Toplam Harcama']}
                    />
                    <Bar
                        dataKey="total"
                        fill="#0ea5e9"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
