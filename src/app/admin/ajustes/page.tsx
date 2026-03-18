'use client';

import { useEffect, useState } from 'react';
import { getAppSettings, updateAppSettings, AppSettings } from '@/lib/firebase/settings';
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
  Loader2
} from 'lucide-react';

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
      await updateAppSettings(settings);
      toast.success('Configuración actualizada correctamente');
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

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-ran-navy italic">Configuración del Sitio</h1>
        <p className="text-muted-foreground">Administra la información de contacto y redes sociales que aparece en el sitio público.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-ran-cerulean/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-ran-cerulean" />
              </div>
              <div>
                <CardTitle className="text-xl">Datos de Contacto</CardTitle>
                <CardDescription>Información básica de contacto para tus clientes.</CardDescription>
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

        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-ran-gold/10 flex items-center justify-center">
                <Instagram className="h-5 w-5 text-ran-gold" />
              </div>
              <div>
                <CardTitle className="text-xl">Redes Sociales</CardTitle>
                <CardDescription>Enlaces a tus perfiles oficiales.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
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
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Mapa (Google Maps)</CardTitle>
                <CardDescription>Copia el enlace del 'iframe' de Google Maps.</CardDescription>
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
              <p className="text-[10px] text-muted-foreground p-1">
                Instrucciones: Buscá tu ubicación en Google Maps, click en "Compartir", pestaña "Insertar un mapa" y copiá solo el valor que está dentro de src="...".
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            size="lg"
            disabled={saving}
            className="ran-gradient text-white border-0 px-8 rounded-xl font-bold shadow-lg hover:shadow-cyan-500/20 transition-all min-w-[200px]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
