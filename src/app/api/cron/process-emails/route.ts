import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { put } from '@vercel/blob';
import { analyzeReceiptWithGemini } from '@/lib/gemini';

export const maxDuration = 60; // Allow 60 seconds for processing

export async function GET(req: Request) {
    // Basic security for cron (in production, use standard Headers like Authorization)
    const { searchParams } = new URL(req.url);
    if (searchParams.get('secret') !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emailUser = process.env.EMAIL_IMAP_USER;
    const emailPass = process.env.EMAIL_IMAP_PASSWORD;

    if (!emailUser || !emailPass) {
        return NextResponse.json({ error: 'Email configuration missing' }, { status: 500 });
    }

    const config = {
        imap: {
            user: emailUser,
            password: emailPass,
            host: process.env.EMAIL_IMAP_HOST || 'imap.gmail.com',
            port: Number(process.env.EMAIL_IMAP_PORT || 993),
            tls: true,
            authTimeout: 10000
        }
    };

    let connection;
    let processedCount = 0;
    const logs: string[] = [];

    try {
        connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        // Search for unread emails
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT', ''], struct: true, markSeen: false };

        const messages = await connection.search(searchCriteria, fetchOptions);
        logs.push(`Found ${messages.length} unread messages.`);

        for (const item of messages) {
            try {
                // Find all parts
                const all = item.parts.find((part) => part.which === '');
                if (!all) continue;

                // Parse the full email
                const parsed = await simpleParser(all.body);

                // Extract sender
                const fromHeader = parsed.from?.value[0];
                const senderEmail = fromHeader?.address;

                if (!senderEmail) {
                    logs.push(`No sender found for msg #${item.attributes.uid}`);
                    await connection.addFlags(item.attributes.uid, ['\\Seen']);
                    continue;
                }

                logs.push(`Processing email from: ${senderEmail}`);

                // Find user in DB
                const user = await prisma.user.findUnique({
                    where: { email: senderEmail },
                    include: { organization: true }
                });

                if (!user) {
                    logs.push(`User not found for email: ${senderEmail}. Marking as seen.`);
                    // We mark as seen so we don't process it again, even if rejected.
                    await connection.addFlags(item.attributes.uid, ['\\Seen']);
                    continue;
                }

                // Look for attachments
                let attachmentFound = false;

                for (const attachment of parsed.attachments) {
                    const mimeType = attachment.contentType;
                    // Accept images and PDFs
                    if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
                        attachmentFound = true;

                        // Buffer
                        const fileBuffer = attachment.content;
                        const filename = `${Date.now()}-${attachment.filename || 'receipt'}`;

                        // Upload to Blob (or standard storage depending on setup)
                        // Using Vercel blob as per standard NextJs implementations for edge stability
                        // If BLOB_READ_WRITE_TOKEN is not set, we might need a local fallback for dev.
                        let fileUrl = '';
                        try {
                            const blob = await put(`receipts/${filename}`, fileBuffer, {
                                access: 'public',
                                token: process.env.BLOB_READ_WRITE_TOKEN // assumes token is available
                            });
                            fileUrl = blob.url;
                        } catch (uploadError: any) {
                            logs.push(`Blob upload failed, falling back to local simulation... or checking env`);
                            // Note: for deep integration, if Vercel Blob isn't setup, we might need a local file sink.
                            // Assuming BLOB is setup for now or will fail elegantly.
                            throw new Error(`Storage error: ${uploadError.message}`);
                        }


                        // Run AI Analysis
                        const dateFallback = parsed.date ? parsed.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                        let aiResult;
                        try {
                            aiResult = await analyzeReceiptWithGemini(fileUrl, mimeType, fileBuffer);
                        } catch (aiErr) {
                            logs.push(`AI Analysis failed for attachment ${filename}`);
                            continue; // Try next attachment or move on
                        }

                        // Determine duplication
                        const isDuplicate = await prisma.expense.findFirst({
                            where: {
                                userId: user.id,
                                merchant: aiResult.merchant,
                                amount: aiResult.amount,
                                date: new Date(aiResult.date),
                            }
                        }) !== null;

                        // Determine final status
                        let finalStatus = 'PENDING';
                        if (!isDuplicate && aiResult.confidence >= 90) {
                            finalStatus = 'APPROVED';
                        }

                        // Find an active period for this user
                        const activePeriod = await prisma.period.findFirst({
                            where: {
                                isActive: true,
                                project: { organizationId: user.organizationId || undefined }
                            },
                            orderBy: { startDate: 'desc' }
                        });

                        if (!activePeriod) {
                            logs.push(`No active period found for user ${user.id}. Cannot create expense.`);
                            continue;
                        }

                        // Create the Expense
                        await prisma.expense.create({
                            data: {
                                userId: user.id,
                                periodId: activePeriod.id,
                                category: aiResult.category || "Diğer",
                                amount: aiResult.amount,
                                taxRate: aiResult.taxRate,
                                taxAmount: aiResult.taxAmount,
                                merchant: aiResult.merchant,
                                date: new Date(aiResult.date),
                                description: `E-posta üzerinden eklendi. ${aiResult.description || ''}`,
                                status: finalStatus as any,
                                receiptUrl: fileUrl,
                                confidence: aiResult.confidence,
                                isDuplicate: isDuplicate,
                                isAiParsed: true,
                                aiData: JSON.parse(JSON.stringify(aiResult)),
                                warnings: isDuplicate ? "Bu fiş sistemde zaten kayıtlı olabilir (Auto-mail)." : undefined,
                            }
                        });

                        // Send In-App Notification
                        await prisma.notification.create({
                            data: {
                                userId: user.id,
                                title: "Otomatik Fiş İşlendi",
                                message: `E-posta üzerinden gönderdiğiniz faturanız başarıyla işlendi ve ${finalStatus === 'APPROVED' ? 'onaylandı' : 'bekleme listesine alındı'} (${aiResult.amount} ₺ - ${aiResult.merchant || 'Bilinmeyen Kurum'}).`,
                                type: finalStatus === 'APPROVED' ? "SUCCESS" : "INFO",
                                link: `/dashboard/expenses`
                            }
                        });

                        logs.push(`Successfully created expense and notification for ${senderEmail}: ${aiResult.amount} ₺ (${aiResult.merchant})`);
                        processedCount++;
                    }
                }

                if (!attachmentFound) {
                    logs.push(`No valid attachments found in email from ${senderEmail}`);
                }

                // Mark email as read regardless of outcome so it's not processed forever
                await connection.addFlags(item.attributes.uid, ['\\Seen']);

            } catch (msgErr: any) {
                logs.push(`Error processing message: ${msgErr.message}`);
            }
        }

    } catch (error: any) {
        logs.push(`IMAP Connection Error: ${error.message}`);
        return NextResponse.json({ success: false, logs, error: error.message }, { status: 500 });
    } finally {
        if (connection) {
            connection.end();
        }
    }

    return NextResponse.json({
        success: true,
        processed: processedCount,
        logs
    });
}
