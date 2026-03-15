'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { useEffect, useState } from 'react';
import { getSales } from '@/lib/firebase/sales';
import { getAllQuotes } from '@/lib/firebase/quotes';
import { Sale, Quote } from '@/lib/types';
import { formatARS } from '@/lib/utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, TrendingUp, Users, ShoppingCart } from 'lucide-react';

export default function AdminReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSales(), getAllQuotes()]).then(([sales, quotes]) => {
      // Simple aggregation for the last 6 months
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const currentMonth = new Date().getMonth();
      const last6 = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(currentMonth - (5 - i));
        return {
          name: months[d.getMonth()],
          monthIndex: d.getMonth(),
          year: d.getFullYear(),
          ventas: 0
        };
      });

      sales.forEach(s => {
        const d = s.createdAt;
        const m = d.getMonth();
        const y = d.getFullYear();
        const found = last6.find(x => x.monthIndex === m && x.year === y);
        if (found) found.ventas += s.totalAmount;
      });

      setData({
        chart: last6,
        totalSales: sales.reduce((s, x) => s + x.totalAmount, 0),
        totalQuotes: quotes.length,
        conversionRate: quotes.length > 0 ? (sales.length / quotes.length) * 100 : 0
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#3B82C4]" /></div>;

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black">Reportes Estadísticos</h1>
          <p className="text-muted-foreground">Análisis de rendimiento y conversión</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Ventas Totales</span>
            </div>
            <div className="text-2xl font-black">{formatARS(data.totalSales)}</div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="h-5 w-5 text-[#3B82C4]" />
              <span className="text-sm font-medium">Presupuestos</span>
            </div>
            <div className="text-2xl font-black">{data.totalQuotes}</div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Tasa de Conversión</span>
            </div>
            <div className="text-2xl font-black">{data.conversionRate.toFixed(1)}%</div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border">
          <h2 className="font-bold mb-6">Ventas por Mes (Últimos 6 meses)</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(v: any) => [formatARS(Number(v)), 'Ventas']}
                />
                <Bar dataKey="ventas" radius={[4, 4, 0, 0]}>
                  {data.chart.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 5 ? '#3B82C4' : '#1B2A4A'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
