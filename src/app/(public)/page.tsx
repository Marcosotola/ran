'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  ChevronRight,
  Star,
  Zap,
  Shield,
  Palette,
} from 'lucide-react';
import { importCatalog } from '@/lib/firebase/seed-catalog';
import { toast } from 'sonner';

const FEATURES = [
  {
    icon: MessageSquare,
    color: '#3B82C4',
    title: 'Chat con IA',
    description:
      'Nuestro asistente inteligente te asesora sobre qué producto elegir según tu espacio y te genera un presupuesto al instante.',
  },
  {
    icon: Zap,
    color: '#C9A84C',
    title: 'Presupuesto Inmediato',
    description:
      'Calculamos automáticamente la cantidad de cajas necesarias según los m² de tu ambiente con 10% de desperdicio incluido.',
  },
  {
    icon: Palette,
    color: '#1B2A4A',
    title: 'Amplio Catálogo',
    description:
      'Más de 95 SKUs entre pisos y revestimientos de pared en múltiples formatos, acabados y estilos.',
  },
  {
    icon: Shield,
    color: '#3B82C4',
    title: 'Asesoramiento Experto',
    description:
      'Al aceptar tu presupuesto, te conectamos directamente con un vendedor especializado para cerrar la venta.',
  },
];

const FORMATS = [
  { size: '56×56', label: 'cm', count: '~27 SKUs', tag: 'Piso' },
  { size: '35×35', label: 'cm', count: '~33 SKUs', tag: 'Piso' },
  { size: '18×56', label: 'cm', count: '~12 SKUs', tag: 'Piso' },
  { size: '31×53', label: 'cm', count: '~23 SKUs', tag: 'Piso & Pared' },
];

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      {/* ─── HERO ─── */}
      <section className="relative min-h-[88vh] flex items-center ran-gradient-hero overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Glow effects */}
        <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-[#3B82C4]/20 blur-3xl" />
        <div className="absolute bottom-20 left-10 h-48 w-48 rounded-full bg-[#3B82C4]/10 blur-3xl" />

        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-[#3B82C4]/20 text-[#7BB8F0] border-[#3B82C4]/30 hover:bg-[#3B82C4]/30">
              <Star className="h-3 w-3 mr-1.5 fill-current" />
              Asesoramiento inteligente con IA
            </Badge>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
              Los mejores{' '}
              <span className="ran-text-gradient inline-block">
                pisos y revestimientos
              </span>{' '}
              para tu hogar
            </h1>

            <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl leading-relaxed">
              Explorá más de 95 productos cerámicos de alta calidad. Nuestro chat con IA te asesora, calcula las cantidades y genera tu presupuesto en segundos.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="ran-gradient text-white border-0 hover:opacity-90 h-14 px-8 text-base font-semibold shadow-lg shadow-[#3B82C4]/25"
                asChild
              >
                <Link href="/catalogo">
                  Ver catálogo
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white h-14 px-8 text-base font-semibold backdrop-blur-sm"
                asChild
              >
                <Link href="/chat">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Consultar con IA
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap gap-6 text-sm text-white/50">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Catálogo actualizado
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3B82C4]" />
                Presupuesto gratuito
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C9A84C]" />
                Asesoramiento personalizado
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FORMATS BAR ─── */}
      <section className="bg-[#1B2A4A] py-6 border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FORMATS.map((f) => (
              <Link
                key={f.size}
                href={`/catalogo?size=${f.size.replace('×','x')}`}
                className="flex items-center gap-3 group p-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg ran-gradient flex items-center justify-center shrink-0 text-white font-bold text-xs text-center leading-tight shadow">
                  {f.size}
                  <br />
                  <span className="text-[8px] font-normal opacity-75">{f.label}</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm group-hover:text-[#3B82C4] transition-colors">
                    Formato {f.size} cm
                  </p>
                  <p className="text-white/40 text-xs">{f.tag} • {f.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-[#3B82C4]/30 text-[#3B82C4]">
              ¿Por qué elegirnos?
            </Badge>
            <h2 className="text-4xl font-black mb-4 text-foreground">
              La manera más inteligente de elegir{' '}
              <span className="ran-text-gradient">tu piso</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Combinamos tecnología de inteligencia artificial con el expertise de nuestros vendedores para darte la mejor experiencia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feat, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-[#3B82C4]/30 hover:shadow-lg transition-all duration-300 ran-card-hover"
              >
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${feat.color}20` }}
                >
                  <feat.icon className="h-6 w-6" style={{ color: feat.color }} />
                </div>
                <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TEMPORARY MIGRATION TOOL (Dev Only) ─── */}
      <section className="py-12 bg-zinc-50 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border-2 border-dashed border-muted shadow-sm">
            <h3 className="font-bold mb-2">Configuración Inicial</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Como aún no tenés acceso al panel de administración, podés usar este botón para cargar el catálogo completo de Cerámicas Lourdes.
            </p>
            <Button 
              variant="outline"
              className="w-full border-blue-200 hover:bg-blue-50 text-blue-700"
              onClick={async () => {
                try {
                  toast.loading('Importando catálogo...', { id: 'import' });
                  const count = await importCatalog();
                  toast.success(`¡Éxito! Se importaron ${count} productos.`, { id: 'import' });
                } catch (e) {
                  toast.error('Error al importar', { id: 'import' });
                  console.error(e);
                }
              }}
            >
              Cargar Catálogo Lourdes
            </Button>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="ran-gradient-hero py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            ¿Listo para renovar tu espacio?
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
            Usá nuestro chat con IA para obtener una recomendación personalizada y tu presupuesto en menos de 2 minutos.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-[#1B2A4A] hover:bg-white/90 h-14 px-10 text-base font-bold shadow-xl"
              asChild
            >
              <Link href="/chat">
                <MessageSquare className="mr-2 h-5 w-5" />
                Iniciar chat con IA
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white bg-transparent hover:bg-white/10 h-14 px-8 text-base"
              asChild
            >
              <Link href="/catalogo">Ver todos los productos</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
