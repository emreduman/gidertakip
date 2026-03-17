import { getPayrolls } from "@/actions/payroll-actions"
import { CalculatorIcon, BriefcaseIcon, CalendarIcon, ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

export const metadata = {
  title: "Geçmiş Bordrolar | GiderTakip",
  description: "Tüm geçmiş personel maaş ve prim bordroları.",
}

export default async function PayrollsPage() {
  const payrolls = await getPayrolls()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Link href="/dashboard/personnel" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors mb-2">
        <ArrowLeftIcon className="w-4 h-4" />
        Personel Listesine Dön
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalculatorIcon className="w-8 h-8 text-indigo-600" />
            Geçmiş Bordrolar
          </h2>
          <p className="text-muted-foreground mt-1">
            Şirketinizde işlenen tüm maaş, SGK ve vergi hesabı bordro geçmişleri.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {payrolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
              <CalculatorIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Hiç Bordro Yok</h3>
            <p className="text-slate-500 max-w-sm">
              Personel detay sayfasından bordro kesimi yaptığınızda geçmiş kayıtlar burada listelenecektir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Dönem</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Personel</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Brüt Maaş</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">SGK İşçi Payı</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Vergiler</th>
                  <th className="px-6 py-4 text-sm font-semibold text-teal-700 text-right">Net Ödenen</th>
                  <th className="px-6 py-4 text-sm font-semibold text-indigo-700 text-right">İşveren Maliyeti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center gap-2">
                         <CalendarIcon className="w-4 h-4 text-slate-400" />
                         <span className="font-bold text-slate-700">{payroll.month}. Ay / {payroll.year}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BriefcaseIcon className="w-4 h-4 text-slate-400" />
                        <Link href={`/dashboard/personnel/${payroll.employeeId}`} className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                          {payroll.employee.firstName} {payroll.employee.lastName}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex font-medium text-slate-700">
                        {formatCurrency(Number(payroll.grossSalary))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 text-sm">
                       {formatCurrency(Number(payroll.sgkEmployeePool) + Number(payroll.unemploymentEmployeePool))}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 text-sm">
                       {formatCurrency(Number(payroll.incomeTax) + Number(payroll.stampTax))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex font-bold text-teal-700">
                        {formatCurrency(Number(payroll.netSalary || 0))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex font-bold text-indigo-700">
                        {formatCurrency(Number(payroll.employerTotalCost || 0))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
