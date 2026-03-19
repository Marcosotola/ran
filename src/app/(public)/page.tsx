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
  Package,
  Calculator,
  ArrowRight,
  TrendingUp,
  Layout,
  Clock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/firebase/products';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/products/ProductCard';

const FEATURES = [
  {
    icon: MessageSquare,
    color: '#4A90E2', // Cerulean
    title: 'Chat con IA',
    description:
      'Nuestro asistente inteligente te asesora sobre qué producto elegir según tu espacio y te genera un presupuesto al instante.',
  },
  {
    icon: Zap,
    color: '#C9A84C', // Gold
    title: 'Presupuesto Inmediato',
    description:
      'Calculamos automáticamente la cantidad de cajas necesarias según los m² de tu ambiente con 10% de desperdicio incluido.',
  },
  {
    icon: Palette,
    color: '#1B365D', // Navy
    title: 'Amplio Catálogo',
    description:
      'Más de 95 SKUs entre pisos y revestimientos de pared en múltiples formatos, acabados y estilos.',
  },
  {
    icon: Shield,
    color: '#4A90E2', // Cerulean
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

const ProductCarousel = ({ title, products, icon: Icon }: { title: string; products: Product[]; icon?: any }) => {
  if (products.length === 0) return null;

  return (
    <section className="py-16 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-6 w-6 text-ran-cerulean" />}
            <h2 className="text-3xl font-black text-ran-navy">{title}</h2>
          </div>
          <Link href="/catalogo" className="text-ran-cerulean font-semibold text-sm hover:underline">
            Ver todo
          </Link>
        </div>
        
        <div className="relative group">
          <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory px-1">
            {products.map((p) => (
              <div 
                key={p.id} 
                className="min-w-[260px] sm:min-w-[calc(100%/2-1.5rem)] md:min-w-[calc(100%/3-1.5rem)] lg:min-w-[calc(100%/4-1.5rem)] xl:min-w-[calc(100%/5-1.5rem)] snap-center"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const HERO_SLIDES = [
  {
    image: '/banner1.png',
    title: 'Transformá tus espacios con calidad',
    subtitle: 'Encontrá los mejores pisos y revestimientos cerámicos en un solo lugar.'
  },
  {
    image: '/banner2.png',
    title: 'Tecnología y Estilo para tu Hogar',
    subtitle: 'Asesoramiento con IA y presupuestos inmediatos según tus necesidades.'
  },
  {
    image: '/banner3.png',
    title: 'Variedad que inspira tus ambientes',
    subtitle: 'Más de 95 diseños exclusivos para renovar tu casa.'
  },
  {
    image: '/fachada.png',
    title: 'RAN Pisos & Revestimientos',
    subtitle: 'Visitá nuestro showroom y llevate la mejor calidad al mejor precio.'
  }
];

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Product[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Fetch featured
    getProducts({ isFeatured: true, isActive: true }).then(setFeatured);
    // Fetch offers
    getProducts({ isOffer: true, isActive: true }).then(setOffers);

    // Carousel interval
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* ─── HERO CAROUSEL ─── */}
      <section className="relative h-[50vh] min-h-[400px] w-full overflow-hidden bg-ran-dark">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10s] ease-linear"
              style={{ 
                backgroundImage: `url(${slide.image})`,
                transform: index === currentSlide ? 'scale(1.1)' : 'scale(1)'
              }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-ran-dark/90 via-ran-dark/50 to-transparent" />
          </div>
        ))}

        <div className="container mx-auto px-4 h-full flex items-center relative z-20">
          <div className="max-w-3xl animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ran-white leading-[1.1] mb-4 drop-shadow-lg italic">
              {HERO_SLIDES[currentSlide].title.split(' ').map((word, i) => 
                word.toLowerCase() === 'pisos' || word.toLowerCase() === 'revestimientos' 
                ? <span key={i} className="text-ran-cerulean"> {word} </span> 
                : <span key={i}> {word} </span>
              )}
            </h1>

            <p className="text-sm sm:text-base text-ran-white/80 mb-6 max-w-xl leading-relaxed drop-shadow-md font-medium">
              {HERO_SLIDES[currentSlide].subtitle}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-ran-cerulean hover:bg-ran-cerulean/85 text-white border-0 h-11 px-6 text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                asChild
              >
                <Link href="/catalogo">
                  Explorar Catálogo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/5 backdrop-blur-sm hover:bg-white/10 h-11 px-6 text-sm font-bold transition-all hover:scale-105 active:scale-95"
                asChild
              >
                <Link href="/chat">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat con IA
                </Link>
              </Button>
            </div>

            {/* Slide Indicators */}
            <div className="mt-8 flex gap-2">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentSlide ? 'w-8 bg-ran-cerulean' : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FORMATS BAR ─── */}
      <section className="bg-ran-white py-12 border-b border-ran-slate/10">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-xl font-bold text-ran-dark mb-2">Elije tu tamaño ideal</h2>
            <p className="text-ran-slate text-sm">Explorá nuestro catálogo según las dimensiones que necesitás.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FORMATS.map((f) => (
              <Link
                key={f.size}
                href={`/catalogo?size=${f.size.replace('×','x')}`}
                className="flex items-center gap-4 group p-5 rounded-xl border border-ran-slate/10 bg-white hover:border-ran-cerulean hover:shadow-md transition-all"
              >
                <div className="h-16 w-16 rounded-lg bg-ran-slate flex items-center justify-center shrink-0 text-white font-bold text-xs text-center leading-tight shadow-sm group-hover:bg-ran-cerulean transition-colors">
                  {f.size}
                  <br />
                  <span className="text-[8px] font-normal opacity-75">{f.label}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ran-dark font-bold text-sm group-hover:text-ran-cerulean transition-colors truncate">
                    Para {f.tag}
                  </p>
                  <p className="text-ran-slate text-xs mt-1">{f.count} disponibles</p>
                </div>
                <ChevronRight className="h-4 w-4 text-ran-slate group-hover:text-ran-cerulean group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CAROUSELS ─── */}
      <ProductCarousel 
        title="Los más Populares" 
        products={featured} 
        icon={Star} 
      />
      
      <ProductCarousel 
        title="Últimas Ofertas" 
        products={offers} 
        icon={TrendingUp} 
      />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-ran-cerulean/30 text-ran-cerulean text-lg">
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
                className="group p-6 rounded-2xl bg-card border border-border hover:border-ran-cerulean/30 hover:shadow-lg transition-all duration-300 ran-card-hover"
              >
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${feat.color}20` }}
                >
                  <feat.icon className="h-6 w-6" style={{ color: feat.color }} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-ran-navy">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ─── CTA ─── */}
      <section className="ran-gradient-hero py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="container mx-auto px-4 text-center relative">
          <h1 className="text-4xl md:text-6xl font-black mb-6 animate-fade-in-up text-white leading-tight">
          Pisos y Revestimientos para <span className="text-ran-cerulean italic">toda la vida</span>
        </h1>
          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
            Usá nuestro chat con IA para obtener una recomendación personalizada y tu presupuesto en menos de 2 minutos.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-ran-navy hover:bg-white/90 hover:text-white h-14 px-10 text-base font-bold shadow-xl"
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
              className="border-white/30 text-white bg-transparent hover:bg-white/90 h-14 px-8 text-base"
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
