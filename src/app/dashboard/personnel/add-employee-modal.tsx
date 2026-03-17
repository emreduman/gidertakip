"use client"

import { useState, useTransition } from "react"
import { createEmployee } from "@/actions/payroll-actions"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import * as Dialog from "@radix-ui/react-dialog"

export function AddEmployeeModal() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    tcNo: "",
    ssnNo: "",
    grossSalary: "",
    department: "",
    jobTitle: ""
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const result = await createEmployee({
          ...formData,
          grossSalary: Number(formData.grossSalary) || 0
        })
        
        if (result?.success === false) {
           toast.error(result.error || "Kayıt sırasında bir hata oluştu.")
           return
        }

        toast.success("Personel başarıyla kaydedildi!")
        setOpen(false)
        setFormData({
            firstName: "",
            lastName: "",
            tcNo: "",
            ssnNo: "",
            grossSalary: "",
            department: "",
            jobTitle: ""
        })
      } catch (error: any) {
        toast.error(error?.message || "Beklenmeyen bir hata oluştu")
        console.error("Personel kayıt hatası:", error)
      }
    })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-indigo-200">
          <PlusIcon className="w-4 h-4" />
          Yeni Personel Ekle
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl z-50 p-6 md:p-8 outline-none">
          <Dialog.Title className="text-xl font-bold text-slate-900 mb-2">
            Yeni Personel Ekle
          </Dialog.Title>
          <Dialog.Description className="text-sm text-slate-500 mb-6">
            Personelin maaş ve SGK prim hesaplamaları için brüt maaş değerini girmeyi unutmayın.
          </Dialog.Description>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Ad</label>
                <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ahmet" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Soyad</label>
                <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Yılmaz" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">TC Kimlik No</label>
                <input name="tcNo" value={formData.tcNo} onChange={handleChange} maxLength={11} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="11111111111" />
              </div>
               <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">SGK Sicil No</label>
                <input name="ssnNo" value={formData.ssnNo} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="0101XXXXXXXXX" />
              </div>
            </div>
            
            <div className="space-y-1.5">
               <label className="text-sm font-medium text-slate-700">Brüt Maaş (TL)</label>
               <input required type="number" step="0.01" min="0" name="grossSalary" value={formData.grossSalary} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-indigo-700 bg-indigo-50" placeholder="20002.50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Departman</label>
                <input name="department" value={formData.department} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Yazılım" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Unvan</label>
                <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Kıdemli Geliştirici" />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button type="button" className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                  İptal
                </button>
              </Dialog.Close>
              <button disabled={isPending} type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {isPending ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
