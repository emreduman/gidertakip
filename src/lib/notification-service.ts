import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

type NotificationType = 'NEW_EXPENSE' | 'FORM_SUBMITTED' | 'FORM_APPROVED' | 'FORM_REJECTED';

interface NotificationPayload {
    userId: string; // The recipient
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    link?: string;
}

export async function createNotification(payload: NotificationPayload) {
    try {
        await prisma.notification.create({
            data: {
                userId: payload.userId,
                title: payload.title,
                message: payload.message,
                type: payload.type,
                link: payload.link,
            }
        });
    } catch (error) {
        console.error("Failed to create db notification", error);
    }
}

// Helper to notify a specific user (e.g. form owner)
export async function notifyUser(userId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', link?: string) {
    await createNotification({ userId, title, message, type, link });
}

// Helper to notify all admins/accountants (e.g. new form submission)
export async function notifyAdmins(title: string, message: string, link?: string) {
    try {
        const admins = await prisma.user.findMany({
            where: {
                role: { in: [Role.ADMIN, Role.ACCOUNTANT] }
            },
            select: { id: true }
        });

        const notifications = admins.map(admin => ({
            userId: admin.id,
            title,
            message,
            type: 'INFO',
            link
        }));

        // Prisma createMany is faster
        await prisma.notification.createMany({
            data: notifications as any // Cast for safe type
        });

    } catch (error) {
        console.error("Failed to notify admins", error);
    }
}

// Legacy wrapper to keep compatibility if needed, but better to replace usages.
// For now, let's keep it simple.
