import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const hashedPassword = await bcrypt.hash("123456", 10);

        // 1. Create Admin User
        const admin = await prisma.user.upsert({
            where: { email: "admin@gidertakip.com" },
            update: { password: hashedPassword, role: "ADMIN" },
            create: {
                email: "admin@gidertakip.com",
                name: "Sistem Yöneticisi",
                password: hashedPassword,
                role: "ADMIN",
            },
        });

        // 2. Create Organization
        let org = await prisma.organization.findFirst({ where: { name: 'Güneş Vakfı' } });
        if (!org) {
            org = await prisma.organization.create({
                data: { name: 'Güneş Vakfı' }
            });
        }

        // Also link admin to organization
        if (org && admin) {
            await prisma.user.update({
                where: { id: admin.id },
                data: { organizationId: org.id }
            });
        }

        return NextResponse.json({
            success: true,
            message: "Admin kullanıcı başarıyla oluşturuldu.",
            credentials: { email: "admin@gidertakip.com", password: "123456" }
        });
    } catch (error) {
        console.error("Seed error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
