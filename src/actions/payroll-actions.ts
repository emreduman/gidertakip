"use server"

import { PrismaClient, Employee, Payroll } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { calculatePayroll } from "@/lib/payroll-utils"

export async function getEmployees() {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!orgId) return []

  return await prisma.employee.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" }
  })
}

export async function createEmployee(data: {
  firstName: string
  lastName: string
  tcNo?: string
  ssnNo?: string
  grossSalary: number
  department?: string
  jobTitle?: string
}) {
  try {
    const session = await auth()
    const orgId = (session?.user as any)?.organizationId
    if (!orgId) return { success: false, error: "Yetki veya organizasyon bulunamadı." }

    const netSalary = calculatePayroll(data.grossSalary).netSalary

    const employee = await prisma.employee.create({
      data: {
        ...data,
        organizationId: orgId,
        netSalary
      }
    })

    revalidatePath("/dashboard/personnel")
    return { success: true, employee }
  } catch (error: any) {
    console.error("CREATE_EMPLOYEE_ERROR:", error)
    if (error?.code === "P2021") {
       return { success: false, error: "Veritabanı tabloları eksik. Lütfen terminalden 'npx prisma db push' komutunu çalıştırın." }
    }
    return { success: false, error: error?.message || "Bilinmeyen bir veritabanı hatası oluştu." }
  }
}

export async function deleteEmployee(id: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!orgId) throw new Error("Unauthorized")

  const result = await prisma.employee.delete({
    where: { 
      id,
      organizationId: orgId
    }
  })
  revalidatePath("/dashboard/personnel")
  return result
}

export async function generatePayrollForEmployee(employeeId: string, month: number, year: number, periodId?: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!orgId) throw new Error("Unauthorized")

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId }
  })

  if (!employee || employee.organizationId !== orgId) {
    throw new Error("Employee not found")
  }

  const calc = calculatePayroll(Number(employee.grossSalary))

  const payroll = await prisma.payroll.create({
    data: {
      employeeId: employee.id,
      month,
      year,
      periodId,
      grossSalary: calc.grossSalary,
      sgkEmployeePool: calc.sgkEmployeePool,
      unemploymentEmployeePool: calc.unemploymentEmployeePool,
      incomeTaxBase: calc.incomeTaxBase,
      incomeTax: calc.incomeTax,
      stampTax: calc.stampTax,
      netSalary: calc.netSalary,
      sgkEmployerPool: calc.sgkEmployerPool,
      unemploymentEmployerPool: calc.unemploymentEmployerPool,
      employerTotalCost: calc.employerTotalCost
    }
  })
  
  revalidatePath("/dashboard/personnel")
  return payroll
}

export async function getPayrolls(month?: number, year?: number) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!orgId) return []

  return await prisma.payroll.findMany({
    where: {
      employee: {
        organizationId: orgId
      },
      ...(month ? { month } : {}),
      ...(year ? { year } : {})
    },
    include: {
      employee: true
    },
    orderBy: [
      { year: "desc" },
      { month: "desc" }
    ]
  })
}
