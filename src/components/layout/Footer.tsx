'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Instagram, Facebook } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { subscribeToSettings, AppSettings } from '@/lib/firebase/settings';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    return subscribeToSettings((data) => setSettings(data));
  }, []);

  const contact = settings?.contactInfo;

  return (
    <footer className="bg-ran-slate text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo2Blanco.svg"
                alt="RAN Pisos & Revestimientos"
                width={250}
                height={200}
                className="hover:opacity-90 transition-opacity"
              />
            </Link>
            <p className="text-sm leading-relaxed text-white/70">
              Especialistas en pisos y revestimientos cerámicos. Asesoramiento personalizado y los mejores materiales para tu hogar.
            </p>
            <div className="flex items-center gap-3">
              {contact?.instagram && (
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-ran-cerulean transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {contact?.facebook && (
                <a
                  href={contact.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-ran-cerulean transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {contact?.whatsapp && (
                <a
                  href={`https://wa.me/${contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-green-600 transition-colors"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.099-.472-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Catálogo</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/catalogo?categoria=pisos" className="hover:text-white hover:underline transition-colors">Pisos</Link></li>
              <li><Link href="/catalogo?categoria=paredes" className="hover:text-white hover:underline transition-colors">Revestimientos de pared</Link></li>
              <li><Link href="/catalogo?size=56x56" className="hover:text-white hover:underline transition-colors">56×56 cm</Link></li>
              <li><Link href="/catalogo?size=35x35" className="hover:text-white hover:underline transition-colors">35×35 cm</Link></li>
              <li><Link href="/inspiracion" className="hover:text-white hover:underline transition-colors">Galería de ambientes</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Servicios</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/chat" className="hover:text-white hover:underline transition-colors">Asesoramiento con IA</Link></li>
              <li><Link href="/contacto" className="hover:text-white hover:underline transition-colors font-semibold text-ran-cerulean">Contacto</Link></li>
              <li><Link href="/auth/register" className="hover:text-white hover:underline transition-colors">Crear cuenta</Link></li>
              <li><Link href="/auth/login" className="hover:text-white hover:underline transition-colors">Iniciar sesión</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              {contact?.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-ran-cerulean mt-0.5 shrink-0" />
                  <span>{contact.address}</span>
                </li>
              )}
              {contact?.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-ran-cerulean shrink-0" />
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors">{contact.phone}</a>
                </li>
              )}
              {contact?.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-ran-cerulean shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors">{contact.email}</a>
                </li>
              )}
              {contact?.emailSales && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-ran-cerulean shrink-0" />
                  <a href={`mailto:${contact.emailSales}`} className="hover:text-white transition-colors">{contact.emailSales}</a>
                </li>
              )}
              {contact?.emailAdmin && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-ran-cerulean shrink-0" />
                  <a href={`mailto:${contact.emailAdmin}`} className="hover:text-white transition-colors">{contact.emailAdmin}</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {currentYear} RAN Pisos & Revestimientos. Todos los derechos reservados.</p>
          <p>Diseñado con ❤️ en Argentina</p>
        </div>
      </div>
    </footer>
  );
}
