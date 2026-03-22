import { NextResponse } from 'next/server';
import { sendNotificationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { name, lastName, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status:400 });
    }

    // Enviamos email al Admin
    const result = await sendNotificationEmail({
      to: ['marcos.otola@gmail.com'], // El email del admin (usar env en prod)
      subject: `Nuevo mensaje de contacto de ${name} ${lastName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1B2A4A;">
          <h2 style="color: #3B82C4;">Has recibido un nuevo mensaje</h2>
          <p><strong>De:</strong> ${name} ${lastName || ''} (${email})</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border-left: 4px solid #3B82C4; margin-top: 10px;">
            <p><strong>Mensaje:</strong></p>
            <p>${message}</p>
          </div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 10px; color: #94a3b8;">Enviado automáticamente desde el formulario de contacto de RAN</p>
        </div>
      `,
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
       // Si falla Resend (falta API Key etc)
       return NextResponse.json({ error: 'Error enviando el correo', detail: result.error }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
