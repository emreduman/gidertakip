import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, CreditCard, CheckCircle, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react"

interface KPIProps {
    totalSpend: number;
    pendingAmount: number;
    approvedAmount: number;
    rejectedAmount: number;
    percentageChange?: number;
}

export function KPICards({ totalSpend, pendingAmount, approvedAmount, rejectedAmount, percentageChange = 0 }: KPIProps) {
    const isIncrease = percentageChange > 0;
    const isNeutral = percentageChange === 0;
    const colorClass = isNeutral ? 'text-gray-500' : (isIncrease ? 'text-red-500' : 'text-green-500'); // Increase in expense = Red
    const Icon = isNeutral ? null : (isIncrease ? ArrowUpRight : ArrowDownRight);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-all group-hover:bg-blue-500/10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-semibold text-slate-600">Toplam Harcama</CardTitle>
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                        <Wallet className="h-4 w-4 text-blue-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <span className={`${colorClass} flex items-center mr-1`}>
                            {Icon && <Icon className="h-3 w-3 mr-1" />} %{Math.abs(percentageChange).toFixed(1)}
                        </span>
                        geçen döneme göre
                    </p>
                </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-all group-hover:bg-green-500/10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-semibold text-slate-600">Onaylanan</CardTitle>
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-green-50 transition-colors">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(approvedAmount)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Ödemesi yapılacak
                    </p>
                </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-all group-hover:bg-amber-500/10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-semibold text-slate-600">Bekleyen</CardTitle>
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-amber-50 transition-colors">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Onay bekliyor
                    </p>
                </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-all group-hover:bg-red-500/10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-semibold text-slate-600">Reddedilen</CardTitle>
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-red-50 transition-colors">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(rejectedAmount)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        İade edilmeyecek
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
