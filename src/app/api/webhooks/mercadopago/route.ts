import { NextResponse } from 'next/server';
import { updateSubscription } from '@/lib/firebase/settings';

/**
 * Webhook de Mercado Pago — RAN Pisos & Revestimientos
 *
 * Configurar en: https://www.mercadopago.com.ar/developers/panel/notifications/webhooks
 * URL:   https://TU-DOMINIO/api/webhooks/mercadopago
 * Eventos a suscribir:
 *   ✅ payment
 *   ✅ subscription_preapproval
 *
 * Flujo completo:
 *   1. Admin paga → MP dispara evento "payment" → activamos suscripción (+1 mes)
 *   2. Admin cancela en MP → MP dispara "subscription_preapproval" con status "cancelled"
 *      → consultamos la API de MP para verificar → pausamos la suscripción
 *   3. MP cobra automáticamente (recurrente) → mismo flujo que el punto 1
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[MP Webhook] Received:', JSON.stringify(body, null, 2));

    const { type, action, data } = body;

    // ── 1. PAGO APROBADO ────────────────────────────────────────────────────
    // MP cobra (manual o automáticamente) → activar y extender la suscripción
    const isPaymentEvent =
      type === 'payment' ||
      action === 'payment.created' ||
      action === 'payment.updated';

    if (isPaymentEvent) {
      console.log('[MP Webhook] Payment event → activating subscription');

      const last = new Date();
      const next = new Date();
      next.setMonth(next.getMonth() + 1);

      await updateSubscription({
        status: 'active',
        lastPaymentDate: last,
        nextPaymentDate: next,
      });

      return NextResponse.json({ received: true, action: 'activated' });
    }

    // ── 2. ESTADO DE SUSCRIPCIÓN CAMBIADO ────────────────────────────────────
    // El admin pausó o canceló la suscripción desde el portal de MP
    const isSubscriptionEvent =
      type === 'subscription_preapproval' ||
      action === 'subscription_preapproval.updated';

    if (isSubscriptionEvent && data?.id) {
      console.log('[MP Webhook] Subscription event, preapproval id:', data.id);

      // Consultamos la API de MP para saber el estado real
      const mpToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;

      if (mpToken) {
        try {
          const mpRes = await fetch(
            `https://api.mercadopago.com/preapproval/${data.id}`,
            { headers: { Authorization: `Bearer ${mpToken}` } }
          );
          const preapproval = await mpRes.json();

          console.log('[MP Webhook] Preapproval status from MP:', preapproval.status);

          // Estados de MP → https://www.mercadopago.com.ar/developers/es/docs/subscriptions/additional-content/possible-statuses
          // authorized  → activa y al día
          // paused      → pausada por el usuario
          // cancelled   → dada de baja definitivamente
          // pending     → pendiente de pago
          if (preapproval.status === 'authorized') {
            await updateSubscription({ status: 'active' });
            console.log('[MP Webhook] Subscription re-authorized → active');
          } else if (preapproval.status === 'paused') {
            await updateSubscription({ status: 'paused' });
            console.log('[MP Webhook] Subscription paused by user');
          } else if (preapproval.status === 'cancelled') {
            await updateSubscription({ status: 'cancelled' });
            console.log('[MP Webhook] Subscription cancelled by user → service will be suspended');
          } else if (preapproval.status === 'pending') {
            await updateSubscription({ status: 'pending' });
            console.log('[MP Webhook] Subscription payment pending');
          }
        } catch (mpError) {
          console.error('[MP Webhook] Failed to fetch preapproval from MP API:', mpError);
          // No modificamos el estado si no podemos verificar con MP
        }
      } else {
        console.warn('[MP Webhook] No MP_ACCESS_TOKEN found — skipping preapproval status check');
      }

      return NextResponse.json({ received: true, action: 'subscription_updated' });
    }

    // Evento no manejado — respondemos 200 para que MP no reintente
    console.log('[MP Webhook] Unhandled event:', { type, action });
    return NextResponse.json({ received: true, action: 'ignored' });

  } catch (error) {
    console.error('[MP Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET para verificar que el endpoint está vivo (útil para debugging)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhooks/mercadopago',
    description: 'Webhook de Mercado Pago — RAN Pisos & Revestimientos',
    events: ['payment', 'subscription_preapproval'],
    timestamp: new Date().toISOString(),
  });
}
