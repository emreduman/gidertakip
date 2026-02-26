import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { CreateFormWizard } from "@/components/forms/create-form-wizard"

// ... imports

export default async function CreateFormPage(props: { searchParams: Promise<{ userId?: string }> }) {
    const searchParams = await props.searchParams;
    const session = await auth();

    const isAdmin = session?.user?.role === 'ADMIN';
    const targetUserId = searchParams.userId;
    const effectiveUserId = (isAdmin && targetUserId) ? targetUserId : session?.user?.id;

    // Fetch ALL users if Admin (for selection)
    let allUsers: { id: string; name: string | null; email: string | null }[] = [];
    if (isAdmin) {
        allUsers = await prisma.user.findMany({
            select: { id: true, name: true, email: true }
        });
    }

    const pendingExpenses = await prisma.expense.findMany({
        where: {
            userId: effectiveUserId,
            expenseFormId: null, // Only unassigned expenses
            status: 'PENDING'
        },
        include: {
            period: {
                include: { project: true }
            }
        }
    });

    // Serialize Decimal amounts to numbers for Client Component
    const serializedExpenses = pendingExpenses.map(expense => ({
        ...expense,
        amount: Number(expense.amount),
        period: {
            ...expense.period,
        }
    }));

    // Fetch full user for bank details (Effective User)
    const user = await prisma.user.findUnique({
        where: { id: effectiveUserId },
        include: {
            organization: { // Keep this for defaults if needed, but we rely on selection now
                include: { policies: true }
            }
        }
    });

    // ... (rest of organizations fetch, same as before)
    const organizations = await prisma.organization.findMany({
        include: {
            projects: {
                include: {
                    periods: true
                }
            },
            policies: true
        }
    });

    // ... (rest of serialization)
    const serializedOrganizations = organizations.map(org => ({
        ...org,
        policies: org.policies.map((p: any) => ({ ...p, maxAmount: Number(p.maxAmount) })),
        projects: org.projects || []
    }));

    const serializedUser = user ? {
        ...user,
        organization: (user as any).organization ? {
            ...(user as any).organization,
            policies: (user as any).organization.policies ? (user as any).organization.policies.map((p: any) => ({
                ...p,
                maxAmount: Number(p.maxAmount)
            })) : []
        } : null
    } : null;

    return (
        <main className="w-full space-y-6 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Masraf Formu Oluştur</h1>
                    <p className="text-slate-500 mt-1">Lütfen bilgilerinizi kontrol edip ödeme talebi oluşturun.</p>
                </div>
            </div>

            {isAdmin && (
                <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-200/50 mb-6">
                    <p className="font-semibold text-amber-800 mb-1">Admin Modu: Kullanıcı Seçimi</p>
                    <p className="text-sm text-amber-700/80">Şu an <strong>{user?.name || 'Seçili Kullanıcı'}</strong> adına işlem yapıyorsunuz.</p>
                </div>
            )}

            <CreateFormWizard
                user={serializedUser}
                organizations={serializedOrganizations}
                pendingExpenses={serializedExpenses}
                allUsers={allUsers}
                selectedUserId={effectiveUserId}
            />
        </main>
    );
}
