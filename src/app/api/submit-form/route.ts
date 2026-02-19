import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notification-service";
// import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized', success: false }, { status: 401 });
        }

        const data = await req.json(); // Use JSON body parsing
        const expenseIds = data.expenseIds as string[] || [];
        const title = data.title as string || `Masraf Formu - ${new Date().toLocaleDateString('tr-TR')}`;
        const location = data.location as string || 'Konum belirtilmedi';
        const receiptsDelivered = data.receiptsDelivered === 'on' || data.receiptsDelivered === true;
        const infoVerified = data.infoVerified === 'on' || data.infoVerified === true;

        let userId = session.user.id;
        const targetUserId = data.targetUserId;
        // Admin Override
        if (targetUserId && session.user.role === 'ADMIN') {
            userId = targetUserId;
        }

        console.log("[API] Processing for user:", userId, "(Session user:", session.user.id, ")");

        if (!expenseIds.length) {
            return NextResponse.json({ message: 'Seçili masraf yok', success: false }, { status: 400 });
        }

        if (!infoVerified) {
            return NextResponse.json({ message: 'Bilgilerin doğruluğunu onaylamanız gerekmektedir.', success: false }, { status: 400 });
        }

        // Calculate total
        const expenses = await prisma.expense.findMany({
            where: { id: { in: expenseIds }, userId: userId } // Use resolved userId
        });

        let totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        if (isNaN(totalAmount) || !isFinite(totalAmount)) {
            totalAmount = 0;
            console.warn("[API] Warning: Total amount calculation resulted in NaN/Infinity. Resetting to 0.");
        }
        console.log("[API] Calculated Total:", totalAmount);

        // Transaction removed for debugging stability
        console.log("[API] Creating Form (Sequential)...");

        const form = await prisma.expenseForm.create({
            data: {
                userId: userId, // Use resolved userId
                title: title,
                totalAmount: totalAmount,
                location: location,
                receiptsDelivered: receiptsDelivered,
                infoVerified: infoVerified,
                status: 'SUBMITTED',
                expenses: {
                    connect: expenseIds.map(id => ({ id }))
                }
            }
        });

        console.log("[API] Form Created:", form.id);

        const periodId = data.periodId as string;

        console.log("[API] Updating Expenses...");
        await prisma.expense.updateMany({
            where: { id: { in: expenseIds } },
            data: {
                status: 'SUBMITTED',
                ...(periodId && { periodId: periodId }) // Update period context if provided
            }
        });

        const createdFormId = form.id;

        console.log("[API] Transaction Success. Form ID:", createdFormId);

        // Notifications & Gamification (Non-blocking errors)
        try {
            await notifyAdmins(
                'Yeni Masraf Formu',
                `${session.user.name || session.user.email} yeni bir masraf formu oluşturdu: ${title}`,
                `/dashboard/accounting/${createdFormId}`
            );

            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            if (user) {
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { lastSubmissionDate: new Date() }
                });
            }
        } catch (err) {
            console.error("[API] Non-fatal error:", err);
        }

        // Note: RevalidatePath disabled to prevent crash. Relying on client-side refresh.

        const responsePayload = { success: true, formId: createdFormId };
        console.log("[API] Returning Payload:", responsePayload);

        return new Response(JSON.stringify(responsePayload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        console.error("[API] Critical Error:", e);
        return NextResponse.json({ message: 'Sunucu hatası oluştu', success: false, error: String(e) }, { status: 500 });
    }
}
