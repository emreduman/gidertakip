import { NextRequest, NextResponse } from "next/server";
import { analyzeReceiptWithGemini } from "../../../../lib/gemini";
import { prisma } from "../../../../lib/prisma";
import { put } from "@vercel/blob";
import { Prisma } from "@prisma/client";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const AUTHORIZED_CHAT_ID = process.env.TELEGRAM_AUTHORIZED_CHAT_ID;

// Helper to send a message back to Telegram
async function sendTelegramMessage(chatId: string | number, text: string) {
    if (!TELEGRAM_BOT_TOKEN) return;
    
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.error("Failed to send telegram message:", e);
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // Telegram validation
        if (!body.message || !body.message.chat) {
            return NextResponse.json({ success: true, message: "Ignored: No message or chat context" });
        }

        const chatId = body.message.chat.id.toString();

        // Security: Ensure only the authorized user can interact with the bot
        if (!AUTHORIZED_CHAT_ID || chatId !== AUTHORIZED_CHAT_ID) {
            console.warn(`Unauthorized access attempt from Chat ID: ${chatId}`);
            // Do not reply to unauthorized users to avoid exposing the bot, or send a generic polite denial
            return NextResponse.json({ success: true, message: "Unauthorized" });
        }

        // We need a user to tie expenses to. Easiest way is to find a user by their ID or the first user in the system if this is a personal app.
        // Let's assume the user's email is stored in an env var for this explicit connection, or we just grab the first admin/owner.
        const user = await prisma.user.findFirst({
            where: { role: { in: ['ADMIN', 'OWNER'] } },
            orderBy: { createdAt: 'asc' }
        });

        if (!user) {
            await sendTelegramMessage(chatId, "Sistemde hesaba bağlanacak yetkili bir kullanıcı bulunamadı.");
            return NextResponse.json({ success: false });
        }

        const messageText = body.message.text || "";
        const photos = body.message.photo;

        // 1. Handle Images (Receipt Uploads)
        if (photos && photos.length > 0) {
            // Send initial processing message
            await sendTelegramMessage(chatId, "📸 Fişiniz alındı, yapay zeka tarafından inceleniyor...");

            // Get the highest resolution photo (last in array)
            const highestResPhoto = photos[photos.length - 1];
            const fileId = highestResPhoto.file_id;

            try {
                // Get File Path from Telegram
                const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
                const fileData = await fileRes.json();
                
                if (!fileData.ok) throw new Error("Dosya yolu alınamadı");
                
                const filePath = fileData.result.file_path;
                
                // Download actual file
                const downloadRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`);
                const buffer = Buffer.from(await downloadRes.arrayBuffer());

                // Upload to Vercel Blob
                const blob = await put(`receipts/telegram_${Date.now()}.jpg`, buffer, {
                    access: 'public',
                    contentType: 'image/jpeg'
                });

                // Analyze with Gemini
                const parsedData = await analyzeReceiptWithGemini(blob.url, 'image/jpeg', buffer);

                // Find active period for this organization
                const activePeriod = await prisma.period.findFirst({
                   where: { 
                       isActive: true,
                       project: { organizationId: user.organizationId! }
                   } 
                });

                if (!activePeriod) {
                     await sendTelegramMessage(chatId, "⚠️ Aktif bir dönem (period) bulunamadı. Fiş kaydedilemiyor, lütfen sistemden bir dönem başlatın.");
                     return NextResponse.json({ success: true });
                }

                // Create Expense in DB
                const newExpense = await prisma.expense.create({
                    data: {
                        userId: user.id,
                        periodId: activePeriod.id,
                        amount: parsedData.amount,
                        date: parsedData.date,
                        merchant: parsedData.merchant || "Bilinmeyen Üye İşyeri",
                        category: parsedData.category || "Diğer",
                        description: parsedData.description,
                        receiptUrl: blob.url,
                        taxRate: parsedData.taxRate,
                        taxAmount: parsedData.taxAmount,
                        confidence: parsedData.confidence,
                        isAiParsed: true,
                        aiData: parsedData as any,
                        warnings: parsedData.warnings.join(", ")
                    }
                });

                // Reply with success
                const responseMsg = `✅ *Fiş Başarıyla Kaydedildi!*\n\n` + 
                                    `🏪 *İşyeri:* ${newExpense.merchant}\n` + 
                                    `💰 *Tutar:* ${newExpense.amount.toString()} ${user.currency || "TRY"}\n` + 
                                    `🏷️ *Kategori:* ${newExpense.category}\n` +
                                    `📅 *Tarih:* ${newExpense.date.toLocaleDateString('tr-TR')}`;
                
                await sendTelegramMessage(chatId, responseMsg);

            } catch (error: any) {
                console.error("Telegram photo processing error:", error);
                await sendTelegramMessage(chatId, `❌ Fiş işlenirken bir hata oluştu:\n${error.message}`);
            }

            return NextResponse.json({ success: true });
        }

        // 2. Handle Text Commands
        if (messageText) {
            const command = messageText.toLowerCase();

            if (command.includes("özet") || command.includes("harcadım")) {
                // Find total expenses for active period
                 const activePeriod = await prisma.period.findFirst({
                   where: { 
                       isActive: true,
                       project: { organizationId: user.organizationId! }
                   } 
                });

                if (!activePeriod) {
                    await sendTelegramMessage(chatId, "Aktif bir dönem bulunmuyor.");
                    return NextResponse.json({ success: true });
                }

                const expenses = await prisma.expense.aggregate({
                    where: { 
                        userId: user.id,
                        periodId: activePeriod.id
                    },
                    _sum: { amount: true },
                    _count: { id: true }
                });

                const total = expenses._sum.amount ? expenses._sum.amount.toString() : "0.00";
                const count = expenses._count.id;

                await sendTelegramMessage(chatId, `📊 *Bu Dönemki Özetiniz*\n\nToplam *${count}* adet harcama girdiniz.\n💰 *Toplam Tutar:* ${total} ${user.currency || "TRY"}`);

            } else if (command === "/start") {
                 await sendTelegramMessage(chatId, `Merhaba ${user.name || "Kullanıcı"} 👋\nGider Takip sistemine hoş geldiniz.\n\nBana harcama fişlerinizin fotoğrafını gönderebilir veya "bu ay ne kadar harcadım?" gibi sorular sorabilirsiniz.`);
            } else {
                 await sendTelegramMessage(chatId, "Bunu tam anlayamadım. Lütfen bir fiş fotoğrafı yükleyin veya 'özet' yazarak durumunuzu görün.");
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Telegram webhook error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
