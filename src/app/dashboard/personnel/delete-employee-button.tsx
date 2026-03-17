"use client"

import { deleteEmployee } from "@/actions/payroll-actions"
import { TrashIcon } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

export function DeleteEmployeeButton({ id, name }: { id: string, name: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => {
        if (!confirm(`${name} isimli personeli silmek istediğinize emin misiniz?`)) return
        startTransition(async () => {
          try {
            await deleteEmployee(id)
            toast.success("Personel silindi")
          } catch (error) {
            toast.error("Bir hata oluştu")
          }
        })
      }}
      disabled={isPending}
      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
      title="Sil"
    >
      <TrashIcon className="w-5 h-5" />
    </button>
  )
}
