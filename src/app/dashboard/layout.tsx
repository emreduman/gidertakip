import SideNav from '@/components/dashboard/sidenav';
import { OfflineIndicator } from '@/components/ui/offline-indicator';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
            <div className="w-full flex-none md:w-64">
                <SideNav />
            </div>
            <div className="flex-grow p-3 md:overflow-y-auto md:p-12">
                {children}
                <OfflineIndicator />
            </div>
        </div>
    );
}
