'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { notifyAdmins, notifyUser } from "@/lib/notification-service";

export async function testPing() {
    console.log("Ping received on server");
    return { success: true, message: "PONG" };
}

export async function _deprecated_createExpenseForm(formData: FormData) {
    try {
        const session = await auth();
        console.log("[SERVER_ACTION] createExpenseForm Triggered");

        if (!session?.user?.id) {
            console.log("[SERVER_ACTION] Unauthorized");
            return { message: 'Unauthorized', success: false };
        }

        const expenseIds = formData.getAll('expenseIds') as string[];
        console.log("[SERVER_ACTION] Expense IDs:", expenseIds);

        const title = formData.get('title') as string || `Masraf Formu - ${new Date().toLocaleDateString('tr-TR')}`;
        const location = formData.get('location') as string;
        const receiptsDelivered = formData.get('receiptsDelivered') === 'on';
        const infoVerified = formData.get('infoVerified') === 'on';

        if (!expenseIds.length) {
            console.log("[SERVER_ACTION] No expenses selected");
            return { message: 'Seçili masraf yok', success: false };
        }

        if (!infoVerified) {
            console.log("[SERVER_ACTION] Info not verified");
            return { message: 'Bilgilerin doğruluğunu onaylamanız gerekmektedir.', success: false };
        }

        // Calculate total
        const expenses = await prisma.expense.findMany({
            where: { id: { in: expenseIds }, userId: session.user.id }
        });

        const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        console.log("[SERVER_ACTION] Total Amount:", totalAmount);

        // Transaction
        const createdFormId = await prisma.$transaction(async (tx) => {
            const form = await tx.expenseForm.create({
                data: {
                    userId: session.user.id,
                    title: title,
                    totalAmount: totalAmount,
                    location: location,
                    receiptsDelivered: receiptsDelivered,
                    infoVerified: infoVerified,
                    expenses: {
                        connect: expenseIds.map(id => ({ id }))
                    }
                }
            });

            await tx.expense.updateMany({
                where: { id: { in: expenseIds } },
                data: { status: 'SUBMITTED' }
            });

            return form.id;
        });

        console.log("[SERVER_ACTION] Transaction Success. Form ID:", createdFormId);

        // Send Notification
        try {
            await notifyAdmins(
                'Yeni Masraf Formu',
                `${session.user.name || session.user.email} yeni bir masraf formu oluşturdu: ${title}`,
                `/dashboard/accounting/${createdFormId}`
            );
        } catch (notifyErr) {
            console.error("[SERVER_ACTION] Notification Error (Non-fatal):", notifyErr);
        }

        // Gamification
        try {
            // Basic update to avoid schema mismatch issues during debug
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            if (user) {
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { lastSubmissionDate: new Date() }
                });
            }
        } catch (gameErr) {
            console.error("[SERVER_ACTION] Gamification Error (Non-fatal):", gameErr);
        }

        revalidatePath('/dashboard/forms');
        revalidatePath('/dashboard/expenses');

        console.log("[SERVER_ACTION] Returning Success");
        return { success: true, formId: createdFormId };

    } catch (e) {
        console.error("[SERVER_ACTION] Critical Error:", e);
        return { message: 'Sunucu hatası oluştu', success: false, error: String(e) };
    }
}

export async function approveForm(formId: string) {
    const session = await auth();
    const role = session?.user?.role;

    if (role !== 'ADMIN' && role !== 'ACCOUNTANT' && role !== 'COORDINATOR') {
        throw new Error('Yetkisiz işlem: Sadece Admin ve Muhasebeci onaylayabilir.');
    }

    await prisma.$transaction(async (tx) => {
        await tx.expenseForm.update({
            where: { id: formId },
            data: { status: 'APPROVED', processedAt: new Date() }
        });

        await tx.expense.updateMany({
            where: { expenseFormId: formId },
            data: { status: 'APPROVED' }
        });
    });

    // Notify User
    const form = await prisma.expenseForm.findUnique({ where: { id: formId }, include: { user: true } });
    if (form) {
        await notifyUser(
            form.userId,
            'Form Onaylandı',
            `Masraf formunuz onaylandı: ${form.title}`,
            'SUCCESS',
            `/dashboard/forms/${form.id}`
        );
    }

    revalidatePath('/dashboard/accounting');
    revalidatePath('/dashboard/expenses');
}

export async function rejectForm(formId: string, reason: string) {
    const session = await auth();
    const role = session?.user?.role;

    if (role !== 'ADMIN' && role !== 'ACCOUNTANT' && role !== 'COORDINATOR') {
        throw new Error('Yetkisiz işlem: Sadece Admin ve Muhasebeci reddedebilir.');
    }

    // Check permissions (Accountant/Admin) - TODO
    await prisma.$transaction(async (tx) => {
        await tx.expenseForm.update({
            where: { id: formId },
            data: { status: 'REJECTED', rejectionReason: reason, processedAt: new Date() }
        });

        await tx.expense.updateMany({
            where: { expenseFormId: formId },
            data: { status: 'REJECTED', rejectionReason: reason }
        });
    });

    // Notify User
    const form = await prisma.expenseForm.findUnique({ where: { id: formId }, include: { user: true } });
    if (form) {
        await notifyUser(
            form.userId,
            'Form Reddedildi',
            `Masraf formunuz reddedildi: ${form.title}. Sebep: ${reason}`,
            'ERROR',
            `/dashboard/forms/${form.id}`
        );
    }

    revalidatePath('/dashboard/accounting');
    revalidatePath('/dashboard/expenses');
}

export async function getFormDetails(formId: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const form = await prisma.expenseForm.findUnique({
        where: { id: formId },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    iban: true,
                    bankName: true,
                    bankBranch: true,
                    accountHolder: true,
                    phone: true,
                    role: true,
                    organization: { select: { name: true } }
                }
            },
            expenses: {
                include: {
                    period: {
                        select: {
                            name: true,
                            project: {
                                select: {
                                    name: true,
                                    organization: { select: { name: true } }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!form) return null;

    // Authorization: Owner or Admin/Accountant
    const isOwner = form.userId === session.user.id;
    const isStaff = session.user.role === 'ADMIN' || session.user.role === 'ACCOUNTANT' || session.user.role === 'COORDINATOR';

    if (!isOwner && !isStaff) {
        return null;
    }

    // ... existing code ...
    // Serialize dates
    return JSON.parse(JSON.stringify(form));
}

export async function deleteForm(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { message: 'Not authenticated', success: false };

    try {
        const form = await prisma.expenseForm.findUnique({ where: { id } });
        if (!form) return { message: 'Form bulunamadı', success: false };

        // Permission: Owner or Admin
        const isOwner = form.userId === session.user.id;
        const isAdmin = session.user.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            return { message: 'Yetkisiz işlem', success: false };
        }

        // Status Check: Can only delete SUBMITTED or REJECTED
        if (form.status === 'APPROVED' || (form.status as string) === 'PAID') {
            return { message: 'Onaylanmış formlar silinemez.', success: false };
        }

        // Transaction: Delete form, set expenses back to PENDING, remove from form
        await prisma.$transaction(async (tx) => {
            // unlink expenses
            await tx.expense.updateMany({
                where: { expenseFormId: id },
                data: {
                    status: 'PENDING',
                    expenseFormId: null,
                    rejectionReason: null // Clear rejection history if any
                }
            });

            // delete form
            await tx.expenseForm.delete({ where: { id } });
        });

        revalidatePath('/dashboard/forms');
        revalidatePath('/dashboard/accounting');
        revalidatePath('/dashboard/expenses');
        return { success: true, message: 'Form silindi ve harcamalar havuza aktarıldı.' };

    } catch (e) {
        console.error("Delete form error:", e);
        return { message: 'Form silinirken hata oluştu.', success: false };
    }
}
