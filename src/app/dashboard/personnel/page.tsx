import { getEmployees } from "@/actions/payroll-actions"
import { PlusIcon, BriefcaseIcon, UserCircleIcon, TrashIcon, CalculatorIcon } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { DeleteEmployeeButton } from "./delete-employee-button"
import { AddEmployeeModal } from "./add-employee-modal"

export const metadata = {
  title: "Personel & Bordro | GiderTakip",
  description: "Organizasyon personeli ve maaş/bordro yönetimi.",
}

export default async function PersonnelPage() {
  const employees = await getEmployees()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BriefcaseIcon className="w-8 h-8 text-indigo-600" />
            Personel Yönetimi
          </h2>
          <p className="text-muted-foreground mt-1">
            Çalışanlarınızı, maaşlarını ve vergi/SGK yükümlülüklerini buradan yönetin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href="/dashboard/personnel/payroll"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-200"
          >
            <CalculatorIcon className="w-4 h-4" />
            Geçmiş Bordrolar
          </Link>
          <AddEmployeeModal />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <UserCircleIcon className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Henüz Personel Eklenmemiş</h3>
            <p className="text-slate-500 max-w-sm">
              Maaş ve SGK prim hesaplamaları yapabilmek için önce sisteme çalışan ekleyin.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Personel</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Departman & Unvan</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Brüt Maaş</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Net Maaş</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-slate-500">TC: {emp.tcNo || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{emp.jobTitle || '-'}</p>
                      <p className="text-xs text-slate-500">{emp.department || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex font-medium text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                        {formatCurrency(Number(emp.grossSalary))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                        {formatCurrency(Number(emp.netSalary || 0))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                           href={`/dashboard/personnel/${emp.id}`}
                           className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                        >
                          Detay & Hesapla
                        </Link>
                        <DeleteEmployeeButton id={emp.id} name={`${emp.firstName} ${emp.lastName}`} />
                      </div>
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
