'use client';

import { useEffect, useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Send, 
  Instagram, 
  Facebook,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { subscribeToSettings, AppSettings } from '@/lib/firebase/settings';
import { useAuth } from '@/lib/firebase/auth-context';
import { sendContactMessage } from '@/lib/firebase/messages';

export default function ContactoPage() {
  const { ranUser } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    return subscribeToSettings((data) => setSettings(data));
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await sendContactMessage({
        ...formData,
        userId: ranUser?.uid || undefined,
      });

      toast.success('¡Mensaje enviado con éxito! Nos contactaremos a la brevedad.');
      setFormData({ name: '', lastName: '', email: '', message: '' });
    } catch (err: any) {
      toast.error('Ocurrió un error al enviar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const contact = settings?.contactInfo;

  return (
    <div className="min-h-screen bg-background text-[var(--color-ran-navy)]">
      {/* Dynamic Header */}
      <section 
        className="relative py-24 overflow-hidden bg-ran-navy"
        style={{ 
          backgroundImage: 'url("/fondoContacto.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-ran-dark/60 backdrop-blur-[2px]" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl sm:text-7xl font-black text-white italic drop-shadow-2xl tracking-tight">
            Contactanos
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg mt-4 font-medium drop-shadow-md animate-fade-in-up">
            Estamos para ayudarte en tu próximo proyecto. 
            Nuestro equipo está listo para asesorarte.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-black text-ran-navy mb-6">Información de Contacto</h2>
                <div className="grid gap-6">
                  {/* Address */}
                  {contact?.address && (
                    <div className="flex gap-4 items-start p-4 rounded-2xl bg-card border border-border group hover:border-ran-cerulean/30 transition-all shadow-sm">
                      <div className="h-12 w-12 rounded-xl bg-ran-cerulean/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <MapPin className="h-6 w-6 text-ran-cerulean" />
                      </div>
                      <div>
                        <h3 className="font-bold text-ran-navy">Nuestra Casa Central</h3>
                        <p className="text-muted-foreground">{contact.address}</p>
                        <p className="text-xs text-ran-cerulean font-semibold mt-1">{contact.workingHours}</p>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {contact?.phone && (
                    <div className="flex gap-4 items-start p-4 rounded-2xl bg-card border border-border group hover:border-ran-cerulean/30 transition-all shadow-sm">
                      <div className="h-12 w-12 rounded-xl bg-ran-cerulean/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Phone className="h-6 w-6 text-ran-cerulean" />
                      </div>
                      <div>
                        <h3 className="font-bold text-ran-navy">Atención Telefónica / WhatsApp</h3>
                        <p className="text-muted-foreground">{contact.phone}</p>
                        <a href={`https://wa.me/${contact.whatsapp}`} className="text-xs text-green-600 font-bold hover:underline inline-flex items-center gap-1 mt-1">
                          Soporte Directo via WhatsApp <MessageSquare className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {contact?.email && (
                    <div className="flex gap-4 items-start p-4 rounded-2xl bg-card border border-border group hover:border-ran-cerulean/30 transition-all shadow-sm">
                      <div className="h-12 w-12 rounded-xl bg-ran-cerulean/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Mail className="h-6 w-6 text-ran-cerulean" />
                      </div>
                      <div>
                        <h3 className="font-bold text-ran-navy">Consultas Generales</h3>
                        <p className="text-muted-foreground">{contact.email}</p>
                        <p className="text-xs text-muted-foreground mt-1 text-ran-navy/40">Respondemos en menos de 24 hs</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media */}
              <div className="p-8 rounded-3xl ran-gradient text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                  <Instagram className="h-64 w-64" />
                </div>
                <h3 className="text-2xl font-black mb-4 italic">¡Seguinos!</h3>
                <p className="text-white/80 mb-6 max-w-sm">
                  Enterate de las últimas ofertas, nuevos ingresos de Cerámicas Lourdes y pedí inspiración para tus ambientes.
                </p>
                <div className="flex gap-4 relative z-10">
                  {contact?.instagram && (
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl" asChild>
                      <a href={contact.instagram} target="_blank" rel="noopener noreferrer">
                        <Instagram className="mr-2 h-4 w-4" /> Instagram
                      </a>
                    </Button>
                  )}
                  {contact?.facebook && (
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl" asChild>
                      <a href={contact.facebook} target="_blank" rel="noopener noreferrer">
                        <Facebook className="mr-2 h-4 w-4" /> Facebook
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="relative">
              <Card className="p-8 border-border shadow-2xl rounded-3xl relative z-10 bg-white dark:bg-zinc-950">
                <h3 className="text-2xl font-black text-ran-navy mb-6">Envianos un mensaje</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-ran-navy">Nombre</label>
                      <Input 
                        placeholder="Tu nombre" 
                        className="rounded-xl border-border bg-muted/30 focus:border-ran-cerulean h-12" 
                        required 
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-ran-navy">Apellido</label>
                      <Input 
                        placeholder="Tu apellido" 
                        className="rounded-xl border-border bg-muted/30 focus:border-ran-cerulean h-12" 
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-ran-navy">Correo Electrónico</label>
                    <Input 
                      type="email" 
                      placeholder="email@ejemplo.com" 
                      className="rounded-xl border-border bg-muted/30 focus:border-ran-cerulean h-12" 
                      required 
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-ran-navy">Mensaje</label>
                    <Textarea 
                      placeholder="¿En qué podemos ayudarte?" 
                      className="rounded-xl border-border bg-muted/30 focus:border-ran-cerulean min-h-[150px] resize-none"
                      required
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full h-12 ran-gradient text-white border-0 font-bold shadow-lg hover:shadow-xl transition-all">
                    {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                    {submitting ? 'Enviando...' : 'Enviar Mensaje'}
                  </Button>
                </form>
              </Card>
              
              {/* Decorative dots/shapes */}
              <div className="absolute -top-4 -right-4 h-24 w-24 bg-ran-gold/20 rounded-full blur-3xl -z-10 animate-pulse" />
              <div className="absolute -bottom-4 -left-4 h-32 w-32 bg-ran-cerulean/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-ran-navy mb-2">Donde nos encontrás</h2>
            <p className="text-muted-foreground italic">Veni a visitar nuestro showroom y conocé la calidad de nuestros productos</p>
          </div>
          
          <div className="rounded-3xl overflow-hidden border border-border shadow-2xl h-[450px] relative">
            {contact?.googleMapsEmbed && (
              <iframe 
                src={contact.googleMapsEmbed} 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            )}
            
            <div className="absolute bottom-6 left-6 p-4 bg-white/90 backdrop-blur shadow-xl rounded-2xl max-w-xs border border-white/50 hidden md:block">
              <div className="flex gap-2 text-ran-navy">
                <MapPin className="h-5 w-5 text-ran-cerulean shrink-0" />
                <div>
                  <p className="font-bold text-sm">Dirección de Showroom</p>
                  <p className="text-xs text-muted-foreground mt-1">Visitá nuestro salón de exposición para ver muestras físicas de todos los modelos.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Help IA CTA */}
      <section className="py-20 bg-background overflow-hidden relative">
        <div className="container mx-auto px-4">
          <div className="bg-ran-navy/5 border border-ran-navy/10 rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <MessageSquare className="h-32 w-32" />
            </div>
            <div className="max-w-xl">
              <h2 className="text-3xl font-black text-ran-navy mb-4 italic">¿Necesitás una respuesta inmediata?</h2>
              <p className="text-ran-slate text-lg mb-0 leading-relaxed font-medium">
                Probá nuestro asesor de inteligencia artificial. Está capacitado para ayudarte a elegir el mejor producto según tu necesidad y calcular presupuestos en segundos.
              </p>
            </div>
            <Button size="lg" className="ran-gradient text-white border-0 h-14 px-8 text-lg font-bold shadow-xl shrink-0 group" asChild>
              <a href="/chat">
                Usar Chat IA <MessageSquare className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
