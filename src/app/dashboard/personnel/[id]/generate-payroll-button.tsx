"use client"

import { generatePayrollForEmployee } from "@/actions/payroll-actions"
import { CalculatorIcon } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

export function GeneratePayrollButton({ employeeId }: { employeeId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => {
        const d = new Date()
        const month = d.getMonth() + 1
        const year = d.getFullYear()
        
        startTransition(async () => {
          try {
            await generatePayrollForEmployee(employeeId, month, year)
            toast.success("Maaş bordrosu oluşturuldu ve hesaplara işlendi.")
          } catch (error) {
            toast.error("Bordro oluşturulurken bir hata oluştu")
          }
        })
      }}
      disabled={isPending}
      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50"
    >
      <CalculatorIcon className="w-5 h-5" />
      {isPending ? "Hesaplanıyor..." : "Bu Ayın Bordrosunu Kes"}
    </button>
  )
}
