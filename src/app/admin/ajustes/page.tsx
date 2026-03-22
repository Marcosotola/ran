'use client';

import { useEffect, useState } from 'react';
import { getAppSettings, updateContactInfo, AppSettings } from '@/lib/firebase/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Instagram, 
  Facebook, 
  MessageSquare, 
  Clock,
  Globe,
  Save,
  Loader2,
  CreditCard,
  ShieldCheck,
  ShieldX,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
  History,
} from 'lucide-react';
import { formatARS, formatDate } from '@/lib/utils/calculations';
import { Badge } from '@/components/ui/badge';

export default function AjustesPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getAppSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Error al cargar la configuración');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      // Solo guardamos contactInfo con el helper correcto (dot-notation)
      await updateContactInfo(settings.contactInfo);
      toast.success('✅ Información de contacto actualizada correctamente');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [name]: value
        }
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-ran-cerulean" />
      </div>
    );
  }

  const isActive = settings?.subscription.status === 'active';
  const amount = settings?.subscription.amount ?? 70000;
  const checkoutUrl = settings?.subscription.checkoutUrl;
  const managementUrl = settings?.subscription.managementUrl;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-10">

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-3xl font-black text-ran-navy italic">Configuración del Sitio</h1>
        <p className="text-muted-foreground mt-1">
          Administrá la información de contacto y redes sociales que aparece en el sitio público.
        </p>
      </div>

      {/* ── SUSCRIPCIÓN Y CUENTA ── */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-[#3B82C4]/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-[#3B82C4]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Suscripción y Cuenta</h2>
            <p className="text-sm text-muted-foreground">Estado de tu servicio mensual con RAN.</p>
          </div>
        </div>

        <Card className={`border-2 shadow-xl rounded-[2rem] overflow-hidden ${
          isActive ? 'border-green-100' : 'border-red-200'
        }`}>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-5 h-full">

              {/* Panel de estado */}
              <div className={`p-8 lg:col-span-2 text-white flex flex-col justify-center items-center text-center space-y-4 ${
                isActive
                  ? 'bg-gradient-to-br from-[#1B2A4A] to-[#1B3A5A]'
                  : 'bg-gradient-to-br from-red-700 to-red-900'
              }`}>
                <div className={`h-20 w-20 rounded-full flex items-center justify-center border-4 ${
                  isActive ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/20 border-red-400/30'
                }`}>
                  {isActive
                    ? <ShieldCheck className="h-10 w-10 text-white" />
                    : <ShieldX className="h-10 w-10 text-white" />
                  }
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-white/60 mb-1">Estado del Servicio</p>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white">
                    {isActive ? 'Servicio Activo' : 'Servicio Suspendido'}
                  </h3>
                </div>
                <Badge className={`font-black uppercase text-[10px] px-4 py-1 border-0 ${
                  isActive ? 'bg-green-500/30 text-green-200' : 'bg-red-500/30 text-red-200'
                }`}>
                  {isActive ? '✓ Al día' : '⚠ Pago pendiente'}
                </Badge>
              </div>

              {/* Panel de datos */}
              <div className="p-8 lg:col-span-3 space-y-6">

                {/* Grilla de info */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black tracking-widest text-[#3B82C4]">Monto Mensual</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                      {formatARS(amount)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1">
                      <History className="h-3 w-3" /> Último Pago
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {settings?.subscription.lastPaymentDate
                        ? formatDate(settings.subscription.lastPaymentDate)
                        : '—'
                      }
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" /> Próximo Vencimiento
                    </p>
                    <p className={`text-sm font-bold ${isActive ? 'text-slate-700' : 'text-red-600'}`}>
                      {settings?.subscription.nextPaymentDate
                        ? formatDate(settings.subscription.nextPaymentDate)
                        : 'Pendiente de Pago'
                      }
                    </p>
                  </div>
                </div>

                {/* Aviso */}
                <div className={`p-4 rounded-xl flex items-start gap-3 ${
                  isActive
                    ? 'bg-green-50 border border-green-100'
                    : 'bg-red-50 border border-red-100'
                }`}>
                  {isActive
                    ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    : <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  }
                  <p className={`text-xs font-medium leading-relaxed ${isActive ? 'text-green-700' : 'text-red-700'}`}>
                    {isActive
                      ? 'Tu suscripción está activa. Recordá mantener el pago al día para no interrumpir el acceso a los paneles de gestión, catálogos e inteligencia artificial.'
                      : 'Tu suscripción está suspendida. Realizá el pago para restaurar el acceso al sistema de forma inmediata.'
                    }
                  </p>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {managementUrl ? (
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-2xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 gap-2"
                      asChild
                    >
                      <a href={managementUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Gestionar Suscripción
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-2xl border-slate-200 text-slate-400 font-bold gap-2 cursor-not-allowed opacity-60"
                      disabled
                    >
                      <ExternalLink className="h-4 w-4" />
                      Gestionar Suscripción
                    </Button>
                  )}

                  {checkoutUrl ? (
                    <Button
                      className="flex-1 h-12 bg-[#3B82C4] hover:bg-[#2D6BA3] text-white font-black rounded-2xl shadow-lg shadow-[#3B82C4]/20 gap-2"
                      asChild
                    >
                      <a href={checkoutUrl} target="_blank" rel="noreferrer">
                        <CreditCard className="h-5 w-5" />
                        PAGAR SUSCRIPCIÓN
                      </a>
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 h-12 bg-slate-300 text-slate-500 font-black rounded-2xl gap-2 cursor-not-allowed"
                      disabled
                    >
                      <CreditCard className="h-5 w-5" />
                      Link de pago no configurado
                    </Button>
                  )}
                </div>

                {!checkoutUrl && !managementUrl && (
                  <p className="text-[10px] text-slate-400 text-center">
                    Los links de pago aún no fueron configurados. Contactá al administrador del sistema.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── SEPARADOR ── */}
      <div className="border-t border-dashed border-slate-200" />

      {/* ── INFORMACIÓN DE CONTACTO ── */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-ran-cerulean/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-ran-cerulean" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Información del Sitio Público</h2>
            <p className="text-sm text-muted-foreground">Datos de contacto y redes sociales visibles para tus clientes.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos de contacto */}
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-ran-cerulean/10 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-ran-cerulean" />
                </div>
                <div>
                  <CardTitle className="text-base">Datos de Contacto</CardTitle>
                  <CardDescription className="text-xs">Información básica de contacto para tus clientes.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-ran-navy flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" /> Teléfono Visible
                  </label>
                  <Input 
                    name="phone"
                    value={settings?.contactInfo.phone || ''}
                    onChange={handleChange}
                    placeholder="+54 9 11 0000-0000"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-ran-navy flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp (Solo números)
                  </label>
                  <Input 
                    name="whatsapp"
                    value={settings?.contactInfo.whatsapp || ''}
                    onChange={handleChange}
                    placeholder="5491100000000"
                    className="rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground px-1">Sin el signo + ni espacios. Ej: 54911...</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-ran-navy flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> Correo Electrónico
                </label>
                <Input 
                  name="email"
                  type="email"
                  value={settings?.contactInfo.email || ''}
                  onChange={handleChange}
                  placeholder="info@ranpisos.com.ar"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-ran-navy flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> Dirección / Ubicación
                </label>
                <Input 
                  name="address"
                  value={settings?.contactInfo.address || ''}
                  onChange={handleChange}
                  placeholder="Buenos Aires, Argentina"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-ran-navy flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Horarios de Atención
                </label>
                <Input 
                  name="workingHours"
                  value={settings?.contactInfo.workingHours || ''}
                  onChange={handleChange}
                  placeholder="Lunes a Viernes de 8:00 a 18:00 hs"
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Redes sociales */}
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-ran-gold/10 flex items-center justify-center">
                  <Instagram className="h-4 w-4 text-ran-gold" />
                </div>
                <div>
                  <CardTitle className="text-base">Redes Sociales</CardTitle>
                  <CardDescription className="text-xs">Enlaces a tus perfiles oficiales.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-ran-navy flex items-center gap-2">
                    <Instagram className="h-3.5 w-3.5" /> Instagram URL
                  </label>
                  <Input 
                    name="instagram"
                    value={settings?.contactInfo.instagram || ''}
                    onChange={handleChange}
                    placeholder="https://instagram.com/ranpisos"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-ran-navy flex items-center gap-2">
                    <Facebook className="h-3.5 w-3.5" /> Facebook URL
                  </label>
                  <Input 
                    name="facebook"
                    value={settings?.contactInfo.facebook || ''}
                    onChange={handleChange}
                    placeholder="https://facebook.com/ranpisos"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Maps embed */}
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-red-100 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Mapa (Google Maps)</CardTitle>
                  <CardDescription className="text-xs">Pegá la URL de embed de Google Maps para mostrar tu ubicación.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-ran-navy">URL del Mapa (Embed URL)</label>
                <Input 
                  name="googleMapsEmbed"
                  value={settings?.contactInfo.googleMapsEmbed || ''}
                  onChange={handleChange}
                  placeholder="https://www.google.com/maps/embed?..."
                  className="rounded-xl"
                />
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    <strong>Cómo obtenerla:</strong> Buscá tu ubicación en Google Maps → click en <em>"Compartir"</em> → 
                    pestaña <em>"Insertar un mapa"</em> → copiá solo el valor dentro de <code className="bg-slate-200 px-1 rounded">src="..."</code>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button 
              type="submit" 
              size="lg"
              disabled={saving}
              className="ran-gradient text-white border-0 px-10 rounded-xl font-bold shadow-lg hover:shadow-cyan-500/20 transition-all min-w-[220px] h-12"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Guardar Información
                </>
              )}
            </Button>
          </div>
        </form>
      </section>

    </div>
  );
}
