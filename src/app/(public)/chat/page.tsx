'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { createQuote, assignRandomVendor } from '@/lib/firebase/quotes';
import { getProduct } from '@/lib/firebase/products';
import { ChatMessage, QuoteItem } from '@/lib/types';
import { calcBoxes, formatARS } from '@/lib/utils/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
// We'll use a simple markdown renderer for chat messages
const MarkdownMessage = ({ content }: { content: string }) => (
  <div className="prose prose-sm dark:prose-invert max-w-none text-current leading-relaxed text-sm
    [&>p]:mb-2 [&>p:last-child]:mb-0
    [&>ul]:mb-2 [&>ul]:pl-4 [&>ul>li]:mb-0.5
    [&>ol]:mb-2 [&>ol]:pl-4
    [&>strong]:font-bold
  ">
    {content.split('\n').map((line, i) => {
      // Bold
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={j}>{part.slice(2, -2)}</strong>
          : part
      );
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <p key={i} className="pl-3">• {parts.slice(1)}</p>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="mb-1">{parts}</p>;
    })}
  </div>
);

const WELCOME = `¡Hola! 👋 Soy **RANI**, el asistente de **RAN Pisos & Revestimientos**.

Puedo ayudarte a:
- Elegir el piso o revestimiento ideal para tu espacio
- Calcular cuántas cajas necesitás según los m²
- Generar un presupuesto de materiales

¿Qué ambiente querés renovar?`;

interface ContactForm {
  name: string;
  email: string;
  phone: string;
}

export default function ChatPage() {
  const { ranUser } = useAuth();
  const searchParams = useSearchParams();
  const productId = searchParams.get('producto');

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: WELCOME, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quoteAcceptedPhase, setQuoteAcceptedPhase] = useState(false);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: ranUser?.displayName ?? '',
    email: ranUser?.email ?? '',
    phone: ranUser?.phone ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [quoteDone, setQuoteDone] = useState(false);
  const [detectedQuote, setDetectedQuote] = useState<QuoteItem | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // If product context, send initial message
  useEffect(() => {
    if (productId) {
      getProduct(productId).then((p) => {
        if (!p) return;
        const ctxMsg = `Tengo una consulta sobre el producto: ${p.name} (${p.size} cm, ${p.finish}). Precio: ${formatARS(p.pricePerM2)}/m². ¿Podés ayudarme?`;
        handleSend(ctxMsg);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const detectQuoteInResponse = (text: string): QuoteItem | null => {
    if (!text.includes('PRESUPUESTO_GENERADO:')) return null;
    try {
      const lines = text.split('\n');
      const nameMatch = lines.find((l) => l.includes('Producto:'))?.match(/Producto:\s*(.+)/)?.[1];
      const m2Match = lines.find((l) => l.includes('m²:'))?.match(/m²:\s*([\d.]+)/)?.[1];
      const boxesMatch = lines.find((l) => l.includes('Cajas:'))?.match(/Cajas:\s*(\d+)/)?.[1];
      const priceMatch = lines.find((l) => l.includes('Precio/caja:'))?.match(/\$([\d.,]+)/)?.[1];
      const subtotalMatch = lines.find((l) => l.includes('Subtotal:'))?.match(/\$([\d.,]+)/)?.[1];
      if (!nameMatch || !m2Match || !boxesMatch || !priceMatch) return null;
      const price = parseFloat(priceMatch.replace(/\./g, '').replace(',', '.'));
      return {
        productId: 'ai-generated',
        name: nameMatch.trim(),
        size: '?',
        m2: parseFloat(m2Match),
        boxes: parseInt(boxesMatch),
        pricePerBox: price,
        subtotal: subtotalMatch ? parseFloat(subtotalMatch.replace(/\./g, '').replace(',', '.')) : price * parseInt(boxesMatch),
      };
    } catch {
      return null;
    }
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Check if response contains a quote
      const quote = detectQuoteInResponse(data.message);
      if (quote) setDetectedQuote(quote);

      // Detect if AI is asking for contact info (acceptance signal)
      const lower = data.message.toLowerCase();
      if (
        lower.includes('nombre') &&
        (lower.includes('email') || lower.includes('teléfono')) &&
        !quoteAcceptedPhase
      ) {
        setQuoteAcceptedPhase(true);
      }
    } catch (err) {
      toast.error('Error al conectar con la IA. Intentá de nuevo.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAcceptQuote = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.phone) {
      toast.error('Completá todos los campos de contacto');
      return;
    }
    setSubmitting(true);
    try {
      const vendorId = await assignRandomVendor();
      await createQuote({
        clientId: ranUser?.uid,
        clientName: contactForm.name,
        clientEmail: contactForm.email,
        clientPhone: contactForm.phone,
        items: detectedQuote ? [detectedQuote] : [],
        totalMaterials: detectedQuote?.subtotal ?? 0,
        grandTotal: detectedQuote?.subtotal ?? 0,
        status: 'sent',
        assignedVendorId: vendorId ?? undefined,
        aiConversationLog: messages,
      });
      setQuoteDone(true);
      toast.success('¡Presupuesto enviado! Un vendedor te va a contactar pronto.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `¡Perfecto, ${contactForm.name}! 🎉 Tu presupuesto fue enviado correctamente. Un vendedor de RAN te va a contactar pronto al email **${contactForm.email}** o al teléfono **${contactForm.phone}**.\n\n¡Gracias por elegirnos!`,
          timestamp: new Date(),
        },
      ]);
      setQuoteAcceptedPhase(false);
    } catch {
      toast.error('Error al enviar el presupuesto. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const SUGGESTIONS = [
    '¿Qué pisos me recomendás para living?',
    'Tengo baño de 6 m², ¿cuántas cajas necesito?',
    '¿Cuál es la diferencia entre brillante y mate?',
    'Quiero presupuesto para pisos de 30 m²',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-[#1B2A4A] py-6 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl ran-gradient flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                RANI
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block mr-1" />
                  En línea
                </Badge>
              </h1>
              <p className="text-white/60 text-sm">Asistente de RAN Pisos & Revestimientos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-3xl overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 animate-fade-in-up ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  msg.role === 'assistant'
                    ? 'ran-gradient shadow-md'
                    : 'bg-[#3B82C4]/20 border border-[#3B82C4]/30'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <Bot className="h-4 w-4 text-white" />
                ) : (
                  <User className="h-4 w-4 text-[#3B82C4]" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'assistant'
                    ? 'bg-card border border-border rounded-tl-sm'
                    : 'ran-gradient text-white rounded-tr-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <MarkdownMessage content={msg.content.replace(/PRESUPUESTO_GENERADO:[\s\S]*TOTAL_MATERIALES:[^\n]*/g, '[Presupuesto generado ✓]')} />
                ) : (
                  <p className="text-sm text-white leading-relaxed">{msg.content}</p>
                )}

                {/* Show detected quote card */}
                {msg.role === 'assistant' && msg.content.includes('PRESUPUESTO_GENERADO:') && detectedQuote && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-[#3B82C4]/30">
                    <div className="ran-gradient px-4 py-2">
                      <p className="text-white text-xs font-bold uppercase tracking-wider">Presupuesto</p>
                    </div>
                    <div className="bg-background px-4 py-3 space-y-1">
                      <p className="font-semibold text-sm">{detectedQuote.name}</p>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        <span>m²: <strong className="text-foreground">{detectedQuote.m2}</strong></span>
                        <span>Cajas: <strong className="text-foreground">{detectedQuote.boxes}</strong></span>
                        <span>Precio/caja: <strong className="text-foreground">{formatARS(detectedQuote.pricePerBox)}</strong></span>
                        <span>Subtotal: <strong className="text-foreground">{formatARS(detectedQuote.subtotal)}</strong></span>
                      </div>
                      <div className="pt-2">
                        <p className="font-black text-lg">{formatARS(detectedQuote.subtotal)}</p>
                        <p className="text-xs text-muted-foreground">Total materiales (IVA incluido)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full ran-gradient flex items-center justify-center shadow-md">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full bg-[#3B82C4] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contact form after quote acceptance */}
          {quoteAcceptedPhase && !quoteDone && (
            <div className="rounded-2xl border border-[#3B82C4]/30 bg-card overflow-hidden animate-fade-in-up">
              <div className="ran-gradient px-4 py-3">
                <h3 className="text-white font-bold flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar presupuesto
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">Completá tus datos y un vendedor te contactará para confirmar el pedido.</p>
                <div className="grid grid-cols-1 gap-3">
                  <Input
                    placeholder="Tu nombre completo"
                    value={contactForm.name}
                    onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                    className="text-sm"
                    id="contact-name"
                  />
                  <Input
                    type="email"
                    placeholder="Tu email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                    className="text-sm"
                    id="contact-email"
                  />
                  <Input
                    type="tel"
                    placeholder="Teléfono / WhatsApp"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                    className="text-sm"
                    id="contact-phone"
                  />
                </div>
                <Button
                  className="w-full ran-gradient text-white border-0 hover:opacity-90 font-semibold"
                  onClick={handleAcceptQuote}
                  disabled={submitting}
                  id="btn-accept-quote"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  {submitting ? 'Enviando...' : 'Confirmar y enviar presupuesto'}
                </Button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick suggestions (only at start) */}
      {messages.length === 1 && (
        <div className="container mx-auto px-4 pb-3 max-w-3xl">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="px-3 py-1.5 rounded-full text-xs border border-[#3B82C4]/30 text-[#3B82C4] hover:bg-[#3B82C4]/10 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm sticky bottom-0">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                placeholder="Escribí tu consulta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading || quoteDone}
                className="pr-12 h-12 rounded-xl border-[#3B82C4]/20 focus:border-[#3B82C4] text-sm"
                id="chat-input"
                autoComplete="off"
              />
              <Button
                onClick={() => handleSend()}
                disabled={loading || !input.trim() || quoteDone}
                size="icon"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 ran-gradient text-white border-0 hover:opacity-90 shadow"
                id="btn-send-chat"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            RANI calcula materiales • No incluye mano de obra
          </p>
        </div>
      </div>
    </div>
  );
}
