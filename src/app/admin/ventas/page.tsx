'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { useEffect, useState } from 'react';
import { getSales } from '@/lib/firebase/sales';
import { Sale } from '@/lib/types';
import { formatARS, formatDate } from '@/lib/utils/calculations';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart } from 'lucide-react';

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSales().then(setSales).finally(() => setLoading(false));
  }, []);

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black">Registro de Ventas</h1>
          <p className="text-muted-foreground">Listado histórico de todas las ventas concretadas</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#3B82C4]" /></div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold">Monto</th>
                  <th className="text-left px-4 py-3 font-semibold">Pago</th>
                  <th className="text-left px-4 py-3 font-semibold">Vendedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.map(s => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold">{s.clientName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(s.createdAt as any)}</td>
                    <td className="px-4 py-3 font-bold">{formatARS(s.totalAmount)}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{s.paymentMethod.replace('_', ' ')}</Badge></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.vendorId === 'manual' ? 'Secretaría' : 'Vendedor'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length === 0 && (
              <div className="py-20 text-center text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No se registraron ventas todavía</p>
              </div>
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
