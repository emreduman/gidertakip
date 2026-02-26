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

    return (
        <div className="w-full space-y-6 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Yeni Harcama Ekle</h1>
                    <p className="text-slate-500 mt-1">Fişinizi yükleyin veya bilgileri manuel olarak girin</p>
                </div>
            </div>
            <CreateExpenseWrapper allUsers={allUsers} />
        </div>
    );
}
