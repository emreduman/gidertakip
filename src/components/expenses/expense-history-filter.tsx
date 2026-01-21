'use client'

import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function ExpenseHistoryFilter() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value && value !== 'ALL') {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        replace(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border rounded-lg shadow-sm">
            <div className="w-full sm:w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Durum Filtresi</label>
                <select
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={searchParams.get('status') || "ALL"}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                    <option value="ALL">Tümü</option>
                    <option value="PENDING">Bekleyen</option>
                    <option value="SUBMITTED">Formda</option>
                    <option value="APPROVED">Onaylandı</option>
                    <option value="REJECTED">Reddedildi</option>
                </select>
            </div>

            <div className="w-full sm:w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Dönem Filtresi</label>
                <select
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={searchParams.get('month') || ""}
                    onChange={(e) => handleFilterChange('month', e.target.value)}
                >
                    <option value="">Tüm Zamanlar</option>
                    <option value="2026-01">Ocak 2026</option>
                    <option value="2026-02">Şubat 2026</option>
                    <option value="2026-03">Mart 2026</option>
                </select>
            </div>
        </div>
    )
}
