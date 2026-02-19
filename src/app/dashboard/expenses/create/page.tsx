import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateExpenseWrapper } from "@/components/expenses/create-expense-wrapper";

export default async function CreateExpensePage() {
    const session = await auth();
    const isAdmin = session?.user?.role === 'ADMIN';

    let allUsers: any[] = [];
    if (isAdmin) {
        allUsers = await prisma.user.findMany({
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' }
        });
    }

    return <CreateExpenseWrapper allUsers={allUsers} />;
}
