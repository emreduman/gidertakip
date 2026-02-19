'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function getUserNotifications() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return notifications;
    } catch (e) {
        console.error("Fetch notifications error", e);
        return [];
    }
}

export async function markAsRead(id: string) {
    const session = await auth();
    if (!session?.user?.id) return;

    try {
        await prisma.notification.update({
            where: { id, userId: session.user.id }, // Security check: must belong to user
            data: { isRead: true }
        });
        revalidatePath('/dashboard');
    } catch (e) {
        console.error("Mark read error", e);
    }
}

export async function markAllAsRead() {
    const session = await auth();
    if (!session?.user?.id) return;

    try {
        await prisma.notification.updateMany({
            where: { userId: session.user.id, isRead: false },
            data: { isRead: true }
        });
        revalidatePath('/dashboard');
    } catch (e) {
        console.error("Mark all read error", e);
    }
}
