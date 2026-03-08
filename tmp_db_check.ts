import { prisma } from './src/lib/prisma';

async function main() {
    const exps = await prisma.expense.findMany({
        where: { receiptUrl: { not: null } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, receiptUrl: true, amount: true }
    });
    console.log("Recent expenses:", exps);
}

main().finally(() => prisma.$disconnect());
