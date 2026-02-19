'use client';

import {
    LayoutDashboardIcon,
    FileTextIcon,
    UsersIcon,
    WalletIcon,
    BanknoteIcon,
    UserCircleIcon,
    SettingsIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
    { name: 'Özet', href: '/dashboard', icon: LayoutDashboardIcon },
    { name: 'Harcamalarım', href: '/dashboard/expenses', icon: WalletIcon },
    { name: 'Masraf Formları', href: '/dashboard/forms', icon: FileTextIcon },
    { name: 'Muhasebe', href: '/dashboard/accounting', icon: BanknoteIcon }, // Should be role protected later
    { name: 'Yönetim', href: '/dashboard/admin', icon: UsersIcon }, // Admin only
    { name: 'Profil', href: '/dashboard/profile', icon: UserCircleIcon },
    { name: 'Ayarlar', href: '/dashboard/settings', icon: SettingsIcon },
];

export default function NavLinks({ role }: { role?: string }) {
    const pathname = usePathname();

    return (
        <>
            {links.map((link) => {
                const LinkIcon = link.icon;

                // Hide Settings link if user is not ADMIN or OWNER
                if (link.href === '/dashboard/settings' && role !== 'ADMIN' && role !== 'OWNER') {
                    return null;
                }

                // Hide Admin link if user is not ADMIN or OWNER
                if (link.href === '/dashboard/admin' && role !== 'ADMIN' && role !== 'OWNER') {
                    return null;
                }

                return (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={clsx(
                            'h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3 min-w-[60px]',
                            {
                                'bg-sky-100 text-blue-600': pathname === link.href,
                                'hidden md:flex': link.href === '/dashboard/profile',
                                'flex': link.href !== '/dashboard/profile',
                            },
                        )}
                    >
                        <LinkIcon className="w-6" />
                        <p className="hidden md:block">{link.name}</p>
                    </Link>
                );
            })}
        </>
    );
}
