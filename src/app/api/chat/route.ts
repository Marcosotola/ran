import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

const SYSTEM_PROMPT = `Eres el asistente de ventas de RAN Pisos & Revestimientos, una empresa argentina especializada en pisos y revestimientos cerámicos.

Tu nombre es RANI (RAN Inteligencia).

## Tu rol:
- Asesorar a los clientes sobre qué productos elegir para su espacio
- Calcular cuántas cajas necesitan según los m² que indiquen (con 10% de desperdicio)
- Generar presupuestos con los productos que el cliente elija
- Ser amigable, profesional y hablar en español rioplatense (vos, che, etc.)

## Reglas IMPORTANTES:
1. NO incluyes costos de mano de obra, pegamento ni pastina — SOLO el costo de los materiales (cajas de cerámicos)
2. Si el cliente pregunta por mano de obra, decí que eso se coordina directamente con el vendedor asignado
3. Cuando calcules cajas, SIEMPRE agrega 10% de desperdicio: cajas = ceil(m² * 1.10 / m²_por_caja)
4. Cuando el cliente esté listo para aceptar el presupuesto, pedí su nombre, email y teléfono
5. Solo transfiere la información de contacto cuando el cliente ACEPTE explícitamente el presupuesto

## Catálogo disponible (resumen por formato):
- Pisos 56×56 cm: ~27 modelos, acabados brillante/mate/pulido
- Pisos 35×35 cm: ~33 modelos, variedad de colores y acabados  
- Pisos 18×56 cm (tipo madera): ~12 modelos
- Pisos/Paredes 31×53 cm: ~23 modelos

## Información de precios y especificaciones:
Los precios exactos dependen del modelo. Cuando el cliente elija un producto, consultá el catálogo para dar el precio correcto. Si no tenés el precio exacto, decile que se lo confirma el vendedor.

## Flujo de atención:
1. Saludar y preguntar qué ambiente quiere revestir
2. Consultar m² aproximados
3. Recomendar 2-3 opciones de productos según el estilo y presupuesto
4. Calcular cajas necesarias
5. Mostrar presupuesto de materiales
6. Preguntar si quiere proceder — si sí, pedir datos de contacto

## Formato de presupuesto (cuando lo generes):
Usar este formato exacto para que el sistema lo detecte:

PRESUPUESTO_GENERADO:
- Producto: [nombre]
- Tamaño: [XxY cm]
- m²: [número]
- Cajas: [número]
- Precio/caja: $[precio]
- Subtotal: $[precio]
TOTAL_MATERIALES: $[total]

Sé cálido, útil y no presiones al cliente. Si tiene dudas, ayudalo a entender las diferencias entre productos.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      // Mock response when no API key is configured
      return NextResponse.json({
        message: generateMockResponse(messages[messages.length - 1]?.content ?? ''),
        mock: true,
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build chat history (excluding last message which is the new one)
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history,
      systemInstruction: SYSTEM_PROMPT + (context ? `\n\nContexto adicional: ${context}` : ''),
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    return NextResponse.json({ message: text });
  } catch (err) {
    console.error('[Chat API Error]', err);
    return NextResponse.json(
      { error: 'Error al procesar el mensaje. Intentá de nuevo.' },
      { status: 500 },
    );
  }
}

function generateMockResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes('hola') || msg.includes('buenos') || msg.includes('buenas')) {
    return '¡Hola! Soy RANI, el asistente de RAN Pisos & Revestimientos 👋\n\n¿En qué te puedo ayudar hoy? Podés contarme qué ambiente querés renovar y te ayudo a elegir el mejor piso o revestimiento.';
  }
  if (msg.includes('baño') && (msg.includes('m2') || msg.includes('m²') || /\d/.test(msg))) {
    const match = msg.match(/(\d+(?:\.\d+)?)/);
    const m2 = match ? parseFloat(match[1]) : 8;
    const boxes = Math.ceil((m2 * 1.1) / 1.56);
    return `¡Genial! Para un baño de ${m2} m², te recomiendo revestimientos de pared en formato 31×53 cm.\n\nCalculando con 10% de desperdicio:\n- **Cajas necesarias: ${boxes} cajas** (${(1.56 * boxes).toFixed(1)} m² aprox.)\n\nTe recomiendo estos modelos:\n1. **Revestimiento Blanco Brillante 31×53** — ideal para ampliar visualmente el espacio\n2. **Revestimiento Gris Perla 31×53** — moderno y fácil de mantener\n3. **Revestimiento Mármol Blanco 31×53** — premium y elegante\n\n¿Cuál de estos te gusta más? También te puedo calcular el presupuesto si me decís cuál preferís.`;
  }
  if (msg.includes('precio') || msg.includes('costo') || msg.includes('cuanto')) {
    return 'Los precios varían según el modelo y el formato. Aquí te doy un rango general:\n\n- **Pisos 35×35 cm:** desde $8.000 hasta $15.000 por caja\n- **Pisos 56×56 cm:** desde $12.000 hasta $22.000 por caja\n- **Revestimientos 31×53 cm:** desde $9.000 hasta $18.000 por caja\n\n*Los precios están en ARS. Para un presupuesto exacto, contame qué ambiente y cuántos m² tenés 🙂*';
  }
  if (msg.includes('presupuesto') || msg.includes('cotizacion') || msg.includes('cotización')) {
    return 'Para hacerte un presupuesto preciso necesito saber:\n\n1. 📐 ¿Cuántos m² tiene el ambiente?\n2. 🛋️ ¿Es piso o pared (o ambos)?\n3. 🎨 ¿Tenés alguna preferencia de color o estilo?\n\nCon eso te armo el presupuesto con la cantidad exacta de cajas que necesitás.';
  }
  return 'Entendido! Estoy acá para ayudarte a elegir el mejor piso o revestimiento.\n\n¿Podés contarme qué ambiente querés renovar y cuántos m² tiene aproximadamente? Así te puedo dar una recomendación personalizada y calcular exactamente cuántas cajas necesitás 😊';
}
