'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  User,
  MessageSquare,
  UserCircle,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/inspiracion', label: 'Inspiración' },
  { href: '/contacto', label: 'Contacto' },
];

const ROLE_LABELS: Record<string, string> = {
  cliente: 'Cliente',
  vendedor: 'Vendedor',
  contenido: 'Contenido',
  secretaria: 'Secretaría',
  finanzas: 'Finanzas',
  admin: 'Admin',
  dev: 'Dev',
};

const ROLE_COLORS: Record<string, string> = {
  cliente: 'secondary',
  vendedor: 'default',
  contenido: 'default',
  secretaria: 'default',
  finanzas: 'default',
  admin: 'destructive',
  dev: 'destructive',
};

function getDashboardUrl(role: string): string {
  const map: Record<string, string> = {
    admin: '/admin',
    finanzas: '/finanzas',
    contenido: '/contenido',
    secretaria: '/secretaria',
    vendedor: '/vendedor',
    dev: '/dev',
    cliente: '/cliente',
  };
  return map[role] || '/cliente';
}

export function Navbar() {
  const { ranUser, logOut } = useAuth();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const initials = ranUser?.displayName
    ? ranUser.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  // INVERTIDO: sin scroll = blanco, con scroll = slate oscuro
  const textColor = scrolled ? 'text-white' : 'text-[var(--color-ran-navy)]';
  const hoverBg = scrolled ? 'hover:bg-white/10' : 'hover:bg-gray-100';

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-300
      ${
        scrolled
          ? 'bg-[var(--color-ran-slate)] shadow-md border-white/10'
          : 'bg-white shadow-sm border-gray-200'
      }`}
    >
      <nav className="container mx-auto flex h-22 items-center justify-between px-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={scrolled ? '/logo2Blanco.svg' : '/logo2Azul.svg'}
            alt="RAN Pisos & Revestimientos"
            width={300}
            height={250}
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`px-4 py-2 rounded-md text-lg font-medium transition-colors
                ${
                  pathname.startsWith(link.href)
                    ? scrolled
                      ? 'bg-white/15 text-white'
                      : 'bg-[var(--color-ran-cerulean)]/10 text-[var(--color-ran-cerulean)] border-[var(--color-ran-cerulean)]/20'
                    : scrolled
                    ? 'text-white bg-white/10 hover:bg-white/20'
                    : 'text-[var(--color-ran-cerulean)] bg-[var(--color-ran-cerulean)]/5 hover:bg-[var(--color-ran-cerulean)]/10 border-[var(--color-ran-cerulean)]/10'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {/* Removí el link directo Mi Panel de aquí para dejarlo solo en el menú desplegable */}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-6">

          {/* Chat IA - Solo desktop — fondo cerulean destacado */}
          <Button
            size="sm"
            className="hidden md:flex items-center gap-2 text-lg bg-[var(--color-ran-cerulean)] hover:bg-[var(--color-ran-cerulean)]/90 text-white border-0 shadow-sm"
            asChild
          >
            <Link href="/chat">
              <MessageSquare className="h-4 w-4" />
              Chat IA
            </Link>
          </Button>

          {/* User Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {ranUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors
                    ${textColor} ${hoverBg}`}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-ran-cerulean text-white text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-md font-medium max-w-24 truncate">
                      {ranUser.displayName.split(' ')[0]}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold truncate">{ranUser.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{ranUser.email}</p>
                    <Badge variant={ROLE_COLORS[ranUser.role] as any} className="mt-1 text-xs">
                      {ROLE_LABELS[ranUser.role]}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardUrl(ranUser.role)} className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" /> Mi Panel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/perfil" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" /> Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logOut()} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" /> Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Icono de persona en lugar de los botones de texto */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center justify-center rounded-lg p-2 transition-colors ${textColor} ${hoverBg}`}
                    aria-label="Acceder a mi cuenta"
                  >
                    <UserCircle className="h-6 w-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link href="/auth/login" className="flex items-center gap-2 cursor-pointer">
                      <LogOut className="h-4 w-4 rotate-180" /> Ingresar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/auth/register" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" /> Registrarse
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`md:hidden ${textColor} ${hoverBg}`}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-72 bg-[var(--color-ran-navy)] border-white/10 text-white flex flex-col p-0"
            >
              {/* ACCESIBILIDAD: Header obligatorio pero oculto visualmente */}
              <SheetHeader className="sr-only">
                <SheetTitle>Menú de navegación</SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {/* Links Principales */}
                <div className="space-y-1">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center px-4 py-3 rounded-lg text-lg font-medium hover:bg-white/10 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/chat"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium bg-[var(--color-ran-cerulean)]/20 hover:bg-[var(--color-ran-cerulean)]/30 transition-colors text-[var(--color-ran-cerulean)]"
                  >
                    <MessageSquare className="h-5 w-5" />
                    Chat con IA
                  </Link>
                </div>

                <hr className="my-4 border-white/10" />

                {/* Sección Auth / Cuenta en Móvil */}
                <div className="pt-2">
                  {!ranUser ? (
                    <div className="flex flex-col gap-3">
                      <Button variant="outline" className="w-full text-white border-white/20 hover:bg-white/10 py-6 text-lg" asChild onClick={() => setMobileOpen(false)}>
                        <Link href="/auth/login">Ingresar</Link>
                      </Button>
                      <Button className="w-full ran-gradient text-white border-0 py-6 text-lg" asChild onClick={() => setMobileOpen(false)}>
                        <Link href="/auth/register">Registrarse</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {/* User Info Header */}
                      <div className="flex items-center gap-3 px-4 py-4 mb-4 bg-white/5 rounded-xl border border-white/10">
                        <Avatar className="h-10 w-10 border border-white/20">
                          <AvatarFallback className="bg-ran-cerulean text-white text-sm font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold truncate leading-tight">{ranUser.displayName}</span>
                          <span className="text-xs text-white/50 truncate mb-1">{ranUser.email}</span>
                          <Badge variant={ROLE_COLORS[ranUser.role] as any} className="w-fit text-[10px] h-4 px-1 leading-none uppercase tracking-wider">
                            {ROLE_LABELS[ranUser.role]}
                          </Badge>
                        </div>
                      </div>

                      <p className="px-4 text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Mi Cuenta</p>
                      
                      <Link href={getDashboardUrl(ranUser.role)} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-colors">
                        <LayoutDashboard className="h-5 w-5 opacity-70" /> 
                        <span className="text-base">Mi Panel</span>
                      </Link>

                      <Link href="/perfil" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-colors">
                        <User className="h-5 w-5 opacity-70" /> 
                        <span className="text-base">Mi Perfil</span>
                      </Link>

                      <button 
                        onClick={() => { logOut(); setMobileOpen(false); }} 
                        className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-lg mt-6 transition-colors w-full text-left"
                      >
                        <LogOut className="h-5 w-5" /> 
                        <span className="text-base font-medium">Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
