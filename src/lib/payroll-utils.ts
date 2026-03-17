// 2024/2025 Standard Parameters (Simplified)
const MIN_WAGE_GROSS = 20002.50 // 2024 value
const SGK_EMPLOYEE_RATE = 0.14
const UNEMPLOYMENT_EMPLOYEE_RATE = 0.01
const SGK_EMPLOYER_RATE = 0.205 // 20.5% standard without 5 point discount
const UNEMPLOYMENT_EMPLOYER_RATE = 0.02
const STAMP_TAX_RATE = 0.00759
const INCOME_TAX_RATE_TIER1 = 0.15 // First tier for simplicity

export interface PayrollResult {
  grossSalary: number
  sgkEmployeePool: number
  unemploymentEmployeePool: number
  incomeTaxBase: number
  incomeTax: number
  stampTax: number
  netSalary: number
  sgkEmployerPool: number
  unemploymentEmployerPool: number
  employerTotalCost: number
}

export function calculatePayroll(grossSalary: number, applyMinWageExemption = true): PayrollResult {
  const sgkEmployeePool = grossSalary * SGK_EMPLOYEE_RATE
  const unemploymentEmployeePool = grossSalary * UNEMPLOYMENT_EMPLOYEE_RATE
  
  const incomeTaxBase = grossSalary - sgkEmployeePool - unemploymentEmployeePool
  let incomeTax = incomeTaxBase * INCOME_TAX_RATE_TIER1
  let stampTax = grossSalary * STAMP_TAX_RATE

  // Min wage exemption (Asgari ücret istisnası)
  if (applyMinWageExemption && grossSalary >= MIN_WAGE_GROSS) {
    const minWageSgk = MIN_WAGE_GROSS * SGK_EMPLOYEE_RATE
    const minWageUnemp = MIN_WAGE_GROSS * UNEMPLOYMENT_EMPLOYEE_RATE
    const minWageIncomeTaxBase = MIN_WAGE_GROSS - minWageSgk - minWageUnemp
    const minWageIncomeTax = minWageIncomeTaxBase * INCOME_TAX_RATE_TIER1
    const minWageStampTax = MIN_WAGE_GROSS * STAMP_TAX_RATE
    
    incomeTax = Math.max(0, incomeTax - minWageIncomeTax)
    stampTax = Math.max(0, stampTax - minWageStampTax)
  }

  const netSalary = grossSalary - sgkEmployeePool - unemploymentEmployeePool - incomeTax - stampTax
  
  const sgkEmployerPool = grossSalary * SGK_EMPLOYER_RATE
  const unemploymentEmployerPool = grossSalary * UNEMPLOYMENT_EMPLOYER_RATE
  
  const employerTotalCost = grossSalary + sgkEmployerPool + unemploymentEmployerPool

  return {
    grossSalary,
    sgkEmployeePool,
    unemploymentEmployeePool,
    incomeTaxBase,
    incomeTax,
    stampTax,
    netSalary,
    sgkEmployerPool,
    unemploymentEmployerPool,
    employerTotalCost
  }
}
