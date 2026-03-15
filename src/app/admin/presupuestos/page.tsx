'use client';

import { useEffect, useState } from 'react';
import { updateQuoteStatus, getAllQuotes } from '@/lib/firebase/quotes';
import { Quote, QuoteStatus } from '@/lib/types';
import { formatARS, formatDate, formatQuoteNumber } from '@/lib/utils/calculations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Search, CheckCircle2, X, Clock, Eye, Loader2 } from 'lucide-react';

const STATUS_LABELS: Record<QuoteStatus, { label: string; class: string }> = {
  draft: { label: 'Borrador', class: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Enviado', class: 'bg-blue-100 text-blue-700' },
  viewed: { label: 'Visto', class: 'bg-purple-100 text-purple-700' },
  accepted: { label: 'Aceptado', class: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado', class: 'bg-red-100 text-red-700' },
  expired: { label: 'Vencido', class: 'bg-gray-100 text-gray-500' },
  converted: { label: 'Vendido', class: 'bg-amber-100 text-amber-700' },
};

export default function PresupuestosAdminPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filtered, setFiltered] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Quote | null>(null);

  useEffect(() => {
    getAllQuotes()
      .then((q) => {
        setQuotes(q);
        setFiltered(q);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...quotes];
    if (statusFilter !== 'all') result = result.filter((q) => q.status === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (q) =>
          q.clientName?.toLowerCase().includes(s) ||
          q.clientEmail?.toLowerCase().includes(s) ||
          q.id?.includes(s),
      );
    }
    setFiltered(result);
  }, [quotes, search, statusFilter]);

  const changeStatus = async (id: string, status: QuoteStatus) => {
    try {
      await updateQuoteStatus(id, status);
      setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
      if (selected?.id === id) setSelected((q) => q ? { ...q, status } : null);
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black">Presupuestos</h1>
        <p className="text-muted-foreground text-sm">{quotes.length} presupuestos totales</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#3B82C4]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30" />
          <p className="font-semibold">Sin presupuestos</p>
          <p className="text-sm text-muted-foreground">No hay presupuestos que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((q) => {
            const statusInfo = STATUS_LABELS[q.status];
            return (
              <div
                key={q.id}
                className="bg-card rounded-xl border border-border p-4 hover:border-[#3B82C4]/30 transition-colors cursor-pointer"
                onClick={() => setSelected(q)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-sm">{formatQuoteNumber(q.id ?? '')}</span>
                      <Badge className={`text-xs ${statusInfo.class}`}>{statusInfo.label}</Badge>
                    </div>
                    <p className="font-semibold truncate">{q.clientName ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{q.clientEmail}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {q.createdAt ? formatDate(q.createdAt) : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg">{formatARS(q.grandTotal)}</p>
                    <p className="text-xs text-muted-foreground">{q.items?.length ?? 0} ítem(s)</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  {q.status === 'sent' && (
                    <>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs bg-green-500 hover:bg-green-600 text-white border-0"
                        onClick={() => changeStatus(q.id!, 'accepted')}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Aceptar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => changeStatus(q.id!, 'rejected')}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Rechazar
                      </Button>
                    </>
                  )}
                  {q.status === 'accepted' && (
                    <Badge className="bg-green-100 text-green-700 text-xs h-7 px-2">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Confirmado
                    </Badge>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs ml-auto">
                    <Eye className="h-3 w-3 mr-1" />
                    Detalle
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail drawer (simple overlay) */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setSelected(null)} />
          <div className="w-full max-w-sm bg-card border-l border-border overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg">Detalle</h2>
              <Button size="icon" variant="ghost" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">N° Presupuesto: </span><strong>{formatQuoteNumber(selected.id ?? '')}</strong></div>
              <div><span className="text-muted-foreground">Cliente: </span><strong>{selected.clientName}</strong></div>
              <div><span className="text-muted-foreground">Email: </span>{selected.clientEmail}</div>
              <div><span className="text-muted-foreground">Teléfono: </span>{selected.clientPhone ?? '—'}</div>
              <div><span className="text-muted-foreground">Estado: </span><Badge className={`text-xs ${STATUS_LABELS[selected.status].class}`}>{STATUS_LABELS[selected.status].label}</Badge></div>
              <div><span className="text-muted-foreground">Fecha: </span>{selected.createdAt ? formatDate(selected.createdAt) : '—'}</div>
            </div>
            <div className="border-t border-border pt-4 space-y-2">
              <h3 className="font-bold text-sm">Productos</h3>
              {selected.items?.map((item, i) => (
                <div key={i} className="text-sm bg-muted rounded-lg p-3 space-y-1">
                  <p className="font-semibold">{item.name}</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{item.m2} m² · {item.boxes} cajas</span>
                    <span className="font-bold text-foreground">{formatARS(item.subtotal)}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between font-black pt-2">
                <span>Total</span>
                <span>{formatARS(selected.grandTotal)}</span>
              </div>
            </div>
            {selected.status === 'sent' && (
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white border-0 text-sm" onClick={() => changeStatus(selected.id!, 'accepted')}>
                  Aceptar
                </Button>
                <Button variant="outline" className="flex-1 text-red-500 border-red-200 text-sm" onClick={() => changeStatus(selected.id!, 'rejected')}>
                  Rechazar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
