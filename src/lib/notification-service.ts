
type NotificationType = 'NEW_EXPENSE' | 'FORM_SUBMITTED' | 'FORM_APPROVED' | 'FORM_REJECTED';

interface NotificationPayload {
    type: NotificationType;
    message: string;
    details?: any;
    userId?: string;
}

export async function sendNotification(payload: NotificationPayload) {
    const { type, message, details, userId } = payload;
    const timestamp = new Date().toISOString();

    // 1. Console Log (Always active for debug)
    console.log(`[NOTIFICATION - ${type}] ${timestamp}: ${message}`, details);

    // 2. Slack Webhook (If configured)
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (slackWebhookUrl) {
        try {
            await fetch(slackWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `*${type}*: ${message}`,
                    attachments: details ? [{
                        color: type === 'FORM_REJECTED' ? '#ef4444' : '#22c55e',
                        fields: Object.entries(details).map(([k, v]) => ({
                            title: k,
                            value: String(v),
                            short: true
                        }))
                    }] : []
                })
            });
        } catch (error) {
            console.error("Failed to send Slack notification", error);
        }
    }

    // 3. Email (Simulation)
    // Real implementation would use nodemailer here
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
        console.log(`[EMAIL SIMULATION] To: Admin | Subject: ${type} | Body: ${message}`);
    }
}
