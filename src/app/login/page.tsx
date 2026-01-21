import { LoginForm } from "@/components/login-form"
import { Wallet } from "lucide-react"

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 z-0" />
            <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[100px] z-0 animate-pulse" />
            <div className="absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[100px] z-0 animate-pulse delay-1000" />

            <div className="relative z-10 w-full max-w-md space-y-8">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-xl shadow-blue-200 mb-6 transform transition-transform hover:scale-105">
                        <Wallet className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">GiderTakip</h1>
                    <p className="text-slate-500 mt-2 text-balance leading-relaxed">
                        Kurumsal masraf ve gider süreçlerinizi<br />tek noktadan yönetin.
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-1">
                    <LoginForm />
                </div>

                <p className="text-center text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} GiderTakip Sistemi. Tüm hakları saklıdır.
                </p>
            </div>
        </main>
    );
}
