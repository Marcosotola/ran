'use client';

import Image from 'next/image';
import Link from 'next/link';

const BRANDS = [
  {
    name: 'Lourdes Cerámicas',
    logo: '/brands/lourdes.png',
    link: '/catalogo?brand=Cerámica Lourdes',
    width: 180,
    height: 60,
  },
  {
    name: 'San Pietro Porcelanato',
    logo: '/brands/san-pietro.png',
    link: '/catalogo?brand=San Pietro',
    width: 200,
    height: 50,
  },
  {
    name: 'SPL Porcelanatos',
    logo: '/brands/spl.png',
    link: '/catalogo?brand=SPL',
    width: 120,
    height: 60,
  },
];

export function BrandPartners() {
  return (
    <section className="bg-white py-10 border-b border-ran-slate/5">
      <div className="container mx-auto px-4">
        <p className="text-center text-ran-slate/60 text-xs font-bold uppercase tracking-widest mb-8">
          Marcas que nos acompañan
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 transition-all duration-500">
          {BRANDS.map((brand) => (
            <Link 
              key={brand.name} 
              href={brand.link}
              className="relative transition-all duration-300 hover:scale-110 filter drop-shadow-sm hover:drop-shadow-md cursor-pointer"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-14 md:h-20 w-auto object-contain"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
