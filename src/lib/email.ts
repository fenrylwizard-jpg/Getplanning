import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
}

/**
 * Send an email via Resend.
 * Requires RESEND_API_KEY environment variable.
 * Uses onboarding@resend.dev as sender for unverified domains.
 */
export async function sendEmail({ to, subject, html }: EmailOptions) {
    const from = process.env.EMAIL_FROM || 'GetPlanning <onboarding@resend.dev>';

    try {
        const result = await resend.emails.send({
            from,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        });
        return { success: true, data: result };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error };
    }
}
