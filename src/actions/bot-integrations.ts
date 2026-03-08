"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBotIntegrationsAction() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return { success: false, error: "Yetkisiz erişim" };
  }

  try {
    const integrations = await prisma.botIntegration.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, integrations };
  } catch (error: any) {
    console.error("Bot integrations error:", error);
    return { success: false, error: error.message || "Failed to fetch integrations" };
  }
}

export async function saveBotIntegrationAction(data: {
  id?: string;
  userId: string;
  platform: string;
  chatId: string;
  isActive: boolean;
  canReadExpenses: boolean;
  canWriteExpenses: boolean;
  canReadBudget: boolean;
  canReadReports: boolean;
  customPrompt?: string;
}) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return { success: false, error: "Yetkisiz erişim" };
  }

  try {
    if (data.id) {
      const integration = await prisma.botIntegration.update({
        where: { id: data.id },
        data: {
          platform: data.platform,
          chatId: data.chatId,
          isActive: data.isActive,
          canReadExpenses: data.canReadExpenses,
          canWriteExpenses: data.canWriteExpenses,
          canReadBudget: data.canReadBudget,
          canReadReports: data.canReadReports,
          customPrompt: data.customPrompt || null,
        },
      });
      revalidatePath("/dashboard/settings");
      return { success: true, integration };
    } else {
      // Check if user already has an integration
      const existing = await prisma.botIntegration.findUnique({
        where: { userId: data.userId },
      });

      if (existing) {
        return { success: false, error: "Bu kullanıcının zaten bir bot entegrasyonu var." };
      }

      const integration = await prisma.botIntegration.create({
        data,
      });
      revalidatePath("/dashboard/settings");
      return { success: true, integration };
    }
  } catch (error: any) {
    console.error("Save integration error:", error);
    return { success: false, error: error.message || "Failed to save integration" };
  }
}

export async function deleteBotIntegrationAction(id: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return { success: false, error: "Yetkisiz erişim" };
  }

  try {
    await prisma.botIntegration.delete({
      where: { id },
    });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Delete integration error:", error);
    return { success: false, error: "Failed to delete integration" };
  }
}
