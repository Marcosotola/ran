'use client';

import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getProducts } from '@/lib/firebase/products';
import { getAllQuotes } from '@/lib/firebase/quotes';
import { formatARS } from '@/lib/utils/calculations';
import {
  Package,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ShoppingCart,
  ArrowRight,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalQuotes: number;
  pendingQuotes: number;
  totalUsers: number;
  lowStockProducts: number;
  totalSalesValue: number;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  href,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  href?: string;
  sub?: string;
}) => {
  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {href && (
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-ran-cerulean transition-colors" />
        )}
      </div>
      <div className="text-2xl font-black mb-0.5">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1 text-ran-slate/60">{sub}</div>}
    </>
  );

  if (href) {
    return (
      <Link 
        href={href} 
        className="bg-card rounded-2xl border border-border p-5 ran-card-hover group cursor-pointer block"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      {content}
    </div>
  );
};

import { useAuth } from '@/lib/firebase/auth-context';

export default function AdminDashboardPage() {
  const { ranUser, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !ranUser || ranUser.role !== 'admin') return;

    async function loadStats() {
      try {
        const [products, quotes, usersSnap] = await Promise.all([
          getProducts({}),
          getAllQuotes(),
          getCountFromServer(collection(db, 'users')),
        ]);

        const activeProducts = products.filter((p) => p.isActive).length;
        const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10).length;
        const pendingQuotes = quotes.filter((q) => q.status === 'sent').length;
        const salesValue = quotes
          .filter((q) => q.status === 'accepted')
          .reduce((s, q) => s + q.grandTotal, 0);

        setStats({
          totalProducts: products.length,
          activeProducts,
          totalQuotes: quotes.length,
          pendingQuotes,
          totalUsers: usersSnap.data().count,
          lowStockProducts: lowStock,
          totalSalesValue: salesValue,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black">Panel</h1>
        <p className="text-muted-foreground">Resumen general de RAN Pisos & Revestimientos</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          label="Productos totales"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          color="bg-ran-navy"
          href="/admin/productos"
          sub={`${stats?.activeProducts} activos`}
        />
        <StatCard
          label="Presupuestos"
          value={stats?.totalQuotes ?? 0}
          icon={FileText}
          color="bg-ran-cerulean"
          href="/admin/presupuestos"
          sub={`${stats?.pendingQuotes} pendientes`}
        />
        <StatCard
          label="Usuarios"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          color="bg-purple-500"
          href="/admin/usuarios"
        />
        <StatCard
          label="Ventas aceptadas"
          value={formatARS(stats?.totalSalesValue ?? 0)}
          icon={DollarSign}
          color="bg-green-500"
          href="/admin/ventas"
        />
        <StatCard
          label="Stock bajo"
          value={stats?.lowStockProducts ?? 0}
          icon={AlertCircle}
          color="bg-amber-500"
          href="/admin/productos"
          sub="Menos de 10 cajas"
        />
        <StatCard
          label="Subir productos"
          value="→"
          icon={TrendingUp}
          color="ran-gradient"
          href="/admin/subir-productos"
          sub="Agregar al catálogo"
        />
        <StatCard
          label="Finanzas"
          value="→"
          icon={ShoppingCart}
          color="bg-[#708090]"
          href="/admin/finanzas"
          sub="Ver ingresos/egresos"
        />
        <StatCard
          label="Ajustes"
          value="→"
          icon={Settings}
          color="bg-slate-600"
          href="/admin/ajustes"
          sub="Configuración del sistema"
        />
      </div>

      {/* Quick links cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Recent activity note */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-ran-navy">
            <FileText className="h-5 w-5 text-ran-cerulean" />
            Acciones rápidas
          </h2>
          <div className="space-y-2">
            {[
              { label: 'Ver presupuestos pendientes', href: '/admin/presupuestos?status=sent' },
              { label: 'Agregar nuevo producto', href: '/admin/subir-productos' },
              { label: 'Ver reporte de ventas', href: '/admin/reportes' },
              { label: 'Gestionar usuarios', href: '/admin/usuarios' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors group"
              >
                <span className="text-sm font-medium">{item.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-ran-cerulean transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* System info */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Estado del sistema
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Firebase</span>
              <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Conectado
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">IA (Gemini)</span>
              {process.env.NEXT_PUBLIC_HAS_GEMINI === 'true' ? (
                <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Activo
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Requiere configuración
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">MercadoPago</span>
              <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Pendiente configurar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
