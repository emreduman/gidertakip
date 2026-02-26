import Link from 'next/link';
import NavLinks from '@/components/dashboard/nav-links';
import { PowerIcon, UserCircleIcon, WalletIcon } from 'lucide-react';
import { signOut, auth } from '@/auth';
import { NotificationBell } from './notification-bell';
import { AIButton } from './ai-button';

export default async function SideNav() {
    const session = await auth();
    const userRole = session?.user?.role;

    return (
        <div className="flex h-full flex-col px-3 py-4 md:px-4">
            <div className="relative mb-4 flex h-20 items-center justify-between rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-800 to-indigo-950 p-4 md:h-40 md:items-end md:justify-start shadow-lg overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-teal-500/20 rounded-full blur-2xl"></div>

                <Link href="/" className="w-32 text-white md:w-40 z-10 flex items-center gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <WalletIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <span className="text-xl md:text-2xl font-bold tracking-tight">GiderTakip</span>
                </Link>

                {/* Right Side Actions */}
                <div className="flex items-center gap-1 text-white z-20">

                    {/* Desktop Centered AI Button */}
                    <div className="hidden md:block md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
                        <AIButton />
                    </div>

                    {/* Mobile Only: Bell, Profile & Logout */}
                    <div className="flex gap-1 md:hidden">
                        <NotificationBell />
                        <Link href="/dashboard/profile" className="p-2 hover:bg-blue-500 rounded-full transition-colors">
                            <UserCircleIcon className="w-6 h-6" />
                        </Link>
                        <form
                            action={async () => {
                                'use server';
                                await signOut();
                            }}
                        >
                            <button className="p-2 hover:bg-blue-500 rounded-full transition-colors">
                                <PowerIcon className="w-6 h-6" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2 overflow-x-auto pb-1 md:pb-0">
                <NavLinks role={userRole} />
                <div className="hidden h-auto w-full grow md:block"></div>
                <form
                    action={async () => {
                        'use server';
                        await signOut();
                    }}
                >
                    <button className="flex h-[48px] w-full grow items-center justify-center gap-3 rounded-xl p-3 text-sm font-medium transition-all duration-200 text-slate-600 hover:bg-slate-100/80 hover:text-red-700 md:flex-none md:justify-start md:p-2 md:px-4">
                        <PowerIcon className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
                        <div className="hidden md:block">Çıkış Yap</div>
                    </button>
                </form>
            </div>
        </div>
    );
}
