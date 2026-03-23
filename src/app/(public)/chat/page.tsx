'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { getProduct } from '@/lib/firebase/products';
import { ChatMessage, QuoteItem } from '@/lib/types';
import { calcBoxes, formatARS } from '@/lib/utils/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Send,
  Headset,
  User,
  Loader2,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Package,
  BarChart3,
} from 'lucide-react';

const MarkdownMessage = ({ content }: { content: string }) => {
  // Regex to find ![alt](url)
  const IMG_REGEX = /!\[(.*?)\]\((.*?)\)/g;
  
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-current leading-relaxed text-sm
      [&>p]:mb-2 [&>p:last-child]:mb-0
      [&>strong]:font-bold
    ">
      {content.split('\n\n').map((block, i) => {
        // Find if this whole block has an image
        const hasImage = block.match(IMG_REGEX);
        
        if (hasImage) {
          const parts = block.split(IMG_REGEX);
          // parts will be [text_before, alt, url, text_after, ...]
          const renderedParts = [];
          for (let j = 0; j < parts.length; j += 3) {
            renderedParts.push(<span key={`text-${j}`}>{parts[j]}</span>);
            if (parts[j+1] !== undefined) {
              renderedParts.push(
                <div key={`img-${j}`} className="my-3 rounded-xl overflow-hidden border border-[#3B82F6]/20 bg-muted/30 shadow-md">
                  <img src={parts[j+2]} alt={parts[j+1]} className="w-full aspect-video object-cover" />
                  <p className="text-[10px] text-muted-foreground px-3 py-2 italic bg-background/50">{parts[j+1]}</p>
                </div>
              );
            }
          }
          return <p key={i}>{renderedParts}</p>;
        }

        // Support bold and simple text
        const parts = block.split(/(\*\*[^*]+\*\*)/g).map((part, k) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={k}>{part.slice(2, -2)}</strong>
            : part
        );

        return <p key={i} className="mb-2 leading-relaxed">{parts}</p>;
      })}
    </div>
  );
};

const WELCOME = `¡Hola! 👋 Bienvenido a **RAN**. 

Soy tu asesor virtual y estoy aquí para ayudarte a encontrar el piso o revestimiento ideal para tu proyecto. 

¿Tenés alguna idea en mente o preferís que te ayude a calcular los materiales para un ambiente específico?`;

interface ContactForm {
  name: string;
  email: string;
  phone: string;
}

export default function ChatPage() {
  const { ranUser } = useAuth();
  const isAdmin = useMemo(() => ['admin', 'vendedor', 'secretaria', 'finanzas', 'dev'].includes(ranUser?.role || ''), [ranUser]);
  
  const searchParams = useSearchParams();
  const productId = searchParams.get('producto');
  const initialMode = searchParams.get('mode') as 'technical' | 'management' | null;

  const [chatMode, setChatMode] = useState<'technical' | 'management'>(
    (initialMode === 'management' && isAdmin) ? 'management' : 'technical'
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Al cambiar de modo o iniciar, reseteamos el mensaje de bienvenida adecuado
  useEffect(() => {
    const welcome = chatMode === 'management' 
      ? 'Hola. Soy tu Analista de Gestión. ¿Qué métricas o datos del negocio necesitás revisar hoy?'
      : WELCOME;
    
    setMessages([{ role: 'assistant', content: welcome, timestamp: new Date() }]);
  }, [chatMode]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quoteAcceptedPhase, setQuoteAcceptedPhase] = useState(false);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: ranUser?.displayName ?? '',
    email: ranUser?.email ?? '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [quoteDone, setQuoteDone] = useState(false);
  const [detectedItems, setDetectedItems] = useState<QuoteItem[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const lastMsg = messages[messages.length - 1];
    if (messages.length <= 1) return;
    if (lastMsg?.role === 'assistant') {
      const bubbles = containerRef.current.querySelectorAll('.assistant-bubble');
      const lastBubble = bubbles[bubbles.length - 1];
      if (lastBubble) lastBubble.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (productId) {
      getProduct(productId).then((p) => {
        if (p) handleSend(`Hola, me interesa el ${p.name}. ¿Es adecuado para un living de alto tránsito?`);
      });
    }
  }, [productId]);

  const detectQuotesInResponse = (text: string): QuoteItem[] => {
    // We remove the strict requirement for 'PRESUPUESTO_GENERADO:' 
    // because if the advisor writes [MATERIAL], we WANT to catch it.
    if (!text.includes('[MATERIAL]') && !text.includes('Producto:')) return [];
    
    const items: QuoteItem[] = [];

    // Lighter, more flexible regex for numbers that might have dots or commas
    const num = (v?: string) => {
      if (!v) return 0;
      // Remove $ and non-numeric chars except . and ,
      const cleaned = v.replace(/[^\d.,]/g, '');
      if (cleaned.includes(',') && cleaned.includes('.')) {
        // Likely thousands dot and decimal comma like 1.234,56
        return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
      }
      return parseFloat(cleaned.replace(',', '.')) || 0;
    };

    // New multi-material logic with more robust split
    const parts = text.split(/\[MATERIAL\]/i);
    parts.shift(); // Remove content before first [MATERIAL]

    for (const p of parts) {
      try {
        const content = p.split(/\[FIN_MATERIAL\]/i)[0];
        const lines = content.split('\n').map(l => l.trim());
        
        // Use more liberal matching
        const findVal = (key: string) => lines.find(l => l.toLowerCase().includes(key.toLowerCase()))?.split(':')[1]?.trim() || '';
        
        const name = findVal('Producto');
        const m2 = num(findVal('m2_cliente'));
        const boxes = parseInt(findVal('Cajas').replace(/\D/g, '')) || 0;
        const price = num(findVal('Precio_caja'));
        const subtotal = num(findVal('Subtotal'));

        if (name && (boxes > 0 || m2 > 0)) {
          items.push({
            productId: 'ai-' + Math.random().toString(36).slice(2, 7),
            name,
            size: '',
            m2,
            boxes,
            pricePerBox: price,
            subtotal: subtotal || (price * boxes)
          });
        }
      } catch (e) {
        console.warn('Error parsing block:', e);
      }
    }

    // Fallback for old single-line format if no [MATERIAL] blocks found
    if (items.length === 0) {
      const nameMatch = text.match(/Producto:\s*([^\n]+)/i)?.[1];
      const m2Match = text.match(/m2_cliente:\s*([\d.,]+)/i)?.[1];
      const boxesMatch = text.match(/Cajas:\s*(\d+)/)?.[1];
      const priceMatch = text.match(/Precio_caja:\s*\$?\s*([\d.,]+)/i)?.[1];

      if (nameMatch && (boxesMatch || m2Match)) {
        const boxes = parseInt(boxesMatch || '0');
        const price = num(priceMatch);
        items.push({
          productId: 'ai-fallback',
          name: nameMatch.trim(),
          size: '',
          m2: num(m2Match),
          boxes,
          pricePerBox: price,
          subtotal: (price * boxes) || 0
        });
      }
    }

    return items;
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
          userName: ranUser?.displayName || '',
          userRole: ranUser?.role || 'cliente',
          mode: chatMode,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const assistantMsg: ChatMessage = { role: 'assistant', content: data.message, timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMsg]);

      const items = detectQuotesInResponse(data.message);
      if (items.length > 0) setDetectedItems(items);

      const lower = data.message.toLowerCase();
      if ((lower.includes('nombre') || lower.includes('email') || lower.includes('teléfono') || lower.includes('whatsapp')) && !quoteAcceptedPhase) {
        setQuoteAcceptedPhase(true);
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const totals = useMemo(() => detectedItems.reduce((acc, item) => acc + item.subtotal, 0), [detectedItems]);

  const handleAcceptQuote = async () => {
    if (!contactForm.name || (!contactForm.email && !contactForm.phone)) {
      toast.error('Por favor, indicá tu nombre y al menos un medio de contacto (Teléfono o Email).');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: ranUser?.uid,
          clientName: contactForm.name,
          clientEmail: contactForm.email,
          clientPhone: contactForm.phone,
          items: detectedItems,
          totalMaterials: totals,
          aiConversationLog: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error();
      setQuoteDone(true);
      toast.success('¡Presupuesto enviado!');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `¡Listo, ${contactForm.name}! 🎉 Hemos enviado tu solicitud a nuestro equipo. Un vendedor experto te contactará en breve al **${contactForm.phone}**.\n\n¡Muchas gracias por confiar en RAN!`,
        timestamp: new Date()
      }]);
      setQuoteAcceptedPhase(false);
    } catch {
      toast.error('Error al enviar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className={`${isAdmin ? 'bg-slate-900' : 'bg-[#1B2A4A]'} py-6 shadow-md z-10 transition-colors`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-2xl ${isAdmin ? 'bg-blue-600' : 'ran-gradient'} flex items-center justify-center shadow-lg transition-all`}>
              {isAdmin ? <BarChart3 className="h-6 w-6 text-white" /> : <Sparkles className="h-6 w-6 text-white" />}
            </div>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                {chatMode === 'management' ? 'Control de Gestión' : 'Asesoría Técnica'} 
                <Badge className={chatMode === 'management' ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}>
                  {chatMode === 'management' ? 'BI Admin' : 'Asesor'}
                </Badge>
              </h1>
              <p className="text-white/50 text-xs">
                {chatMode === 'management' ? 'Inteligencia de Negocios RAN' : 'Especialista en Revestimientos'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <div className="hidden md:flex bg-black/20 p-1 rounded-xl items-center">
                <Button 
                  variant={chatMode === 'technical' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setChatMode('technical')}
                  className={`rounded-lg font-bold text-[10px] ${chatMode === 'technical' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/40'}`}
                >
                  MODO VENTAS
                </Button>
                <Button 
                  variant={chatMode === 'management' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setChatMode('management')}
                  className={`rounded-lg font-bold text-[10px] ${chatMode === 'management' ? 'bg-blue-600 text-white shadow-sm' : 'text-white/40'}`}
                >
                  MODO GESTIÓN
                </Button>
              </div>
            )}
            <Button variant="ghost" className="text-white/60 hover:text-white" onClick={() => window.location.href = '/'}>Salir</Button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 container mx-auto px-4 py-8 max-w-4xl overflow-y-auto">
        <div className="space-y-8">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
              <div className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center ${msg.role === 'assistant' ? 'ran-gradient text-white shadow-lg' : 'bg-white border text-slate-400'}`}>
                {msg.role === 'assistant' ? <Headset className="h-6 w-6" /> : <User className="h-6 w-6" />}
              </div>
              <div className={`max-w-[80%] p-5 rounded-[28px] shadow-sm ${msg.role === 'assistant' ? 'bg-white assistant-bubble border border-slate-100' : 'bg-[#1B2A4A] text-white rounded-tr-none'}`}>
                {msg.role === 'assistant' ? (
                  <MarkdownMessage content={msg.content.replace(/PRESUPUESTO_GENERADO:[\s\S]*TOTAL_MATERIALES:[^\n]*/g, '[Cálculo realizado ✓]')} />
                ) : <p className="text-[15px]">{msg.content}</p>}

                {/* Detected Items Card */}
                {msg.role === 'assistant' && msg.content.includes('PRESUPUESTO_GENERADO:') && detectedItems.length > 0 && (
                  <div className="mt-6 border border-slate-100 rounded-3xl overflow-hidden shadow-xl bg-slate-50/50">
                    <div className="bg-[#1B2A4A] p-4 flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-400" />
                      <p className="text-white font-black text-[10px] uppercase tracking-widest">Resumen de Materiales</p>
                    </div>
                    <div className="p-5 space-y-4">
                      {detectedItems.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                          <div>
                            <p className="font-black text-slate-800 text-sm leading-none mb-1">{it.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{it.m2} m² • {it.boxes} cajas</p>
                          </div>
                          <p className="font-black text-[#1B2A4A]">{it.subtotal > 0 ? formatARS(it.subtotal) : 'A COTIZAR'}</p>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-dashed flex justify-between items-end">
                        <p className="text-[10px] text-slate-400 font-black uppercase">Total Estimado</p>
                        <p className="text-2xl font-black text-[#3B82C4]">{totals > 0 ? formatARS(totals) : 'A COTIZAR'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 items-center">
              <div className="h-10 w-10 ran-gradient rounded-2xl flex items-center justify-center animate-pulse"><Headset className="h-6 w-6 text-white" /></div>
              <div className="bg-white px-4 py-3 rounded-2xl italic text-slate-400 text-sm">
                {isAdmin ? 'Procesando datos del negocio...' : 'Estamos preparando tu presupuesto...'}
              </div>
            </div>
          )}

          {quoteAcceptedPhase && !quoteDone && (
            <div className="bg-white rounded-[32px] border-2 border-[#3B82C4] shadow-2xl p-8 max-w-lg mx-auto animate-fade-in-up">
              <div className="text-center space-y-2 mb-8">
                <div className="h-14 w-14 bg-blue-50 text-[#3B82C4] rounded-2xl flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="h-8 w-8" /></div>
                <h3 className="text-2xl font-black text-slate-800">Casi listo...</h3>
                <p className="text-slate-500 text-sm">Necesitamos unos datos mínimos para que un vendedor pueda enviarte el presupuesto formal.</p>
              </div>
              <div className="space-y-4">
                <Input placeholder="Nombre Completo" className="h-14 rounded-2xl border-slate-200 text-lg" value={contactForm.name} onChange={e => setContactForm(f => ({...f, name: e.target.value}))} />
                <Input placeholder="Email (opcional)" className="h-14 rounded-2xl border-slate-200 text-lg" value={contactForm.email} onChange={e => setContactForm(f => ({...f, email: e.target.value}))} />
                <Input placeholder="WhatsApp / Teléfono" className="h-14 rounded-2xl border-slate-200 text-lg font-bold" value={contactForm.phone} onChange={e => setContactForm(f => ({...f, phone: e.target.value}))} />
                <Button className="w-full h-16 ran-gradient text-white font-black text-xl rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all" onClick={handleAcceptQuote} disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                  SOLICITAR CONTACTO COMERCIAL
                </Button>
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-10" />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md border-t p-6 sticky bottom-0">
        <div className="container mx-auto max-w-3xl flex flex-col gap-3">
          {detectedItems.length > 0 && !quoteDone && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full w-fit mb-1 border border-blue-100 animate-pulse">
              <Package className="h-4 w-4" />
              <span className="text-[10px] uppercase font-black tracking-widest">
                {detectedItems.length} productos en tu presupuesto
              </span>
            </div>
          )}
          <div className="flex gap-3">
            <Input 
              ref={inputRef}
              placeholder={chatMode === 'management' ? "Consultá ingresos, egresos, stock o rendimiento..." : "Consultá por m², stock o modelos..."}
              className="h-16 rounded-3xl border-slate-200 px-6 text-lg focus:ring-2 focus:ring-[#3B82C4] transition-all"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={loading || quoteDone}
            />
            <Button onClick={() => handleSend()} disabled={loading || !input.trim() || quoteDone} className="h-16 w-16 rounded-3xl ran-gradient text-white border-0 shadow-lg active:scale-95 transition-all">
              {loading ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
