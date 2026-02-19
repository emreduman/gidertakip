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
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Harcama</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
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

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Onaylanan</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(approvedAmount)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Ödemesi yapılacak
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
                    <CreditCard className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Onay bekliyor
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reddedilen</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-500" />
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
