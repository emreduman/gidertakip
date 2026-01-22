'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react'
import { getUserNotifications, markAsRead, markAllAsRead } from '@/lib/notification-actions'
import { clsx } from "clsx"
import Link from 'next/link'

interface Notification {
    id: string
    title: string
    message: string
    type: string
    link: string | null
    isRead: boolean
    createdAt: Date
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const fetchNotifications = async () => {
        const data = await getUserNotifications();
        // date serialization fix might be needed if generic server action returns Date objects directly
        // usually server components serialize but direct props might be tricky.
        // Prisma objects passed from server action to client component are usually fine in Next.js 14.
        setNotifications(data as any);
        setUnreadCount(data.filter((n: any) => !n.isRead).length);
    }

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const handleMarkAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await markAsRead(id);
    };

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        await markAllAsRead();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'ERROR': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'WARNING': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    }

    const toggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) fetchNotifications(); // Refresh on open
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggle}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Bildirimler"
            >
                <Bell className="w-6 h-6 text-white md:text-white" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white md:ring-slate-50">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 md:right-auto md:left-0 mt-2 w-[85vw] sm:w-80 md:w-96 rounded-lg bg-white shadow-xl ring-1 ring-black/5 z-50 overflow-hidden transform origin-top-right md:origin-top-left">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-900">Bildirimler</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" /> Tümünü Okundu İşaretle
                            </button>
                        )}
                    </div>

                    <div className="max-h-[70vh] md:max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                Bildiriminiz yok.
                            </div>
                        ) : (
                            <div className="divide-y">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={clsx(
                                            "flex gap-3 p-4 hover:bg-gray-50 transition-colors",
                                            { "bg-blue-50/40": !n.isRead }
                                        )}
                                        onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                                    >
                                        <div className="shrink-0 mt-1">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <p className={clsx("text-sm text-gray-900", { "font-semibold": !n.isRead })}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                    {new Date(n.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                {n.message}
                                            </p>
                                            {n.link && (
                                                <div className="mt-2">
                                                    <Link
                                                        href={n.link}
                                                        onClick={() => setIsOpen(false)} // Close dropdown on navigate
                                                        className="text-xs font-medium text-blue-600 hover:underline"
                                                    >
                                                        Detayları Gör →
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                        {!n.isRead && (
                                            <div className="shrink-0 flex items-center self-center">
                                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
