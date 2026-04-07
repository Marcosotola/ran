import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { dbAdmin } from '@/lib/firebase/admin-config';

const genAI = new GoogleGenAI({ 
  apiKey: (process.env.GEMINI_API_KEY ?? '').trim() 
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context, userName, userRole = 'cliente', mode } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ message: "Configura la KEY de Gemini." });
    }

    // 1. Check if Admin SDK is ready
    if (!dbAdmin) {
      console.error('[Chat API] Firebase Admin SDK NOT initialized.');
      return NextResponse.json({ message: "Sistema en mantenimiento." });
    }

    const privilegedRoles = ['admin', 'vendedor', 'secretaria', 'finanzas', 'dev'];
    const hasPrivileges = privilegedRoles.includes(userRole);
    
    // El modo se determina por el parámetro 'mode' o por el rol si no se especifica
    // 'management' -> Analista de BI (solo para privileged)
    // 'technical'  -> Asesor de ventas (para todos)
    const effectiveMode = (mode === 'management' && hasPrivileges) ? 'management' : 'technical';
    const canSeePrices = hasPrivileges;

    // 2. Fetch Base Data (Always products)
    const [productsSnap, settingsSnap] = await Promise.all([
      dbAdmin.collection('products').where('isActive', '==', true).get(),
      dbAdmin.collection('settings').doc('app').get()
    ]);

    const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    
    // 3. Fetch Advanced Data if Management Mode
    let salesSummary = '';
    let expensesSummary = '';
    let leadsSummary = '';
    let usersSummary = '';

    if (effectiveMode === 'management') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [salesSnap, expensesSnap, leadsSnap, usersSnap] = await Promise.all([
        dbAdmin.collection('sales').where('createdAt', '>=', thirtyDaysAgo).limit(30).get(),
        dbAdmin.collection('expenses').orderBy('date', 'desc').limit(30).get(),
        dbAdmin.collection('leads').orderBy('createdAt', 'desc').limit(20).get(),
        dbAdmin.collection('users').get()
      ]);

      usersSummary = usersSnap.docs.map(d => {
        const data = d.data();
        return `- ${data.displayName || data.email} (ID: ${d.id}, Rol: ${data.role})`;
      }).join('\n');

      salesSummary = salesSnap.docs.map(d => {
        const data = d.data();
        return `- Venta: $${data.totalAmount || 0}, Cliente: ${data.clientName || 'N/A'}, Vendedor: ${data.vendorId || 'N/A'}, Fecha: ${data.createdAt?.toDate().toLocaleDateString()}`;
      }).join('\n');

      expensesSummary = expensesSnap.docs.map(d => {
        const data = d.data();
        return `- Gasto: $${data.amount}, Concepto: ${data.concept || data.category}, Fecha: ${data.date?.toDate().toLocaleDateString()}`;
      }).join('\n');

      leadsSummary = leadsSnap.docs.map(d => {
        const data = d.data();
        return `- Lead: ${data.clientName}, Email: ${data.clientEmail}, Fecha: ${data.createdAt?.toDate().toLocaleDateString()}`;
      }).join('\n');
    }

    const productList = products.map(p => {
      const base = `- ${p.name}: ${p.size}, ${p.finish}.`;
      const price = canSeePrices ? ` $${p.pricePerM2}/m². Stock: ${p.stock} cj.` : ' [Pedir cotización]';
      return `${base}${price}${p.isOffer ? ' [OFERTA]' : ''}${p.images?.[0] ? ` [Img: ${p.images[0]}]` : ''}`;
    }).join('\n');

    // 4. Determine Persona
    let SYSTEM_PROMPT = '';

    if (effectiveMode === 'management') {
      SYSTEM_PROMPT = `Eres el "Analista de Gestión de RAN", un experto en Business Intelligence, analista de datos y auditor interno.
Tu función es asistir al Administrador y al equipo comercial en la interpretación de las métricas del negocio.

REGLAS DE IDENTIDAD:
- Tono: Profesional, ejecutivo, analítico y muy preciso. Usas voseo rioplatense (fijate, tenés). No utilices la palabra "che".
- Eres el Copiloto de Gestión. No asesoras clientes, asesoras dueños de negocio.

CAPACIDADES DE CÁLCULO:
- Eres experto en matemáticas financieras. Calculas rentabilidad, promedios y balances.
- Importante: Si te piden stock, resaltá en negrita los productos con menos de 10 unidades.

DATOS DE GESTIÓN (Últimos 30 días):
## EQUIPO RAN (Vendedores y Admins):
${usersSummary || 'No hay usuarios registrados.'}

## VENTAS:
${salesSummary || 'No hay ventas registradas recientemente.'}

## GASTOS:
${expensesSummary || 'No hay gastos registrados recientemente.'}

## LEADS (Presupuestos interesados):
${leadsSummary || 'No hay leads recientes.'}

## CATÁLOGO COMPLETO (Stock y Precios):
${productList}

ANÁLISIS DE RENDIMIENTO:
- Si ves que un ID en las ventas coincide con un ID de tu lista de Equipo, menciona al vendedor por su nombre.
- Ayudá al admin a identificar quién está cerrando más ventas o si hay un lead sin seguimiento.
- Si ves ventas sin vendedor asignado ("manual" o "N/A"), mencionalo como una observación.

REGLA DE ORO: Tienes libertad total para hablar de dinero, márgenes y costos operativos ya que este es el canal privado de administración.`;
    } else {
      SYSTEM_PROMPT = `Eres el Asistente Técnico de "RAN Pisos & Revestimientos".
Tu tono es el de un asesor experto en obra, cordial y profesional. Usas voseo rioplatense (tenés, buscás). Evitá el uso de la palabra "che".
${userName ? `Te estás dirigiendo a ${userName}.` : ''}

## FILOSOFÍA DE ATENCIÓN:
- No digas "Soy una IA" o "Soy un modelo de lenguaje". Eres parte del equipo de RAN.
- Tu misión es quitarle peso al cliente: ayudale con los cálculos técnicos y recomendale lo mejor para su ambiente (baño, cocina, exterior, alto tránsito).

## FLUJO DE TRABAJO (OBLIGATORIO):
1. Asesoramiento: Recomendá productos del catálogo. MUESTRA FOTOS con ![nombre](url).
2. Relevamiento: Preguntá los metros cuadrados del ambiente.
3. Cálculo Profesional: Sumá SIEMPRE un 10% de desperdicio. Ej: "Para tus 20m², calculé 22m² (incluyendo el 10% de desperdicio por cortes) lo que equivale a X cajas".
4. Presupuesto: Mostrá el bloque [MATERIAL] con los datos.
5. Cierre: Una vez mostrado el presupuesto, explicá que para congelar precio o coordinar envío necesitás sus datos para que un vendedor lo contacte.

## REGLAS DE FORMATO:
- Usa negritas para resaltar nombres de productos y cantidades.
- IMÁGENES: Usá SIEMPRE ![nombre](URL).

## CATÁLOGO:
${productList}

## FORMATO TÉCNICO DE PRESUPUESTO:
PRESUPUESTO_GENERADO:
[MATERIAL]
- Producto: [Nombre]
- m2_cliente: [m²]
- Pallets: [cant]
- Precio_m2: $[monto]
- Subtotal: $[monto]
[FIN_MATERIAL]
TOTAL_MATERIALES: $[total]`;
    }

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
        ? "Lo siento, nuestro sistema de asesoramiento técnico está experimentando una alta demanda. Por favor reintentá en unos minutos o contactanos por WhatsApp."
        : "Hubo un error de conexión con nuestro servicio de asesoría.";
      return NextResponse.json({ message: msg });
    }

    return NextResponse.json({ message: text });
  } catch (err: any) {
    console.error('[Chat API Error]:', err);
    return NextResponse.json({ message: "Ups! Hubo un problema al procesar tu mensaje." });
  }
}
