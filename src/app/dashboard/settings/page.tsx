import { auth } from "@/auth" // Assuming auth config location
import { redirect } from "next/navigation"
import { getSettings } from "@/actions/settings"
import SettingsTabs from "@/components/settings-view"
import { prisma } from "@/lib/prisma"

export default async function SettingsPage() {
    // Ideally use auth() to get the session and organization ID
    // For now, I will fetch the first organization or fallback to a hardcoded one for the prototype
    // const session = await auth()
    // if (!session?.user) redirect("/login")

    // MOCK: Getting first org for demo since auth isn't fully exposed in my context
    const org = await prisma.organization.findFirst();

    if (!org) {
        return <div>Henüz bir organizasyon bulunamadı. Lütfen önce veri oluşturun.</div>
    }

    const settings = await getSettings(org.id);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Sistem Ayarları</h2>
            </div>
            <SettingsTabs settings={settings} organizationId={org.id} />
        </div>
    )
}
