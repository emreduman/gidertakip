import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string) {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return '0,00 ₺';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(value);
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Yönetici',
  COORDINATOR: 'Koordinatör',
  ACCOUNTANT: 'Muhasebeci',
  VOLUNTEER: 'Gönüllü',
  BUSINESS_DEV: 'İş Geliştirme ve Satış Uzmanı',
  IT_SPECIALIST: 'Bilgi Teknolojileri Uzmanı',
  RD_SPECIALIST: 'Deneyimsel Öğrenme Ar-Ge Uzmanı',
  OWNER: 'Şirket Sahibi'
};
