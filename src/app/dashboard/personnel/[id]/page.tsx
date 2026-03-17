import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { formatCurrency } from "@/lib/utils"
import { calculatePayroll } from "@/lib/payroll-utils"
import { ArrowLeftIcon, UserCircleIcon, FileTextIcon, CalculatorIcon, BriefcaseIcon } from "lucide-react"
import Link from "next/link"
import { GeneratePayrollButton } from "./generate-payroll-button"

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!orgId) return notFound()

  const employee = await prisma.employee.findUnique({
    where: { 
      id: params.id,
      organizationId: orgId
    },
    include: {
      payrolls: {
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ]
      }
    }
  })

  if (!employee) return notFound()

  // Calculate current params using the utility action
  const calc = calculatePayroll(Number(employee.grossSalary))

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
      <Link href="/dashboard/personnel" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors">
        <ArrowLeftIcon className="w-4 h-4" />
        Personel Listesine Dön
      </Link>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-200">
             {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
           </div>
           <div>
             <h1 className="text-3xl font-bold text-slate-900">{employee.firstName} {employee.lastName}</h1>
             <p className="text-slate-500 flex items-center gap-2 text-sm mt-1">
               <BriefcaseIcon className="w-4 h-4" />
               {employee.department || 'Departman'} • {employee.jobTitle || 'Unvan'}
             </p>
           </div>
        </div>
        
        <GeneratePayrollButton employeeId={employee.id} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Salary Calc Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <CalculatorIcon className="w-5 h-5 text-indigo-500" />
            Güncel Maaş Hesaplama <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full ml-auto">Simülasyon</span>
          </h2>
          
          <div className="space-y-4">
             <div className="flex justify-between items-center py-2 border-b border-slate-100">
               <span className="text-slate-600">Brüt Maaş</span>
               <span className="font-semibold text-slate-900">{formatCurrency(calc.grossSalary)}</span>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2 mb-2">Çalışan Kesintileri</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">SGK (%14)</span>
                      <span className="text-red-500 font-medium">- {formatCurrency(calc.sgkEmployeePool)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">İşsizlik (%1)</span>
                      <span className="text-red-500 font-medium">- {formatCurrency(calc.unemploymentEmployeePool)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gelir Vergisi</span>
                      <span className="text-red-500 font-medium">- {formatCurrency(calc.incomeTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Damga Vergisi</span>
                      <span className="text-red-500 font-medium">- {formatCurrency(calc.stampTax)}</span>
                    </div>
                  </div>
               </div>

               <div>
                 <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2 mb-2">İşveren Maliyeti</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">SGK (%20.5)</span>
                      <span className="text-orange-600 font-medium">{formatCurrency(calc.sgkEmployerPool)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">İşsizlik (%2)</span>
                      <span className="text-orange-600 font-medium">{formatCurrency(calc.unemploymentEmployerPool)}</span>
                    </div>
                  </div>
               </div>
             </div>

             <div className="pt-4 border-t border-slate-200 flex justify-between items-center bg-teal-50 p-3 rounded-xl border border-teal-100 mt-4">
               <span className="text-teal-900 font-bold">Net Ele Geçen Maaş</span>
               <span className="text-xl font-black text-teal-700">{formatCurrency(calc.netSalary)}</span>
             </div>

             <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-xl border border-indigo-100">
               <span className="text-indigo-900 font-bold">İşverene Toplam Maliyet</span>
               <span className="text-lg font-bold text-indigo-700">{formatCurrency(calc.employerTotalCost)}</span>
             </div>
          </div>
        </div>

        {/* History / Previous payrolls */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
           <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
             <FileTextIcon className="w-5 h-5 text-indigo-500" />
             Bordro Geçmişi
           </h2>
           
           {employee.payrolls.length === 0 ? (
             <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileTextIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Henüz bordro oluşturulmamış.</p>
             </div>
           ) : (
             <div className="space-y-3">
               {employee.payrolls.map((payroll) => (
                 <div key={payroll.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50 hover:bg-slate-50/50 transition-colors">
                   <div>
                     <p className="font-bold text-slate-800">{payroll.month}. Ay / {payroll.year}</p>
                     <p className="text-xs text-slate-500">Maliyet: {formatCurrency(Number(payroll.employerTotalCost))}</p>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-teal-600">{formatCurrency(Number(payroll.netSalary))}</p>
                     <p className="text-xs text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded font-medium mt-1">Özet Detay</p>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
