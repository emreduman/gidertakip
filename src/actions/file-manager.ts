'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

async function checkAuth() {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
        throw new Error("Unauthorized access");
    }
    return session.user;
}

export async function getProjects(organizationId: string) {
    await checkAuth();
    return await prisma.project.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getPeriods(projectId: string) {
    await checkAuth();
    return await prisma.period.findMany({
        where: { projectId },
        orderBy: { startDate: 'desc' }
    });
}

export async function getUsersInPeriod(periodId: string) {
    await checkAuth();
    // Find users who have expenses in this period
    const expenses = await prisma.expense.findMany({
        where: { periodId },
        select: { userId: true },
        distinct: ['userId']
    });

    const userIds = expenses.map(e => e.userId);

    return await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, image: true }
    });
}

export async function getUserFiles(periodId: string, userId: string) {
    await checkAuth();
    return await prisma.expense.findMany({
        where: {
            periodId,
            userId,
            receiptUrl: { not: null }
        },
        select: {
            id: true,
            description: true,
            amount: true,
            date: true,
            receiptUrl: true,
            category: true,
            merchant: true
        },
        orderBy: { date: 'desc' }
    });
}
