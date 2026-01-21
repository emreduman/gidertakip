'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function checkExpensePolicy(category: string, amount: number) {
    const session = await auth();
    if (!session?.user?.id) return { warning: null };

    // Get user's organization
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true }
    });

    if (!user?.organizationId) return { warning: null };

    // Find policy for this category
    // Case-insensitive match? For now, exact match or maybe normalized.
    // Let's assume normalized lower case or exact match.
    // Policies should be created with standard category names.
    const policy = await prisma.policy.findFirst({
        where: {
            organizationId: user.organizationId,
            category: { equals: category, mode: 'insensitive' }, // Case insensitive check
            isActive: true
        }
    });

    if (policy) {
        if (amount > Number(policy.maxAmount)) {
            return {
                warning: `⚠️ Bu harcama "${policy.category}" kategorisi için belirlenen ₺${policy.maxAmount} limitini aşıyor.`
            };
        }
    }

    return { warning: null };
}

export async function seedDefaultPolicies() {
    const session = await auth();
    if (!session?.user?.id) return;
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true }
    });

    if (!user?.organizationId) return;

    // Create some default policies for demo
    await prisma.policy.createMany({
        data: [
            { organizationId: user.organizationId, category: 'Yemek', maxAmount: 500 },
            { organizationId: user.organizationId, category: 'Taksi', maxAmount: 300 },
            { organizationId: user.organizationId, category: 'Konaklama', maxAmount: 5000 },
        ],
        skipDuplicates: true
    });
}
