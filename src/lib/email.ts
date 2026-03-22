import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNotificationEmail({ to, subject, html, replyTo }: { to: string[], subject: string, html: string, replyTo?: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Resend] Error: API Key no configurada');
    return { success: false, error: 'API Key missing' };
  }

  try {
    const from = process.env.EMAIL_FROM || 'RAN <onboarding@resend.dev>';
    
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
      replyTo: replyTo
    });

    console.log('[Resend] Email enviado con éxito:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Resend] Error fatal enviando email:', error);
    return { success: false, error };
  }
}
