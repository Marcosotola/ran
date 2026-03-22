import { NextRequest, NextResponse } from 'next/server';

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;

/**
 * POST /api/subscription/create-plan
 * 
 * Crea un plan de suscripción recurrente en Mercado Pago (Preapproval Plan).
 * Devuelve el init_point (link de suscripción) y el plan ID.
 *
 * Body: { amount: number, reason?: string, backUrl?: string }
 */
export async function POST(req: NextRequest) {
  if (!MP_TOKEN) {
    return NextResponse.json(
      { error: 'MERCADOPAGO_ACCESS_TOKEN no configurado en las variables de entorno.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { amount, reason, backUrl } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser un número mayor a 0.' },
        { status: 400 }
      );
    }

    const planPayload = {
      reason: reason || 'RAN Pisos - Suscripción mensual al sistema de gestión',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: Number(amount),
        currency_id: 'ARS',
      },
      back_url: backUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://ran-pisos.vercel.app'}/admin/ajustes`,
      payment_methods_allowed: {
        payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }],
      },
    };

    console.log('[MP] Creating preapproval plan:', planPayload);

    const mpResponse = await fetch('https://api.mercadopago.com/preapproval_plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MP_TOKEN}`,
      },
      body: JSON.stringify(planPayload),
    });

    const plan = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('[MP] Error creating plan:', plan);
      return NextResponse.json(
        { error: plan.message || 'Error al crear el plan en Mercado Pago', details: plan },
        { status: mpResponse.status }
      );
    }

    console.log('[MP] Plan created successfully:', plan.id);

    return NextResponse.json({
      success: true,
      planId: plan.id,
      checkoutUrl: plan.init_point,   // Link que el admin usará para suscribirse
      managementUrl: `https://www.mercadopago.com.ar/subscriptions`,
      plan,
    });
  } catch (error) {
    console.error('[MP] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar la solicitud.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subscription/create-plan
 * Lista los planes existentes en MP (útil para evitar duplicados)
 */
export async function GET() {
  if (!MP_TOKEN) {
    return NextResponse.json({ error: 'Token no configurado' }, { status: 500 });
  }

  try {
    const res = await fetch(
      'https://api.mercadopago.com/preapproval_plan/search?status=active&limit=10',
      { headers: { Authorization: `Bearer ${MP_TOKEN}` } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error al consultar planes' }, { status: 500 });
  }
}
