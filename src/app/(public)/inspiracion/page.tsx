'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  Palette, 
  Sparkles, 
  Home, 
  Layout, 
  ExternalLink,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'natural',
    title: 'Natural Living',
    description: 'Calidez y texturas que evocan la naturaleza.',
    products: ['Castor', 'Acacia', 'Madera Lenga', 'Eucalipto', 'Pino'],
    image: '/inspiration_wood.png',
    tag: 'Maderas y Texturas',
    searchKeyword: 'Madera'
  },
  {
    id: 'marble',
    title: 'Timeless Marble',
    description: 'Elegancia clásica con acabados de lujo.',
    products: ['Carrara Brillante', 'Calipso', 'Oslo', 'Firenze', 'Glaciar'],
    image: '/inspiration_marble.png',
    tag: 'Mármoles Pulidos',
    searchKeyword: 'Carrara'
  },
  {
    id: 'urban',
    title: 'Urban Industrial',
    description: 'Estilo moderno para ambientes contemporáneos.',
    products: ['Muro Piedra', 'Nantes', 'Cuarzita', 'Cemento', 'Brick'],
    image: '/inspiration_industrial.png',
    tag: 'Industrial & Texturados',
    searchKeyword: 'Piedra'
  },
  {
    id: 'rustic',
    title: 'Rustic Haven',
    description: 'Dureza y carácter para espacios exteriores y clásicos.',
    products: ['Travertino', 'Porfido', 'Cotto Satinado', 'Calcáreo', 'Piedra'],
    image: '/inspiration_rustic.png',
    tag: 'Rústicos & Exteriores',
    searchKeyword: 'Travertino'
  }
];

export default function InspiracionPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ─── HERO SECTION ─── */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] scale-110 animate-subtle-zoom"
          style={{ backgroundImage: 'url("/banner3.png")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ran-dark/70 via-ran-dark/50 to-background" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <Badge className="mb-6 bg-ran-cerulean text-white hover:bg-ran-cerulean px-4 py-1 text-sm font-semibold animate-fade-in-up">
            GALERÍA DE ESTILOS
          </Badge>
          <h1 className="text-4xl md:text-7xl font-black text-white mb-6 animate-fade-in-up leading-tight drop-shadow-2xl">
            Inspiración para <br /><span className="text-ran-cerulean italic">tus ambientes</span>
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up font-medium">
            Descubrí cómo nuestros pisos y revestimientos pueden transformar tu hogar. 
            Diseños exclusivos, calidad RAN.
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up">
            <Button size="lg" className="bg-white text-ran-navy hover:bg-ran-cerulean hover:text-white h-12 px-8 font-bold border-0" asChild>
              <Link href="/catalogo">Ver Catálogo Completo</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/5 backdrop-blur-sm hover:bg-white/10 h-12 px-8 font-bold" asChild>
              <Link href="/chat">Consultar a un asesor</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── STYLE GRID ─── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-black text-ran-navy mb-4 italic">
                Encontrá tu <span className="text-ran-cerulean">Esencia</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Seleccionamos las mejores combinaciones de productos para que visualices el potencial de cada espacio.
              </p>
            </div>
            <div className="flex gap-2 text-sm font-bold text-ran-slate">
              <span className="flex items-center gap-1"><Sparkles className="h-4 w-4 text-ran-gold" /> Calidad RAN</span>
              <span className="mx-2">•</span>
              <span className="flex items-center gap-1"><Palette className="h-4 w-4 text-ran-cerulean" /> Diseño de Vanguardia</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {CATEGORIES.map((cat, idx) => (
              <div 
                key={cat.id} 
                className={`group flex flex-col gap-6 animate-fade-in-up`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-3xl shadow-2xl transition-all duration-500 group-hover:shadow-ran-cerulean/20">
                  <Image 
                    src={cat.image} 
                    alt={cat.title} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ran-dark/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  <Badge className="absolute top-6 left-6 bg-white/90 text-ran-navy hover:bg-white backdrop-blur-md border-0 py-1.5 px-4 font-bold shadow-lg">
                    {cat.tag}
                  </Badge>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-black text-ran-navy group-hover:text-ran-cerulean transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-muted-foreground mt-2 text-lg">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-ran-slate tracking-widest uppercase">PRODUCTOS DESTACADOS</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.products.map(prod => (
                        <Link key={prod} href={`/catalogo?search=${prod}`}>
                          <Badge variant="secondary" className="bg-ran-cerulean/5 text-ran-cerulean hover:bg-ran-cerulean/20 border-ran-cerulean/10 px-3 py-1 cursor-pointer transition-colors">
                            {prod}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    className="w-fit p-0 h-auto text-ran-cerulean font-bold hover:bg-transparent group/btn text-lg"
                    asChild
                  >
                    <Link href={`/catalogo?search=${cat.searchKeyword}`}>
                      Explorar esta colección
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECONDARY CTA / RANI ─── */}
      <section className="py-24 bg-ran-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-ran-navy rounded-[3rem] p-12 md:p-20 shadow-3xl text-center relative overflow-hidden border border-white/5">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234A90E2' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }} />
            
            <div className="max-w-3xl mx-auto flex flex-col items-center gap-8 relative z-10">
              <div className="h-20 w-20 bg-ran-cerulean rounded-2xl flex items-center justify-center shadow-2xl animate-bounce-slow">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                  ¿Necesitás ayuda para <span className="text-ran-cerulean italic">decidir</span>?
                </h2>
                <p className="text-white/60 text-lg md:text-xl font-medium">
                  Nuestra **Asesoría Técnica** puede recomendarte el estilo perfecto según las dimensiones y el uso de tu ambiente.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                <Button size="lg" className="bg-ran-cerulean hover:bg-ran-cerulean/90 text-white h-14 px-10 text-lg font-bold shadow-xl rounded-2xl" asChild>
                  <Link href="/chat">Asesoramiento en línea ahora</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER HIGHLIGHT ─── */}
      <section className="py-16 border-t border-ran-slate/10 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-ran-slate/60 text-sm font-medium">
            © {new Date().getFullYear()} RAN Pisos & Revestimientos. Inspiración real para vidas reales.
          </p>
        </div>
      </section>
    </div>
  );
}


