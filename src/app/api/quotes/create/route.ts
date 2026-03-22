import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase/admin-config';
import * as admin from 'firebase-admin';
import { sendNotificationEmail } from '@/lib/email';
import { sendPushNotification } from '@/lib/firebase/admin-messaging';

/**
 * POST /api/quotes/create
 *
 * Centraliza la creación de presupuestos manuales (desde el panel admin).
 * Guarda el doc en Firestore (vía Admin SDK), asigna vendedor si no viene uno,
 * y dispara Email + Push a vendedor y admins.
 *
 * Body:
 *   clientName, clientPhone?, clientEmail?,
 *   items[], shipping, totalMaterials, grandTotal,
 *   assignedVendorId? (si ya viene asignado desde el form)
 *   createdByUserId: uid del admin que lo creó
 */
export async function POST(req: NextRequest) {
  if (!dbAdmin) {
    return NextResponse.json({ error: 'Admin SDK no inicializado' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const {
      clientName,
      clientPhone,
      clientEmail,
      items,
      shipping,
      totalMaterials,
      grandTotal,
      assignedVendorId: incomingVendorId,
      createdByUserId,
    } = body;

    if (!clientName) {
      return NextResponse.json({ error: 'El nombre del cliente es obligatorio' }, { status: 400 });
    }

    // 1. Usar el vendedor que viene del form; si no hay, asignar uno al azar
    let assignedVendorId = incomingVendorId || null;
    if (!assignedVendorId) {
      try {
        const vendorsSnap = await dbAdmin.collection('users')
          .where('role', '==', 'vendedor')
          .where('isActive', '==', true)
          .limit(10)
          .get();
        if (!vendorsSnap.empty) {
          const vendorList = vendorsSnap.docs;
          assignedVendorId = vendorList[Math.floor(Math.random() * vendorList.length)].id;
        }
      } catch (err) {
        console.warn('[Quotes API] Error assigning vendor:', err);
      }
    }

    // 2. Guardar en Firestore
    const quoteData = {
      clientName,
      clientPhone: clientPhone || null,
      clientEmail: clientEmail || null,
      items: items || [],
      shipping: shipping || 0,
      totalMaterials: totalMaterials || 0,
      grandTotal: grandTotal || 0,
      status: 'sent',
      assignedVendorId,
      createdByUserId: createdByUserId || null,
      source: 'manual_admin',
      aiConversationLog: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await dbAdmin.collection('quotes').add(quoteData);
    console.log(`[Quotes API] Quote created: ${docRef.id}`);

    // 3. Email — buscar email del vendedor asignado
    const adminEmail = process.env.ADMIN_EMAIL || 'marcos.otola@gmail.com';
    let vendorEmail = adminEmail;
    let vendorName = 'Vendedor';

    if (assignedVendorId) {
      const vDoc = await dbAdmin.collection('users').doc(assignedVendorId).get();
      if (vDoc.exists && vDoc.data()?.email) {
        vendorEmail = vDoc.data()!.email;
        vendorName = vDoc.data()!.displayName || vendorEmail;
      }
    }

    const recipients = Array.from(new Set([vendorEmail, adminEmail]));

    await sendNotificationEmail({
      to: recipients,
      subject: `📋 NUEVO PRESUPUESTO MANUAL — ${clientName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; color: #1B2A4A;">
          <div style="background: #1B2A4A; padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 22px; font-weight: 900;">RAN Pisos &amp; Revestimientos</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.6); font-size: 14px;">Nuevo Presupuesto Creado Manualmente</p>
          </div>
          <div style="padding: 40px;">
            <h2 style="color: #3B82C4; margin-top: 0;">Datos del Cliente</h2>
            <p><strong>Nombre:</strong> ${clientName}</p>
            ${clientPhone ? `<p><strong>WhatsApp:</strong> ${clientPhone}</p>` : ''}
            ${clientEmail ? `<p><strong>Email:</strong> ${clientEmail}</p>` : ''}
            <p><strong>Vendedor asignado:</strong> ${vendorName}</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />

            <h3>Detalle de Materiales</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc; text-align: left; font-size: 11px; text-transform: uppercase;">
                  <th style="padding: 10px;">Producto</th>
                  <th style="padding: 10px; text-align: center;">Cajas</th>
                  <th style="padding: 10px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${(items || []).map((it: any) => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${it.name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: center;">${it.boxes}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: right;">${
                      it.subtotal
                        ? it.subtotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
                        : '-'
                    }</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            ${shipping > 0 ? `<p style="text-align: right; margin-top: 10px; color: #64748b;">Flete: ${Number(shipping).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</p>` : ''}

            <div style="margin-top: 20px; text-align: right; background: #f8fafc; padding: 20px; border-radius: 12px;">
              <p style="font-size: 22px; font-weight: 900; color: #1B2A4A; margin: 0;">
                Total: ${Number(grandTotal || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </p>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ran-pisos.vercel.app'}/admin/presupuestos"
               style="display: inline-block; padding: 10px 24px; background: #3B82C4; color: white; border-radius: 10px; text-decoration: none; font-weight: bold;">
              VER EN EL PANEL →
            </a>
          </div>
        </div>
      `,
      replyTo: clientEmail || undefined,
    });

    // 4. Push — al vendedor asignado
    if (assignedVendorId) {
      await sendPushNotification(
        assignedVendorId,
        '📋 Nuevo presupuesto asignado',
        `${clientName} — Total: ${Number(grandTotal || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`,
        { type: 'quote', quoteId: docRef.id }
      );
    }

    // 5. Push — a todos los admins
    const adminsSnap = await dbAdmin.collection('users').where('role', '==', 'admin').get();
    for (const adminDoc of adminsSnap.docs) {
      if (adminDoc.id === assignedVendorId) continue; // No duplicar si el admin es el vendedor
      await sendPushNotification(
        adminDoc.id,
        '📋 Presupuesto creado manualmente',
        `${clientName} — Total: ${Number(grandTotal || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`,
        { type: 'quote', quoteId: docRef.id }
      );
    }

    return NextResponse.json({ success: true, id: docRef.id, assignedVendorId });
  } catch (err: any) {
    console.error('[Quotes API] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
