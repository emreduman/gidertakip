'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { authenticate } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react'

export function LoginForm() {
    const [errorMessage, dispatch, isPending] = useActionState(
        authenticate,
        undefined,
    )

    return (
        <form action={dispatch} className="space-y-4 p-8">
            <div className="space-y-4">
                <div>
                    <Label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
                        E-posta Adresi
                    </Label>
                    <div className="relative">
                        <Input
                            className="peer block w-full rounded-xl border-slate-200 py-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-11 bg-slate-50/50"
                            id="email"
                            type="email"
                            name="email"
                            placeholder="ornek@sirket.com"
                            required
                        />
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 peer-focus:text-blue-500 transition-colors" />
                    </div>
                </div>
                <div>
                    <Label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
                        Şifre
                    </Label>
                    <div className="relative">
                        <Input
                            className="peer block w-full rounded-xl border-slate-200 py-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-11 bg-slate-50/50"
                            id="password"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 peer-focus:text-blue-500 transition-colors" />
                    </div>
                    <div className="flex justify-end mt-1">
                        <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">Şifremi Unuttum?</a>
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <LoginButton />
            </div>

            <div
                className="flex min-h-[24px] items-end space-x-1"
                aria-live="polite"
                aria-atomic="true"
            >
                {errorMessage && (
                    <div className="flex w-full items-center gap-2 rounded-lg bg-red-50 p-3 text-red-600 border border-red-100">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium">{errorMessage}</p>
                    </div>
                )}
            </div>
        </form>
    )
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 transition-all text-base font-semibold group"
            aria-disabled={pending}
            disabled={pending}
        >
            {pending ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            {!pending && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
        </Button>
    );
}
