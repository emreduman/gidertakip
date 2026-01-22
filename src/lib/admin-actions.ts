'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"

// Helper to check admin role
async function checkAdmin() {
    const session = await auth();
    if (session?.user?.role !== Role.ADMIN) {
        throw new Error("Unauthorized");
    }
    return session;
}

export async function createOrganization(formData: FormData) {
    await checkAdmin();
    const name = formData.get('name') as string;

    await prisma.organization.create({
        data: { name }
    });
    revalidatePath('/dashboard/admin');
}

export async function createProject(formData: FormData) {
    await checkAdmin();
    const name = formData.get('name') as string;
    const organizationId = formData.get('organizationId') as string;

    if (!name || !organizationId) {
        console.error("Missing fields for Project creation:", { name, organizationId });
        return; // Or throw error, but preventing crash is better
    }

    await prisma.project.create({
        data: { name, organizationId }
    });
    revalidatePath('/dashboard/admin');
}

export async function createPeriod(formData: FormData) {
    await checkAdmin();
    const name = formData.get('name') as string;
    const projectId = formData.get('projectId') as string;
    const startDateVal = formData.get('startDate') as string;
    const endDateVal = formData.get('endDate') as string;

    if (!name || !projectId || !startDateVal || !endDateVal) {
        console.error("Missing fields for Period creation");
        return;
    }

    const startDate = new Date(startDateVal);
    const endDate = new Date(endDateVal);

    await prisma.period.create({
        data: { name, projectId, startDate, endDate, isActive: true }
    });
    revalidatePath('/dashboard/admin');
}

// --- Delete Actions ---

export async function deleteOrganization(formData: FormData) {
    await checkAdmin();
    const id = formData.get('id') as string;
    if (!id) return;
    try {
        await prisma.organization.delete({ where: { id } });
    } catch (e) {
        console.error("Failed to delete organization", e);
    }
    revalidatePath('/dashboard/admin');
}

export async function deleteProject(formData: FormData) {
    await checkAdmin();
    const id = formData.get('id') as string;
    if (!id) return;
    try {
        await prisma.project.delete({ where: { id } });
    } catch (e) {
        console.error("Failed to delete project", e);
    }
    revalidatePath('/dashboard/admin');
}

export async function deletePeriod(formData: FormData) {
    await checkAdmin();
    const id = formData.get('id') as string;
    if (!id) return;
    try {
        await prisma.period.delete({ where: { id } });
    } catch (e) {
        console.error("Failed to delete period", e);
    }
    revalidatePath('/dashboard/admin');
}

// --- User Management ---

export async function createUser(formData: FormData) {
    try {
        await checkAdmin();
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const role = formData.get('role') as Role;
        const organizationId = formData.get('organizationId') as string;

        // Basic validation
        if (!email || !role || !password) {
            return { success: false, message: 'E-posta, Şifre ve Rol alanları zorunludur.' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                organizationId: organizationId || null
            }
        });
        revalidatePath('/dashboard/admin');
        return { success: true, message: 'Kullanıcı başarıyla oluşturuldu.' };
    } catch (e: any) {
        console.error("Failed to create user", e);
        if (e.code === 'P2002') {
            return { success: false, message: 'Bu e-posta adresi zaten kullanımda.' };
        }
        if (e.message === 'Unauthorized') {
            return { success: false, message: 'Yetkisiz işlem.' };
        }
        return { success: false, message: 'Kullanıcı oluşturulurken bir hata oluştu: ' + (e.message || 'Bilinmeyen hata') };
    }
}


export async function deleteUser(formData: FormData) {
    await checkAdmin();
    const id = formData.get('id') as string;
    if (!id) return;
    try {
        await prisma.user.delete({ where: { id } });
    } catch (e) {
        console.error("Failed to delete user", e);
    }
    revalidatePath('/dashboard/admin');
}

// --- Update Actions ---

export async function updateOrganization(formData: FormData) {
    await checkAdmin();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    if (!id || !name) return;
    try {
        await prisma.organization.update({ where: { id }, data: { name } });
    } catch (e) {
        console.error("Failed to update organization", e);
    }
    revalidatePath('/dashboard/admin');
}

export async function updateProject(formData: FormData) {
    await checkAdmin();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    if (!id || !name) return;
    try {
        await prisma.project.update({ where: { id }, data: { name } });
    } catch (e) {
        console.error("Failed to update project", e);
    }
    revalidatePath('/dashboard/admin');
}

export async function updatePeriod(formData: FormData) {
    await checkAdmin();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    if (!id || !name) return;
    try {
        await prisma.period.update({ where: { id }, data: { name } });
    } catch (e) {
        console.error("Failed to update period", e);
    }
    revalidatePath('/dashboard/admin');
}

export async function updateUser(formData: FormData) {
    await checkAdmin();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as Role;
    const organizationId = formData.get('organizationId') as string;

    if (!id) return;

    try {
        await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                role,
                organizationId: organizationId || null
            }
        });
    } catch (e) {
        console.error("Failed to update user", e);
    }
    revalidatePath('/dashboard/admin');
}
