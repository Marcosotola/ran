'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { getQuotesByClient } from '@/lib/firebase/quotes';
import { formatARS, formatDate } from '@/lib/utils/calculations';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar, 
  ChevronLeft,
  Loader2,
  DollarSign,
  Package
} from 'lucide-react';
import Link from 'next/link';

export default function MisPresupuestosPage() {
  const { ranUser } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ranUser) return;
    getQuotesByClient(ranUser.uid).then(setQuotes).finally(() => setLoading(false));
  }, [ranUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-ran-cerulean" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/perfil" className="h-10 w-10 bg-white border rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mis Presupuestos</h1>
        </div>

        {quotes.length === 0 ? (
          <Card className="p-16 text-center rounded-[32px] border-dashed">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-10" />
            <p className="text-xl font-bold text-slate-400">No tienes presupuestos generados todavía.</p>
            <Link href="/catalogo" className="text-ran-cerulean font-bold mt-2 inline-block hover:underline">
              Explora el catálogo y pide tu cotización
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map(q => (
              <Card key={q.id} className="p-6 rounded-[24px] border-slate-200 shadow-sm bg-white hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-ran-navy/5 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-ran-navy" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
                        #{q.id?.slice(-6)}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mt-1">
                        {q.createdAt ? formatDate(q.createdAt) : '—'}
                      </p>
                    </div>
                  </div>
                  <Badge className={`bg-${q.status === 'accepted' ? 'green' : q.status === 'sent' ? 'blue' : 'slate'}-100 text-${q.status === 'accepted' ? 'green' : q.status === 'sent' ? 'blue' : 'slate'}-700 border-0 uppercase text-[9px] font-black`}>
                    {q.status === 'sent' ? 'Enviado' : q.status === 'accepted' ? 'Aceptado' : q.status}
                  </Badge>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Package className="h-4 w-4" />
                    <p className="text-sm font-bold truncate">{q.items?.length || 0} productos incluidos</p>
                  </div>
                  <div className="flex items-center gap-3 text-slate-900">
                    <DollarSign className="h-4 w-4 text-[#3B82C4]" />
                    <p className="text-2xl font-black tracking-tight">{formatARS(q.grandTotal)}</p>
                  </div>
                </div>

                <Link href={`/presupuesto/${q.id}`} className="block w-full mt-6 py-3 rounded-xl bg-slate-50 text-slate-900 text-center font-bold text-sm hover:bg-slate-100 transition-colors">
                  VER DETALLE COMPLETO
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
