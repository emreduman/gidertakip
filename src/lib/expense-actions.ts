'use server'

import { parseReceipt } from "@/lib/gemini"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const ExpenseSchema = z.object({
    amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
    currency: z.string(),
    date: z.string(), // DD.MM.YYYY for UI, need conversion
    description: z.string().optional(),
    category: z.string().optional(),
    merchant: z.string().optional(),
    receiptUrl: z.string().optional(),
})

export async function parseReceiptAction(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No file uploaded');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Call Gemini
    try {
        const parsedData = await parseReceipt({
            inlineData: {
                data: base64,
                mimeType: file.type
            }
        });
        return { success: true, data: parsedData };
    } catch (error) {
        console.error("Parse error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to parse receipt." };
    }
}

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

async function uploadFile(file: File): Promise<string | null> {
    if (!file || file.size === 0) return null;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate MIME type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        throw new Error('Geçersiz dosya formatı. Sadece JPG, PNG, WEBP ve PDF yükleyebilirsiniz.');
    }

    // Create unique filename
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    // Ensure directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
        await mkdir(uploadDir, { recursive: true });
    } catch (e) {
        // Ignore if exists
    }

    const path = join(uploadDir, filename);
    console.log(`[DEBUG] Saving file to: ${path}`);
    await writeFile(path, buffer);

    return `/uploads/${filename}`;
}

export async function createExpense(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { message: 'Not authenticated' };
    }

    // Extract fields
    const amount = formData.get('amount')
    const dateStr = formData.get('date') as string // DD.MM.YYYY
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const merchant = formData.get('merchant') as string

    // Check both standard and camera inputs
    const file1 = formData.get('receipt') as File;
    const file2 = formData.get('camera_receipt') as File;
    const receiptFile = (file1 && file1.size > 0) ? file1 : file2;

    const targetUserId = formData.get('targetUserId') as string;

    const warnings = formData.get('warnings') as string;

    // Convert date DD.MM.YYYY to ISO
    const [day, month, year] = dateStr.split('.')
    const isoDate = new Date(`${year}-${month}-${day}`)

    if (isNaN(isoDate.getTime())) {
        return { message: 'Invalid date format. Use DD.MM.YYYY' };
    }

    let userId = session.user.id;
    // Admin Override: Allow creating expense for another user
    if ((session.user.role === 'ADMIN' || session.user.role as string === 'ADMIN') && targetUserId) {
        userId = targetUserId;
    }

    try {
        // Check for Active Period
        // For simplicity, we find a period that covers the expense date. 
        // In a real app, this might be tied to the USER's specific project assignment.
        // Here we just look for ANY active period in the system (or linked to user org if available)

        // We first try to find a period that encompasses the expense date
        const activePeriod = await prisma.period.findFirst({
            where: {
                startDate: { lte: isoDate },
                endDate: { gte: isoDate },
                isActive: true
            }
        });

        if (!activePeriod) {
            return { message: 'Hata: Bu tarih için tanımlı aktif bir dönem bulunamadı.' };
        }

        // DUPLICATE CHECK: Same user, same date, same amount, same merchant
        const existing = await prisma.expense.findFirst({
            where: {
                userId: userId, // Check against the target user
                amount: Number(amount),
                date: isoDate,
                merchant: merchant
            }
        });

        if (existing) {
            return { message: 'Mükerrer Harcama: Bu harcama daha önce sisteme girilmiş.' };
        }

        const receiptUrl = await uploadFile(receiptFile);

        // Server-side Policy Check
        let finalWarnings = warnings || '';
        if (category) {
            const org = await prisma.organization.findFirst({ where: { id: 'default-org' } }); // Simplified for now
            if (org) {
                const policy = await prisma.policy.findUnique({
                    where: { organizationId_category: { organizationId: org.id, category: category } }
                });

                if (policy && Number(amount) > Number(policy.maxAmount)) {
                    const policyWarning = `Limit Aşımı: ${category} için limit ${policy.maxAmount} ${policy.currency}.`;
                    finalWarnings = finalWarnings ? `${finalWarnings}; ${policyWarning}` : policyWarning;
                }
            }
        }

        await prisma.expense.create({
            data: {
                amount: Number(amount),
                date: isoDate,
                category: category,
                description: description,
                merchant: merchant,
                receiptUrl: receiptUrl,
                warnings: finalWarnings || null, // Persist AI warnings + Policy warnings
                user: { connect: { id: userId } }, // Connect via relation
                period: { connect: { id: activePeriod.id } }

            } as any
        })
    } catch (e) {
        console.error("Create expense error:", e)
        return { message: 'Database Error: Failed to Create Expense.' };
    }

    revalidatePath('/dashboard/expenses');
    redirect('/dashboard/expenses');
}

export async function createBulkExpenses(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { message: 'Giriş yapılmamış.' };

    const expensesJson = formData.get('expenses') as string;
    if (!expensesJson) return { message: 'Veri bulunamadı.' };

    let expenses: any[] = [];
    try {
        expenses = JSON.parse(expensesJson);
    } catch (e) {
        return { message: 'Geçersiz veri formatı.' };
    }

    if (!Array.isArray(expenses) || expenses.length === 0) {
        return { message: 'Kaydedilecek harcama bulunamadı.' };
    }

    // Get files - they should represent the expenses in order
    // But FormData.getAll('files') order is browser-dependent? 
    // Usually it preserves append order. We will assume strict index matching for now.
    const files = formData.getAll('files') as File[];

    let savedCount = 0;

    try {
        // Find or create default structure once
        const org = await prisma.organization.upsert({
            where: { id: 'default-org' },
            update: {},
            create: { name: 'Default Organization', id: 'default-org' }
        });

        const project = await prisma.project.upsert({
            where: { id: 'default-project' },
            update: {},
            create: { name: 'Default Project', id: 'default-project', organizationId: org.id }
        });

        const period = await prisma.period.upsert({
            where: { id: 'default-period' },
            update: {},
            create: {
                name: 'Default Period',
                id: 'default-period',
                startDate: new Date(),
                endDate: new Date(),
                projectId: project.id,
                isActive: true
            }
        });

        for (let i = 0; i < expenses.length; i++) {
            const expense = expenses[i];
            const [day, month, year] = expense.date.split('.');
            const isoDate = new Date(`${year}-${month}-${day}`);

            if (isNaN(isoDate.getTime())) continue; // Skip invalid dates

            let receiptUrl = expense.receiptUrl; // Check if already has one (maybe from existing logic?)

            // Upload file if available at index
            if (files[i]) {
                const uploadedPath = await uploadFile(files[i]);
                if (uploadedPath) receiptUrl = uploadedPath;
            }

            await prisma.expense.create({
                data: {
                    amount: Number(expense.amount),
                    date: isoDate,
                    category: expense.category,
                    description: expense.description,
                    merchant: expense.merchant,
                    receiptUrl: receiptUrl,
                    userId: session.user.id,
                    periodId: period.id,
                    status: 'PENDING'
                }
            });
            savedCount++;
        }
    } catch (e) {
        console.error("Bulk create error:", e);
        return { message: 'Veritabanı hatası oluştu.' };
    }

    revalidatePath('/dashboard/expenses');
    return { success: true, count: savedCount };
}

export async function exportExpensesAction(searchParams: { status?: string, month?: string }) {
    const session = await auth();
    if (!session?.user?.id) return { message: 'Not authenticated' };

    const where: any = { userId: session.user.id };

    if (searchParams.status && searchParams.status !== 'ALL') {
        where.status = searchParams.status;
    }

    if (searchParams.month) {
        const [year, month] = searchParams.month.split('-').map(Number);
        if (year && month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            where.date = { gte: startDate, lte: endDate };
        }
    }

    const expenses = await prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' }
    });

    // Generate CSV
    const header = "Date,Merchant,Category,Amount,Currency,Status,Description\n";
    const rows = expenses.map(e => {
        const expense = e as any;
        const date = expense.date.toISOString().split('T')[0];
        const description = (expense.description || '').replace(/"/g, '""'); // Escape quotes
        return `${date},"${expense.merchant || ''}","${expense.category || ''}",${expense.amount},"TRY",${expense.status},"${description}"`;
    }).join("\n");

    return { csv: header + rows, filename: `expenses-${new Date().toISOString().split('T')[0]}.csv` };
}

export async function deleteExpense(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { message: 'Not authenticated', success: false };

    try {
        const expense = await prisma.expense.findUnique({ where: { id } });
        if (!expense) return { message: 'Harcama bulunamadı', success: false };

        // Permission check: Owner or Admin
        if (expense.userId !== session.user.id && session.user.role !== 'ADMIN') {
            return { message: 'Yetkisiz işlem', success: false };
        }

        // Status check: Block if APPROVED or PAID
        if (expense.status === 'APPROVED' || (expense.status as string) === 'PAID') {
            return { message: 'Onaylanmış harcamalar silinemez.', success: false };
        }

        await prisma.expense.delete({ where: { id } });

        revalidatePath('/dashboard/expenses');
        return { success: true, message: 'Harcama silindi' };
    } catch (e) {
        console.error("Delete expense error:", e);
        return { message: 'Silme işlemi başarısız', success: false };
    }
}

export async function updateExpense(id: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { message: 'Not authenticated', success: false };

    // Extract fields similar to create
    const amount = formData.get('amount');
    const dateStr = formData.get('date') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const merchant = formData.get('merchant') as string;

    // Convert date
    const [day, month, year] = dateStr.split('.');
    const isoDate = new Date(`${year}-${month}-${day}`);
    if (isNaN(isoDate.getTime())) return { message: 'Geçersiz tarih', success: false };

    try {
        const expense = await prisma.expense.findUnique({ where: { id } });
        if (!expense) return { message: 'Harcama bulunamadı', success: false };

        if (expense.userId !== session.user.id && session.user.role !== 'ADMIN') {
            return { message: 'Yetkisiz işlem', success: false };
        }

        if (expense.status === 'APPROVED') {
            return { message: 'Onaylanmış harcamalar düzenlenemez.', success: false };
        }

        await prisma.expense.update({
            where: { id },
            data: {
                amount: Number(amount),
                date: isoDate,
                category,
                description,
                merchant
            }
        });

        revalidatePath('/dashboard/expenses');
        return { success: true, message: 'Harcama güncellendi' };
    } catch (e) {
        console.error("Update expense error:", e);
        return { message: 'Güncelleme başarısız', success: false };
    }
}
