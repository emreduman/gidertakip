'use client';

import { Progress } from "@/components/ui/progress"

interface BudgetProgressProps {
    periodName: string;
    targetBudget: number;
    currentSpend: number;
    currency?: string;
}

export function BudgetProgress({ periodName, targetBudget, currentSpend, currency = 'TL' }: BudgetProgressProps) {
    if (!targetBudget || targetBudget <= 0) return null;

    const percentage = Math.min(100, Math.round((currentSpend / targetBudget) * 100));
    const isOverBudget = currentSpend > targetBudget;
    const isNearBudget = percentage >= 80 && !isOverBudget;
    const remainingAmount = targetBudget - currentSpend;

    let progressColor = "bg-green-500";
    if (isOverBudget) {
        progressColor = "bg-red-500";
    } else if (isNearBudget) {
        progressColor = "bg-yellow-500";
    }

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-sm font-semibold text-gray-800">{periodName} Bütçesi</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Kalan: <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                            {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(remainingAmount)} {currency}
                        </span>
                    </p>
                </div>
                <div className="text-right">
                    <span className={isOverBudget ? "text-red-600 font-bold" : "text-gray-900 font-medium"}>
                        {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(currentSpend)}
                    </span>
                    <span className="text-gray-500 text-sm"> / {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(targetBudget)} {currency}</span>
                </div>
            </div>

            <div className="relative pt-1">
                <div className="overflow-hidden h-2.5 mb-2 text-xs flex rounded-full bg-gray-100">
                    <div
                        style={{ width: `${percentage}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${progressColor}`}
                    ></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-medium text-gray-500">%0</span>
                    <span className="text-xs font-bold text-gray-700">%{percentage} Kullanıldı</span>
                    <span className="text-xs font-medium text-gray-500">%100</span>
                </div>
            </div>

            {isOverBudget && (
                <div className="bg-red-50 text-red-700 p-2.5 rounded-md text-xs font-medium flex gap-2 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                    Bütçe {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(Math.abs(remainingAmount))} {currency} aşıldı! Harcamalarınızı gözden geçirin.
                </div>
            )}
            {isNearBudget && (
                <div className="bg-yellow-50 text-yellow-700 p-2.5 rounded-md text-xs font-medium flex gap-2 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                    Bütçe limitine yaklaşıldı. Lütfen dikkatli harcayın.
                </div>
            )}
            {!isOverBudget && !isNearBudget && (
                <div className="bg-green-50 text-green-700 p-2 rounded-md text-xs font-medium flex gap-2 items-center opacity-80">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                    Bütçe durumu ideal.
                </div>
            )}
        </div>
    );
}
