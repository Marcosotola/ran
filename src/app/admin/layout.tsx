'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  FileText,
  Settings,
  ShoppingCart,
  BarChart3,
  Upload,
  Menu as MenuIcon,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { getPendingQuotesCount } from '@/lib/firebase/quotes';
import { Badge } from '@/components/ui/badge';

const adminNavItems = [
  { href: '/admin', label: 'Panel', icon: LayoutDashboard },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/presupuestos', label: 'Presupuestos', icon: FileText },
  { href: '/admin/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/admin/finanzas', label: 'Finanzas', icon: TrendingUp },
  { href: '/admin/egresos', label: 'Egresos', icon: TrendingDown },
  { href: '/admin/subir-productos', label: 'Subir Productos', icon: Upload },
  { href: '/chat?mode=management', label: 'Chat IA', icon: Sparkles },
  { href: '/admin/ajustes', label: 'Ajustes', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ranUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Escuchar el conteo de presupuestos pendientes cada vez que cambie la ruta 
    // o el usuario, esto mantiene el badge actualizado sin polling excesivo
    getPendingQuotesCount().then(setPendingCount);
  }, [pathname, ranUser]);

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? 'py-6 px-4' : ''}`}>
      {!mobile && (
        <div className="p-4 border-b border-border">
          <div className="bg-ran-slate rounded-xl p-3 flex items-center gap-3">
            <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Panel Admin</p>
              <p className="text-white/70 text-xs truncate max-w-32">{ranUser?.displayName || 'Admin'}</p>
            </div>
          </div>
        </div>
      )}

      {mobile && (
        <div className="mb-8 p-4 bg-ran-navy rounded-2xl flex items-center gap-3">
           <div className="h-10 w-10 bg-ran-cerulean rounded-xl flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-xs uppercase tracking-widest">Dashboard</p>
              <p className="text-white/60 text-[10px]">{ranUser?.displayName}</p>
            </div>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => mobile && setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-black uppercase tracking-tight transition-all duration-150 ${
                isActive
                  ? 'bg-ran-slate text-white shadow-md scale-[1.02]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-ran-cerulean' : ''}`} />
              <span className="flex-1">{item.label}</span>
              {item.href === '/admin/presupuestos' && pendingCount > 0 && (
                <Badge className="bg-red-500 text-white h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] animate-pulse">
                  {pendingCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-bold"
        >
          ← Volver al sitio
        </Link>
      </div>
    </div>
  );

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#F8FAFC]">
        {/* Desktop Sidebar */}
        <aside className="w-72 shrink-0 border-r border-border bg-white hidden lg:flex flex-col sticky top-28 h-[calc(100vh-112px)]">
          <NavContent />
        </aside>

        {/* Mobile Nav Top Bar */}
        <div className="lg:hidden fixed top-28 left-0 right-0 z-40 bg-white border-b border-border px-6 py-4 flex items-center gap-4 shadow-sm">
           <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 text-ran-navy hover:bg-slate-100 rounded-xl shrink-0">
                    <MenuIcon className="h-7 w-7" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm p-0 border-r-0 bg-white [&>button]:bg-ran-navy [&>button]:text-white [&>button]:hover:bg-ran-navy/90 [&>button]:shadow-lg [&>button]:rounded-full">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navegación Admin</SheetTitle>
                </SheetHeader>
                <NavContent mobile />
              </SheetContent>
           </Sheet>

           <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-ran-navy rounded-lg flex items-center justify-center">
                 <Settings className="h-4 w-4 text-white" />
              </div>
              <span className="font-black text-ran-navy uppercase text-sm tracking-tighter">Admin Panel</span>
           </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden pt-28 pb-32 lg:pt-0 lg:pb-0">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
