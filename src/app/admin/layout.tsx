'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  TrendingUp,
  FileText,
  Settings,
  ShoppingCart,
  BarChart3,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';

const adminNavItems = [
  { href: '/admin', label: 'Panel', icon: LayoutDashboard },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/presupuestos', label: 'Presupuestos', icon: FileText },
  { href: '/admin/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/admin/finanzas', label: 'Finanzas', icon: TrendingUp },
  { href: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/admin/subir-productos', label: 'Subir Productos', icon: Upload },
  { href: '/admin/ajustes', label: 'Ajustes', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ranUser } = useAuth();

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen flex bg-background">
        {/* Sidebar - Adjusted for Global Navbar */}
        <aside className="w-64 shrink-0 border-r border-border bg-card hidden lg:flex flex-col sticky top-22 h-[calc(100vh-88px)]">
          {/* Brand */}
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

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-ran-slate text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Back to site */}
          <div className="p-3 border-t border-border">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              ← Volver al sitio
            </Link>
          </div>
        </aside>

        {/* Mobile top nav - Adjusted for Global Navbar */}
        <div className="lg:hidden fixed top-22 left-0 right-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3 overflow-x-auto">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isActive ? 'bg-ran-slate text-white' : 'border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="h-3 w-3" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Main content - Adjusted for Global Navbar */}
        <main className="flex-1 overflow-auto lg:pt-0 pt-14">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
