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
        <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Masraf Formu Oluştur</h1>

            {isAdmin && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
                    <p className="font-semibold text-yellow-800 mb-2">Admin Modu: Kullanıcı Seçimi</p>
                    <p className="text-sm text-yellow-700 mb-4">Şu an <strong>{user?.name || 'Seçili Kullanıcı'}</strong> adına işlem yapıyorsunuz.</p>
                </div>
            )}

            <p className="text-muted-foreground mb-6">Lütfen bilgilerinizi kontrol edip ödeme talebi oluşturun.</p>

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
