'use client';

import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  History, 
  Eye, 
  CheckCircle2, 
  Award,
  Users,
  Building2,
  Truck
} from 'lucide-react';

export default function NosotrosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* ─── HERO SECTION ─── */}
      <section className="relative py-24 bg-ran-navy overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm66 3c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-46-45c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm26 18c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm16 18c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM24 62c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm14-40c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm8 56c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm38-22c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM22 16c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z' fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <Badge className="mb-6 bg-ran-cerulean text-white hover:bg-ran-cerulean px-4 py-1 text-sm font-semibold animate-fade-in-up">
              SOBRE NOSOTROS
            </Badge>
            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 animate-fade-in-up leading-tight italic">
              Compromiso con la <br />
              <span className="text-ran-cerulean">calidad y tu hogar</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl mb-10 animate-fade-in-up font-medium leading-relaxed">
              En RAN Pisos & Revestimientos, no solo vendemos materiales; acompañamos tus sueños de renovación con asesoramiento experto y los mejores productos del mercado.
            </p>
          </div>
        </div>
      </section>

      {/* ─── QUIÉNES SOMOS ─── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-slate-50">
              <Image 
                src="/nosotros_equipo_1774201345463.png" 
                alt="Nuestro Showroom" 
                fill 
                className="object-cover"
              />
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-black text-ran-navy italic">
                  Quiénes <span className="text-ran-cerulean">Somos</span>
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Somos una empresa familiar apasionada por la arquitectura y el diseño de interiores. Desde nuestra casa central, nos hemos consolidado como referentes en la comercialización de revestimientos cerámicos de alta gama.
                </p>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Contamos con un equipo técnico especializado y un stock permanente para garantizar que cada proyecto, desde una pequeña remodelación hasta una gran obra, cuente con los mejores materiales en tiempo récord.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-3">
                  <Award className="h-8 w-8 text-ran-cerulean" />
                  <p className="font-black text-ran-navy leading-tight">Calidad Premium</p>
                </div>
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-3">
                  <Truck className="h-8 w-8 text-ran-cerulean" />
                  <p className="font-black text-ran-navy leading-tight">Stock Inmediato</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HISTORIA ─── */}
      <section className="py-24 bg-[#1B2A4A] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <History className="h-12 w-12 text-ran-cerulean mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl md:text-5xl font-black italic mb-6">Nuestra <span className="text-ran-cerulean">Historia</span></h2>
            <p className="text-white/60 text-lg">
              Lo que comenzó como un pequeño depósito local se convirtió en el principal centro de distribución de cerámicas exclusivas en la región.
            </p>
          </div>
          
          <div className="relative">
            {/* Simple Timeline line */}
            <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-white/10 hidden md:block" />
            
            <div className="space-y-12 relative z-10">
              {[
                { year: 'Los Inicios', text: 'Fundamos RAN con la visión de llevar diseño de vanguardia a cada hogar.' },
                { year: 'Crecimiento', text: 'Expandimos nuestras instalaciones y automatizamos nuestra logística para mayor rapidez.' },
                { year: 'Innovación', text: 'Lanzamos nuestra plataforma de asesoramiento en línea para democratizar el acceso a expertos.' }
              ].map((item, i) => (
                <div key={i} className={`flex flex-col md:flex-row items-center gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className="flex-1 md:text-right">
                    <div className={`${i % 2 === 0 ? 'md:text-right' : 'md:text-left'} space-y-2`}>
                      <span className="text-ran-cerulean font-black text-2xl tracking-widest">{item.year}</span>
                      <p className="text-white/70 max-w-sm ml-auto mr-auto md:ml-0 md:mr-0">{item.text}</p>
                    </div>
                  </div>
                  <div className="h-4 w-4 rounded-full bg-ran-cerulean shadow-[0_0_20px_rgba(74,144,226,0.6)] z-20" />
                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── MISIÓN VS VISIÓN ─── */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group p-12 rounded-[3.5rem] bg-slate-50 border border-slate-100 hover:border-ran-cerulean/20 transition-all hover:shadow-2xl hover:shadow-ran-cerulean/10">
              <div className="h-16 w-16 bg-ran-cerulean/10 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110">
                <Target className="h-8 w-8 text-ran-cerulean" />
              </div>
              <h3 className="text-3xl font-black text-ran-navy mb-6 italic">Nuestra Misión</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Empoderar a nuestros clientes brindándoles las herramientas tecnológicas y el asesoramiento humano necesario para tomar las mejores decisiones en la renovación de sus hogares.
              </p>
            </div>

            <div className="group p-12 rounded-[3.5rem] bg-ran-navy border border-white/5 hover:border-ran-cerulean/40 transition-all hover:shadow-2xl hover:shadow-ran-cerulean/20">
              <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110">
                <Eye className="h-8 w-8 text-ran-cerulean" />
              </div>
              <h3 className="text-3xl font-black text-white mb-6 italic">Nuestra Visión</h3>
              <p className="text-white/60 text-lg leading-relaxed">
                Liderar la industria de la construcción digital en Argentina, siendo reconocidos por la transparencia en nuestros cálculos, la calidad de nuestros productos y la excelencia en el trato comercial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL BANNER ─── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-ran-cerulean rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:20px_20px]" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-5xl font-black text-white italic leading-tight">
                Construí tu futuro con <br /> materiales de confianza
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 text-white/90 font-bold bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
                  <CheckCircle2 className="h-5 w-5" /> 98+ Modelos
                </div>
                <div className="flex items-center gap-2 text-white/90 font-bold bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
                  <Users className="h-5 w-5" /> Atención Directa
                </div>
                <div className="flex items-center gap-2 text-white/90 font-bold bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
                  <Building2 className="h-5 w-5" /> Showroom Propio
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
