import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { dbAdmin } from '@/lib/firebase/admin-config';

const genAI = new GoogleGenAI({ 
  apiKey: (process.env.GEMINI_API_KEY ?? '').trim() 
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context, userName, userRole = 'cliente' } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ message: "Configura la KEY de Gemini." });
    }

    // 1. Bypassing Client SDK security via Admin SDK for the Chat Context
    // We fetch products and settings directly through Admin SDK
    const [productsSnap, settingsSnap] = await Promise.all([
      dbAdmin.collection('products').where('isActive', '==', true).get(),
      dbAdmin.collection('settings').doc('app').get()
    ]);

    const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    const settings = settingsSnap.exists ? settingsSnap.data() as any : null;

    const privilegedRoles = ['admin', 'vendedor', 'secretaria', 'finanzas', 'dev'];
    const canSeePrices = privilegedRoles.includes(userRole);

    const productList = products.map(p => {
      const base = `- ${p.name}: ${p.size}, ${p.finish}.`;
      const price = canSeePrices ? ` $${p.pricePerM2}/m². Stock: ${p.stock} cj.` : ' [Pedir cotización]';
      return `${base}${price}${p.isOffer ? ' [OFERTA]' : ''}${p.images?.[0] ? ` [Img: ${p.images[0]}]` : ''}`;
    }).join('\n');

    const SYSTEM_PROMPT = `Eres RANI, asistente de "RAN Pisos".
Voseo rioplatense.
${userName ? `Le hablas a ${userName}.` : ''}

## FLUJO DE TRABAJO (OBLIGATORIO):
1. Charla y recomendación de productos. MUESTRA FOTOS con ![nombre](url).
2. Pregunta metros del ambiente.
3. CALCULA: m2 * 1.10 (desperdicio). Redondea cajas arriba.
4. MUESTRA EL PRESUPUESTO COMPLETO (en una tabla con etiquetas [MATERIAL]).
5. SÓLO DESPUÉS de mostrar el presupuesto, pide Nombre, Email o Celular.

## REGLAS CRÍTICAS:
- NUNCA pidas datos de contacto antes de mostrar el presupuesto final. El valor para el cliente es el cálculo.
- IMÁGENES: Usá SIEMPRE ![nombre](URL). Si no ponés el '!', no se ve.

## CATÁLOGO:
${productList}

## FORMATO PRESUPUESTO:
PRESUPUESTO_GENERADO:
[MATERIAL]
- Producto: [Nombre]
- m2_cliente: [m²]
- Cajas: [cant]
- Precio_caja: $[monto]
- Subtotal: $[monto]
[FIN_MATERIAL]
TOTAL_MATERIALES: $[total]`;

    // 2. Model Rotation - Handling Rate Limits (Free Tier quota)
    // Adding more variants to bypass potential specific model quotas
    const models = [
      'gemini-2.0-flash', 
      'gemini-2.5-flash', 
      'gemini-2.0-flash-lite', 
      'gemini-1.5-pro'
    ];
    let text = '';
    let success = false;
    let quotaError = false;

    for (const modelId of models) {
      if (success) break;
      try {
        console.log(`[Chat API] Executing via ${modelId}...`);
        const response = await genAI.models.generateContent({
          model: modelId,
          contents: (messages || []).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          config: { systemInstruction: SYSTEM_PROMPT }
        });

        if (response.text) {
          text = response.text;
          success = true;
        }
      } catch (err: any) {
        console.warn(`[Chat API] ${modelId} failed:`, err.message);
        if (err.message?.includes('RESOURCE_EXHAUSTED')) quotaError = true;
      }
    }

    if (!success) {
      const msg = quotaError 
        ? "Lo siento, RANI está un poco cansada por hoy (límite de cuota excedido). Por favor reintentá en unos minutos o contactanos por WhatsApp."
        : "Error de conexión con RANI.";
      return NextResponse.json({ message: msg });
    }

    return NextResponse.json({ message: text });
  } catch (err: any) {
    console.error('[Chat API Error]:', err);
    return NextResponse.json({ message: "Ups! Hubo un problema al procesar tu mensaje." });
  }
}
