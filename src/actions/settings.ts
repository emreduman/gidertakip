'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

async function checkAuth() {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
    throw new Error("Unauthorized access");
  }
}

// Schema for AI Settings
const aiSettingsSchema = z.object({
  openaiApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  openRouterApiKey: z.string().optional(),
  openRouterModel: z.string().optional()
})

// Schema for SMTP Settings
const smtpSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean().default(true),
  smtpFromEmail: z.string().email().optional().or(z.literal(''))
})

// Schema for RSS Feed
const rssFeedSchema = z.object({
  name: z.string().min(1, 'İsim gerekli'),
  url: z.string().url('Geçerli bir URL giriniz')
})

export async function getSettings(organizationId: string) {
  if (!organizationId) {
    throw new Error("Organization ID is required")
  }

  let settings = await prisma.settings.findUnique({
    where: { organizationId },
    include: { rssFeeds: true }
  })

  // Create default if not exists
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        organizationId
      },
      include: { rssFeeds: true }
    })
  }

  return settings
}

export async function updateAISettings(organizationId: string, data: z.infer<typeof aiSettingsSchema>) {
  await checkAuth();
  const settings = await prisma.settings.upsert({
    where: { organizationId },
    create: {
      organizationId,
      ...data
    },
    update: {
      ...data
    }
  })

  revalidatePath('/dashboard/settings')
  return { success: true, settings }
}

export async function updateSMTPSettings(organizationId: string, data: z.infer<typeof smtpSettingsSchema>) {
  await checkAuth();
  const settings = await prisma.settings.upsert({
    where: { organizationId },
    create: {
      organizationId,
      ...data
    },
    update: {
      ...data
    }
  })

  revalidatePath('/dashboard/settings')
  return { success: true, settings }
}

export async function addRSSFeed(organizationId: string, data: z.infer<typeof rssFeedSchema>) {
  await checkAuth();
  const settings = await prisma.settings.findUnique({
    where: { organizationId }
  })

  if (!settings) throw new Error("Settings not initialized")

  await prisma.rssFeed.create({
    data: {
      settingsId: settings.id,
      name: data.name,
      url: data.url
    }
  })

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function removeRSSFeed(feedId: string) {
  await checkAuth();
  await prisma.rssFeed.delete({
    where: { id: feedId }
  })
  revalidatePath('/dashboard/settings')
  return { success: true }
}
