import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase/admin-config';
import { Subscription } from '@/lib/types';

// El documento de configuración en Firestore
const SETTINGS_DOC = 'settings/app';

/**
 * Webhook de Mercado Pago — RAN Pisos & Revestimientos
 *
 * Configurar en: https://www.mercadopago.com.ar/developers/panel/notifications/webhooks
 * Eventos a suscribir:
 *   ✅ payment
 *   ✅ subscription_preapproval
 */
export async function POST(request: Request) {
  if (!dbAdmin) {
    console.error('[MP Webhook] Admin SDK not initialized');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  try {
    const body = await request.json();
    console.log('[MP Webhook] Received:', JSON.stringify(body, null, 2));

    const { type, action, data } = body;

    // ── 1. PAGO APROBADO ────────────────────────────────────────────────────
    // MP cobra (manual o automáticamente) → activar y extender la suscripción
    const isPaymentEvent = 
      type === 'payment' || 
      action === 'payment.created' || 
      action === 'payment.updated' ||
      (type === 'subscription_preapproval' && (action === 'payment.created' || action === 'payment.updated'));

    if (isPaymentEvent) {
      console.log('[MP Webhook] Payment received → Reactivating service...');

      const last = new Date();
      const next = new Date();
      next.setMonth(next.getMonth() + 1);

      // Usamos el Admin SDK para evitar errores de PERMISSION_DENIED
      // y usamos dot-notation para no pisar otros campos de settings/app
      await dbAdmin.collection('settings').doc('app').update({
        'subscription.status': 'active',
        'subscription.lastPaymentDate': last,
        'subscription.nextPaymentDate': next,
        'subscription.mpLastAction': action || type,
        'updatedAt': adminTimestamp(),
      });

      console.log('[MP Webhook] Subscription activated successfully via Admin SDK');
      return NextResponse.json({ received: true, action: 'activated' });
    }

    // ── 2. ESTADO DE SUSCRIPCIÓN CAMBIADO ────────────────────────────────────
    // El admin pausó o canceló la suscripción desde el portal de MP o vía API
    const isSubscriptionEvent = 
      type === 'subscription_preapproval' || 
      action === 'subscription_preapproval.updated';

    if (isSubscriptionEvent && data?.id) {
      console.log('[MP Webhook] Subscription update, preapproval id:', data.id);

      // ⚠️ IMPORTANTE: Priorizar MERCADOPAGO_ACCESS_TOKEN para evitar el placeholder
      const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;

      if (mpToken && !mpToken.includes('your_')) {
        try {
          const mpRes = await fetch(
            `https://api.mercadopago.com/preapproval/${data.id}`,
            { headers: { Authorization: `Bearer ${mpToken}` } }
          );
          
          if (!mpRes.ok) throw new Error(`MP API responded with ${mpRes.status}`);
          
          const preapproval = await mpRes.json();
          console.log('[MP Webhook] Preapproval status from MP API:', preapproval.status);

          // Mapeamos los estados oficiales de MP a nuestra lógica
          let newStatus = 'pending';
          if (preapproval.status === 'authorized') newStatus = 'active';
          if (preapproval.status === 'paused') newStatus = 'paused';
          if (preapproval.status === 'cancelled') newStatus = 'cancelled';

          await dbAdmin.collection('settings').doc('app').update({
            'subscription.status': newStatus,
            'subscription.mpStatus': preapproval.status,
            'updatedAt': adminTimestamp(),
          });
          
          console.log(`[MP Webhook] Subscription status synced to: ${newStatus}`);
        } catch (mpError: any) {
          console.error('[MP Webhook] Failed to sync with MP API:', mpError.message);
        }
      } else {
        console.warn('[MP Webhook] Skipping API check: Valid MP_ACCESS_TOKEN not found');
      }

      return NextResponse.json({ received: true, action: 'subscription_synced' });
    }

    // Evento no manejado — respondemos 200 para que MP no reintente
    console.log('[MP Webhook] Unhandled event type/action:', { type, action });
    return NextResponse.json({ received: true, action: 'ignored' });

  } catch (error: any) {
    console.error('[MP Webhook] Fatal Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper para server timestamp con Admin SDK
function adminTimestamp() {
  const admin = require('firebase-admin');
  return admin.firestore.FieldValue.serverTimestamp();
}

// GET para verificación
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    description: 'RAN MP Webhook (Admin Node)',
    timestamp: new Date().toISOString()
  });
}
