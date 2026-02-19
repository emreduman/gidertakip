import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"
import { Role } from "@prisma/client"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: Role
        } & DefaultSession["user"]
    }

    interface User {
        role: Role
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: Role
    }
}
