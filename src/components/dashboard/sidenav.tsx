import Link from 'next/link';
import NavLinks from '@/components/dashboard/nav-links';
import { PowerIcon, UserCircleIcon } from 'lucide-react';
import { signOut } from '@/auth';
import { NotificationBell } from './notification-bell';
import { AIButton } from './ai-button';

export default function SideNav() {
    return (
        <div className="flex h-full flex-col px-3 py-4 md:px-2">
            <div className="relative mb-2 flex h-20 items-center justify-between rounded-md bg-blue-600 p-4 md:h-40 md:items-end md:justify-start">
                <Link href="/" className="w-32 text-white md:w-40 z-10">
                    <span className="text-xl font-bold">GiderTakip</span>
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
                <NavLinks />
                <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
                <form
                    action={async () => {
                        'use server';
                        await signOut();
                    }}
                    className="hidden md:block"
                >
                    <button className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
                        <PowerIcon className="w-6" />
                        <div className="hidden md:block">Çıkış Yap</div>
                    </button>
                </form>
            </div>
        </div>
    );
}
