import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase/admin-config';
import * as admin from 'firebase-admin';
import { sendNotificationEmail } from '@/lib/email';
import { sendPushNotification } from '@/lib/firebase/admin-messaging';

export async function POST(req: NextRequest) {
  try {
    // 0. Defensive Check
    if (!dbAdmin) {
      return NextResponse.json({ error: 'Admin SDK not initialized' }, { status: 500 });
    }
    const body = await req.json();
    const { 
      clientName, 
      clientEmail, 
      clientPhone, 
      clientId, 
      items, 
      totalMaterials, 
      aiConversationLog 
    } = body;

    if (!clientName || !clientEmail || !clientPhone) {
      return NextResponse.json({ error: 'Faltan datos de contacto' }, { status: 400 });
    }

    // 1. Backend Vendor Assignment (Secure & Stable with Admin SDK)
    let assignedVendorId = null;
    try {
      const vendorsSnap = await dbAdmin.collection('users')
        .where('role', '==', 'vendedor')
        .where('isActive', '==', true)
        .limit(10)
        .get();
        
      if (!vendorsSnap.empty) {
        const vendors = vendorsSnap.docs;
        assignedVendorId = vendors[Math.floor(Math.random() * vendors.length)].id;
      }
    } catch (err) {
      console.warn('[Leads API] Error assigning vendor:', err);
    }

    // 2. Create the Quote/Lead doc via Admin SDK (Bypasses security rules)
    const quoteData = {
      clientName,
      clientEmail,
      clientPhone,
      clientId: clientId || null,
      items: items || [],
      totalMaterials: totalMaterials || 0,
      grandTotal: totalMaterials || 0,
      status: 'sent',
      assignedVendorId,
      aiConversationLog: aiConversationLog || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'chat_ai'
    };

    const docRef = await dbAdmin.collection('quotes').add(quoteData);

    console.log(`[Leads API] Lead created successfully: ${docRef.id}`);

    // 3. Notificación vía Email (Resend)
    // Buscamos el email del vendedor asignado si existe
    const adminEmail = process.env.ADMIN_EMAIL || 'marcos.otola@gmail.com';
    let vendorEmail = adminEmail; // Fallback admin
    if (assignedVendorId) {
      const v = await dbAdmin.collection('users').doc(assignedVendorId).get();
      if (v.exists && v.data()?.email) vendorEmail = v.data()?.email;
    }

    await sendNotificationEmail({
      to: [vendorEmail, adminEmail],
      replyTo: clientEmail,
      subject: `🚀 NUEVO LEAD de ${clientName} (vía RANI AI)`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden; color: #1B2A4A;">
          <div style="background: #1B2A4A; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900 italic;">RAN Pisos & Revestimientos</h1>
            <p style="margin: 5px 0 0; opacity: 0.7;">¡Nuevo Presupuesto Generado por la IA!</p>
          </div>
          <div style="padding: 40px;">
            <h2 style="color: #3B82C4; margin-top: 0;">Resumen del Cliente</h2>
            <p><strong>Nombre:</strong> ${clientName}</p>
            <p><strong>WhatsApp:</strong> ${clientPhone}</p>
            <p><strong>Email:</strong> ${clientEmail}</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
            
            <h3 style="margin-bottom: 20px;">Detalle del Pedido:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc; text-align: left; font-size: 11px; text-transform: uppercase;">
                  <th style="padding: 10px;">Producto</th>
                  <th style="padding: 10px;">Cajas</th>
                  <th style="padding: 10px;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${items?.map((it: any) => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${it.name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${it.boxes}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${it.subtotal ? it.subtotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="margin-top: 30px; text-align: right;">
              <p style="font-size: 20px; font-weight: 900; color: #1B2A4A;">Total: ${totalMaterials?.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</p>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            <p>Accede al panel de administración para gestionar este contacto.</p>
            <a href="https://ran-app.com/admin/presupuestos" style="display: inline-block; padding: 10px 20px; background: #3B82C4; color: white; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 10px;">IR AL PANEL</a>
          </div>
        </div>
      `,
    });

    // 4. Notificación PUSH (FCM)
    // Notificamos al vendedor
    if (assignedVendorId) {
      await sendPushNotification(
        assignedVendorId,
        '🚀 Nuevo Lead Asignado',
        `${clientName} acaba de generar un presupuesto por ${totalMaterials.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`,
        { type: 'lead', leadId: docRef.id }
      );
    }

    // Notificamos a los Admins (esto se puede skipear si hay muchos, pero por ahora...)
    const adminsSnap = await dbAdmin.collection('users').where('role', '==', 'admin').get();
    for (const adminDoc of adminsSnap.docs) {
      await sendPushNotification(
        adminDoc.id,
        '💼 Venta Potencial (IA)',
        `${clientName} contactó a RANI. Monto: ${totalMaterials.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`,
        { type: 'lead', leadId: docRef.id }
      );
    }

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      assignedVendorId 
    });
  } catch (err: any) {
    console.error('[Leads API] Error:', err);
    return NextResponse.json({ error: 'Error al procesar el lead: ' + err.message }, { status: 500 });
  }
}
