import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // If user is logged in and trying to access root or login, redirect to dashboard
                if (nextUrl.pathname === "/" || nextUrl.pathname === "/login") {
                    return Response.redirect(new URL("/dashboard", nextUrl))
                }
            }
            return true
        },
        session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
            }
            if (token.role && session.user) {
                // @ts-ignore
                session.user.role = token.role
            }
            return session
        },
        jwt({ token, user }) {
            if (user) {
                token.role = user.role
            }
            return token
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig
