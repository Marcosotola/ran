'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/lib/firebase/auth-context';
import { useEffect, useState, useMemo } from 'react';
import { getAllQuotes, updateQuote, updateQuoteStatus, deleteQuote } from '@/lib/firebase/quotes';
import { Quote, QuoteItem, QuoteStatus, PaymentMethod, Sale } from '@/lib/types';
import { formatARS, formatDate, formatQuoteNumber } from '@/lib/utils/calculations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  FileText, 
  Mail, 
  CheckCircle2, 
  Loader2, 
  User, 
  Receipt, 
  Eye, 
  Trash2, 
  Plus, 
  Minus,
  Truck,
  MessageSquare,
  Clock,
  Search,
  X,
  ChevronLeft,
  Store,
  MessageCircle,
  PackagePlus
} from 'lucide-react';
import { convertQuoteToSale } from '@/lib/firebase/sales';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Pendiente',
  viewed: 'Visto por cliente',
  accepted: 'Aceptado/Confirmado',
  rejected: 'Rechazado',
  expired: 'Vencido',
  converted: 'Venta cerrada ✓'
};

const STATUS_STYLES: Record<QuoteStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-indigo-100 text-indigo-700 font-bold animate-pulse',
  accepted: 'bg-green-100 text-green-700 font-black',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-400',
  converted: 'bg-amber-100 text-amber-800 font-black border border-amber-200'
};

export default function PresupuestosAdminPage() {
  const { ranUser } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const refreshQuotes = async () => {
    try {
      const q = await getAllQuotes();
      setQuotes(q);
    } catch {
      toast.error('Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshQuotes();
  }, []);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const matchStatus = statusFilter === 'all' || q.status === statusFilter;
      const matchSearch = !search || 
        q.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        q.id?.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [quotes, search, statusFilter]);

  const stats = useMemo(() => {
    const totalValue = quotes.filter(q => q.status === 'converted').reduce((sum, q) => sum + (q.grandTotal || 0), 0);
    const pendingCount = quotes.filter(q => q.status === 'sent' || q.status === 'accepted').length;
    return { totalValue, pendingCount };
  }, [quotes]);

  const handleContact = (quote: Quote, method: 'email' | 'whatsapp') => {
    if (method === 'whatsapp' && quote.clientPhone) {
      window.open(`https://wa.me/${quote.clientPhone.replace(/\D/g, '')}`, '_blank');
    } else if (method === 'email' && quote.clientEmail) {
      window.location.href = `mailto:${quote.clientEmail}`;
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Header & KPIs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Presupuestos</h1>
              <p className="text-slate-500 font-medium italic">Panel de administración de cotizaciones y leads</p>
            </div>
            
            <div className="flex flex-wrap gap-3 items-stretch w-full md:w-auto">
              <CreateQuoteModal onRefresh={refreshQuotes} />
              <div className="bg-white rounded-2xl border border-border px-6 flex flex-col justify-center min-w-[140px] h-16 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest leading-none mb-1">Pendientes</span>
                <div className="text-xl font-black text-[#3B82C4] leading-none">{stats.pendingCount}</div>
              </div>
              <div className="bg-white rounded-2xl border border-border px-6 flex flex-col justify-center min-w-[160px] h-16 shadow-sm border-l-4 border-l-green-500">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest leading-none mb-1">Total Cerrado</span>
                <div className="text-xl font-black text-green-600 leading-none">
                  {stats.totalValue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-border shadow-xl overflow-hidden">
            {/* Toolbar */}
            <div className="p-6 border-b border-border bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Buscar presupuesto..." 
                  className="pl-10 h-11 bg-white rounded-xl border-slate-200"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-56 h-11 rounded-xl bg-white border-slate-200">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quote List */}
            <div className="divide-y divide-border">
              {loading ? (
                <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-[#3B82C4]" /></div>
              ) : filteredQuotes.length === 0 ? (
                <div className="text-center py-32 text-slate-400">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-10" />
                  <p className="text-lg font-medium">No hay presupuestos todavía</p>
                </div>
              ) : (
                filteredQuotes.map((q) => (
                  <QuoteListItem 
                    key={q.id} 
                    quote={q} 
                    onContact={handleContact} 
                    onRefresh={refreshQuotes} 
                    vendorName={ranUser?.displayName || 'Admin'}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}

function QuoteListItem({ quote, onContact, onRefresh, vendorName }: { 
  quote: Quote, 
  onContact: (q: Quote, m: 'email' | 'whatsapp') => void, 
  onRefresh: () => void,
  vendorName: string
}) {
  return (
    <div className="p-5 hover:bg-slate-50/50 transition-colors group">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">#{formatQuoteNumber(quote.id || '')}</span>
            <Badge variant="outline" className={`${STATUS_STYLES[quote.status]} border-0 font-bold px-2 py-0 h-5`}>
              {STATUS_LABELS[quote.status]}
            </Badge>
          </div>
          <h3 className="text-xl font-black text-slate-800 truncate">{quote.clientName}</h3>
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-1">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatDate(quote.createdAt as any)}</span>
          </div>
        </div>

        {/* Totals */}
        <div className="hidden md:block text-right px-8 border-x border-slate-100">
          <div className="text-2xl font-black text-slate-900">{formatARS(quote.grandTotal)}</div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">Total Presupuestado</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {quote.clientPhone && (
            <Button size="icon" variant="ghost" className="h-14 w-14 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-2xl" onClick={() => onContact(quote, 'whatsapp')}>
              <MessageCircle className="h-7 w-7 fill-current opacity-20" />
              <MessageCircle className="h-7 w-7 absolute" />
            </Button>
          )}
          <QuoteDetailModal quote={quote} onRefresh={onRefresh} vendorName={vendorName} />
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-14 w-14 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl"
            onClick={async () => {
              if (window.confirm('¿ELIMINAR este presupuesto de forma PERMANENTE?')) {
                try {
                  await deleteQuote(quote.id!);
                  toast.success('Presupuesto eliminado');
                  onRefresh();
                } catch {
                  toast.error('Error al eliminar');
                }
              }
            }}
          >
            <Trash2 className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuoteDetailModal({ quote, onRefresh, vendorName }: { quote: Quote, onRefresh: () => void, vendorName: string }) {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);

  const [items, setItems] = useState<QuoteItem[]>(quote.items || []);
  const [shipping, setShipping] = useState<number>(quote.shipping || 0);
  const [notes, setNotes] = useState<string>(quote.notes || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');

  // Load items into state if changed or opened
  useEffect(() => {
    if (open) {
      setItems(quote.items || []);
      setShipping(quote.shipping || 0);
      setNotes(quote.notes || '');
      setEditMode(false);
    }
  }, [open, quote]);

  const totals = useMemo(() => {
    const materials = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    return { materials, grand: materials + shipping };
  }, [items, shipping]);

  const handleUpdateItem = (index: number, updates: Partial<QuoteItem>) => {
    const newItems = [...items];
    const item = { ...newItems[index], ...updates };
    item.subtotal = (item.boxes || 0) * (item.pricePerBox || 0);
    newItems[index] = item;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, {
      productId: 'manual-' + Date.now(),
      name: 'Nuevo Producto',
      size: '-',
      m2: 0,
      boxes: 0,
      pricePerBox: 0,
      subtotal: 0
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateQuote(quote.id!, {
        items, shipping, notes,
        totalMaterials: totals.materials,
        grandTotal: totals.grand,
      });
      toast.success('Cambios guardados');
      setEditMode(false);
      onRefresh();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (status: QuoteStatus) => {
    setLoading(true);
    try {
      await updateQuoteStatus(quote.id!, status);
      toast.success(`Estado actualizado a ${STATUS_LABELS[status]}`);
      onRefresh();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessSale = async () => {
    setConverting(true);
    try {
      await updateQuote(quote.id!, {
        items, shipping, notes,
        totalMaterials: totals.materials,
        grandTotal: totals.grand
      });
      await convertQuoteToSale({ ...quote, items, shipping, notes, grandTotal: totals.grand }, paymentMethod);
      toast.success('¡Venta realizada con éxito!');
      onRefresh();
      setOpen(false);
    } catch (err: any) {
      toast.error('Error al procesar venta: ' + err.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-11 px-6 bg-[#3B82C4] hover:bg-[#2F689D] text-white font-black rounded-xl shadow-lg shadow-blue-500/10">
          <Eye className="h-4 w-4 mr-2" /> VER DETALLES
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed inset-0 z-50 w-screen h-screen max-w-none sm:max-w-none m-0 rounded-none p-0 overflow-y-auto border-0 translate-x-0 translate-y-0 flex flex-col bg-white">
        
        {/* Header - Light & Professional */}
        <div className="bg-white border-b border-slate-200 p-6 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full hover:bg-slate-100">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-black text-[10px] tracking-widest text-[#3B82C4] border-[#3B82C4]/30 uppercase">Presupuesto #{formatQuoteNumber(quote.id || '')}</Badge>
                <Badge className={`${STATUS_STYLES[quote.status]} border-0 font-bold`}>{STATUS_LABELS[quote.status]}</Badge>
              </div>
              <DialogTitle className="text-2xl font-black text-slate-900">{quote.clientName}</DialogTitle>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)} className="font-bold text-slate-500 hover:text-slate-900">
              Cerrar (Esc)
            </Button>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Iniciado por RANI el</p>
              <p className="font-bold">{formatDate(quote.createdAt as any)}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-7xl mx-auto p-8 space-y-10">
            
            {/* Contacts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-green-500 transition-colors">
                <div className="h-14 w-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-black text-lg text-slate-800">{quote.clientPhone || 'Sin teléfono'}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">WhatsApp / Celular</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-[#3B82C4] transition-colors">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#3B82C4] group-hover:scale-110 transition-transform">
                  <Mail className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-black text-lg text-slate-800 truncate max-w-[200px]">{quote.clientEmail || 'Sin email'}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Email de contacto</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 border-l-4 border-l-[#3B82C4]">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Store className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-black text-lg text-slate-800 italic">Vendedor Asignado</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestión de Cuenta</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h4 className="font-black text-xl text-slate-900 tracking-tight">Desglose de Materiales</h4>
                </div>
                {!editMode && quote.status === 'sent' && (
                  <Button variant="outline" className="rounded-xl border-2 font-black text-[#3B82C4] border-[#3B82C4]/20 hover:bg-[#3B82C4]/5" onClick={() => setEditMode(true)}>
                    EDITAR PRESUPUESTO
                  </Button>
                )}
                {editMode && (
                  <Button variant="outline" className="rounded-xl border-2 border-dashed font-black text-green-600 border-green-200 hover:bg-green-50" onClick={handleAddItem}>
                    <PackagePlus className="h-4 w-4 mr-2" /> AÑADIR PRODUCTO
                  </Button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
                    <tr>
                      <th className="px-8 py-4 text-left">Descripción del Artículo</th>
                      <th className="px-5 py-4 text-center">Metros Reales (m²)</th>
                      <th className="px-5 py-4 text-center">Cant. de Cajas</th>
                      <th className="px-5 py-4 text-right">Precio por Caja</th>
                      <th className="px-8 py-4 text-right">Subtotal</th>
                      {editMode && <th className="px-4 py-4 w-10"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5">
                          {editMode ? (
                            <Input className="font-black text-slate-900 h-10 rounded-xl" value={item.name} onChange={(e) => handleUpdateItem(idx, { name: e.target.value })} />
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-lg leading-tight">{item.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.size || 'Medida estándar'}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-5 text-center">
                          {editMode ? (
                            <div className="relative w-24 mx-auto">
                              <Input type="number" className="text-center font-black h-10 rounded-xl pr-6" value={item.m2} onChange={(e) => handleUpdateItem(idx, { m2: parseFloat(e.target.value) || 0 })} />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">m²</span>
                            </div>
                          ) : <span className="font-bold text-slate-700 text-base">{item.m2} m²</span>}
                        </td>
                        <td className="px-5 py-5 text-center">
                          <div className="flex items-center justify-center gap-3">
                            {editMode && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200" onClick={() => handleUpdateItem(idx, { boxes: Math.max(0, item.boxes - 1) })}><Minus className="h-4 w-4 text-slate-600" /></Button>
                            )}
                            <span className="font-black text-slate-900 text-xl w-8 text-center">{item.boxes}</span>
                            {editMode && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200" onClick={() => handleUpdateItem(idx, { boxes: item.boxes + 1 })}><Plus className="h-4 w-4 text-slate-600" /></Button>
                            )}
                          </div>
                          {!editMode && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cajas</p>}
                        </td>
                        <td className="px-5 py-5 text-right">
                          {editMode ? (
                            <div className="relative w-36 ml-auto">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                              <Input type="number" className="pl-7 text-right font-black h-10 rounded-xl" value={item.pricePerBox} onChange={(e) => handleUpdateItem(idx, { pricePerBox: parseFloat(e.target.value) || 0 })} />
                            </div>
                          ) : <span className="font-bold text-slate-700 text-base">{formatARS(item.pricePerBox)}</span>}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="font-black text-slate-900 text-xl leading-none">{formatARS(item.subtotal)}</span>
                        </td>
                        {editMode && (
                          <td className="px-4 py-5 text-center">
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-red-300 hover:text-red-500 hover:bg-red-50" onClick={() => handleRemoveItem(idx)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={editMode ? 6 : 5} className="py-20 text-center text-slate-400 italic">
                          No hay artículos cargados. {editMode ? 'Hacé click en "Añadir Producto"' : 'Presioná "Editar" para cargar materiales manualmente.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Logistics */}
              <div className="space-y-6">
                <h4 className="font-black text-2xl text-slate-900 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center text-white"><Truck className="h-5 w-5" /></div>
                  Logística y Envío
                </h4>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-lg space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Costo de Flete Estimado</Label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">$</span>
                      <Input 
                        type="number" 
                        className="pl-10 h-16 text-2xl font-black rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-[#3B82C4] transition-all" 
                        value={shipping} 
                        onChange={(e) => setShipping(parseFloat(e.target.value) || 0)} 
                        disabled={!editMode && quote.status !== 'sent'} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Notas Internas / Instrucciones</Label>
                    <Textarea 
                      className="min-h-[150px] rounded-[24px] bg-slate-50 border-transparent focus:bg-white focus:ring-[#3B82C4] p-5 text-base font-medium resize-none shadow-inner" 
                      placeholder="Escribe aquí notas sobre el pedido o la entrega..." 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      disabled={!editMode && quote.status !== 'sent'} 
                    />
                  </div>
                </div>
              </div>

              {/* Chat Recap */}
              {quote.aiConversationLog && quote.aiConversationLog.length > 0 && (
                <div className="space-y-6">
                  <h4 className="font-black text-2xl text-slate-900 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center text-white"><MessageSquare className="h-5 w-5" /></div>
                    Conversación con el Cliente
                  </h4>
                  <div className="bg-slate-900 rounded-[32px] p-8 h-[400px] overflow-y-auto space-y-4 custom-scrollbar shadow-2xl relative">
                    <div className="sticky top-0 z-10 bg-slate-900 border-b border-white/5 pb-4 mb-4">
                      <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Historial de Chat de RANI</p>
                    </div>
                    {quote.aiConversationLog.map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.role === 'assistant' ? 'items-start' : 'items-end'}`}>
                        <div className="flex items-center gap-2 mb-1.5 px-2">
                          <span className={`text-[8px] uppercase font-black tracking-tighter ${m.role === 'assistant' ? 'text-purple-400' : 'text-blue-400'}`}>
                            {m.role === 'assistant' ? 'ASISTENTE VIRTUAL (RANI)' : 'SOLICITUD DEL CLIENTE'}
                          </span>
                        </div>
                        <p className={`text-[13px] leading-relaxed p-4 rounded-2xl max-w-[90%] shadow-lg ${
                          m.role === 'assistant' 
                          ? 'bg-white/10 text-white border border-white/10 rounded-tl-none' 
                          : 'bg-[#3B82C4] text-white rounded-tr-none'
                        }`}>
                          {m.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Total Block */}
            <div className="bg-[#1B2A4A] text-white rounded-[40px] p-12 flex flex-col lg:flex-row justify-between items-center shadow-3xl border-4 border-white/5">
              <div className="mb-10 lg:mb-0 space-y-4 text-center lg:text-left">
                <p className="text-white/40 uppercase font-black tracking-[0.3em] text-xs">Resumen Final del Presupuesto</p>
                <div className="flex flex-wrap gap-10 justify-center lg:justify-start">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-none mb-2 text-white">Subtotal Materiales</p>
                    <p className="font-black text-3xl">{formatARS(totals.materials)}</p>
                  </div>
                  <div className="w-px h-12 bg-white/10 self-center hidden md:block" />
                  <div>
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-none mb-2 text-white">Costo Logística</p>
                    <p className="font-black text-3xl text-blue-400">+{formatARS(shipping)}</p>
                  </div>
                </div>
              </div>
              <div className="text-center lg:text-right">
                <p className="text-white/40 uppercase font-black tracking-[0.3em] text-[10px] mb-4 text-white">Monto Total a Cobrar</p>
                <h2 className="text-7xl font-black text-white leading-none tracking-tighter">{formatARS(totals.grand)}</h2>
              </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-slate-200">
              {editMode ? (
                <>
                  <Button className="flex-1 h-20 bg-green-600 hover:bg-green-700 text-white font-black text-2xl rounded-3xl shadow-2xl shadow-green-600/20 active:scale-95 transition-all" onClick={handleSave} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-3 h-8 w-8" /> : <CheckCircle2 className="mr-3 h-8 w-8" />}
                    GUARDAR CAMBIOS ACTUALIZADOS
                  </Button>
                  <Button variant="outline" className="h-20 px-10 border-4 border-slate-200 font-black text-xl rounded-3xl hover:bg-slate-100" onClick={() => { setItems(quote.items); setEditMode(false); }}>
                    CANCELAR
                  </Button>
                </>
              ) : quote.status === 'sent' ? (
                <>
                  <Button className="flex-1 h-20 bg-green-600 hover:bg-green-700 text-white font-black text-2xl rounded-3xl shadow-2xl active:scale-95 transition-all" onClick={() => setStatus('accepted')} disabled={loading}>
                    APROBAR PRESUPUESTO
                  </Button>
                  <Button variant="outline" className="h-20 px-10 border-4 border-red-100 text-red-500 font-black text-xl rounded-3xl hover:bg-red-50" onClick={() => setStatus('rejected')} disabled={loading}>
                    RECHAZARLO
                  </Button>
                </>
              ) : quote.status === 'accepted' ? (
                <div className="w-full bg-white p-10 rounded-[48px] border-2 border-slate-200 shadow-2xl">
                  <h5 className="font-black text-center mb-8 uppercase tracking-[0.4em] text-xs text-[#3B82C4]">Panel de Facturación Inmediata</h5>
                  <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto items-end">
                    <div className="flex-1 w-full space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest text-[#3B82C4]">Metodo De Pago</Label>
                      <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                        <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-transparent font-black text-xl text-slate-800 shadow-inner"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo 💵</SelectItem>
                          <SelectItem value="transferencia">Transferencia 🏛️</SelectItem>
                          <SelectItem value="tarjeta_debito">Tarjeta Débito 💳</SelectItem>
                          <SelectItem value="tarjeta_credito">Tarjeta Crédito 💳</SelectItem>
                          <SelectItem value="cheque">Cheque 📝</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="flex-1 w-full h-20 bg-green-600 hover:bg-green-700 text-white font-black text-2xl rounded-3xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
                      onClick={handleProcessSale}
                      disabled={converting}
                    >
                      {converting ? <Loader2 className="animate-spin h-8 w-8" /> : <Receipt className="h-8 w-8" />}
                      FINALIZAR Y FACTURAR
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full text-center py-6 bg-amber-50 rounded-3xl border border-amber-100 italic font-bold text-amber-700">
                  Este presupuesto ya ha sido cerrado como venta formal.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateQuoteModal({ onRefresh }: { onRefresh: () => void }) {
  const { ranUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [shipping, setShipping] = useState(0);

  const totals = useMemo(() => {
    const materials = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    return { materials, grand: materials + shipping };
  }, [items, shipping]);

  const handleAddItem = () => {
    setItems([...items, {
      productId: 'manual-' + Date.now(),
      name: 'Nuevo Producto',
      size: '-',
      m2: 0,
      boxes: 0,
      pricePerBox: 0,
      subtotal: 0
    }]);
  };

  const handleUpdateItem = (index: number, updates: Partial<QuoteItem>) => {
    const newItems = [...items];
    const item = { ...newItems[index], ...updates };
    item.subtotal = (item.boxes || 0) * (item.pricePerBox || 0);
    newItems[index] = item;
    setItems(newItems);
  };

  const handleCreate = async () => {
    if (!clientName) return toast.error('El nombre del cliente es obligatorio');
    setLoading(true);
    try {
      const { db } = await import('@/lib/firebase/config');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      const quoteData = {
        clientName,
        clientPhone,
        clientEmail,
        items,
        shipping,
        totalMaterials: totals.materials,
        grandTotal: totals.grand,
        status: 'sent',
        assignedVendorId: ranUser?.uid || null,
        createdAt: serverTimestamp(),
        source: 'manual_admin'
      };

      await addDoc(collection(db, 'quotes'), quoteData);
      toast.success('Presupuesto creado con éxito');
      setOpen(false);
      onRefresh();
      // Reset
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setItems([]);
      setShipping(0);
    } catch (e: any) {
      toast.error('Error al crear: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-16 px-8 bg-ran-slate hover:opacity-90 text-white font-black rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-95 border-0">
          <Plus className="h-5 w-5" /> CREAR PRESUPUESTO
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed inset-0 z-50 w-screen h-screen max-w-none sm:max-w-none m-0 rounded-none p-0 overflow-y-auto border-0 translate-x-0 translate-y-0 flex flex-col bg-white">
        <div className="bg-slate-50 border-b p-6 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><ChevronLeft className="h-6 w-6" /></Button>
            <DialogTitle className="text-2xl font-black">Nuevo Presupuesto</DialogTitle>
          </div>
          <Button onClick={handleCreate} disabled={loading} className="ran-gradient h-12 px-8 text-white font-black rounded-xl">
            {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
            REGISTRAR PRESUPUESTO
          </Button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-slate-50/30">
          <div className="max-w-5xl mx-auto space-y-10">
            {/* Form */}
            <div className="bg-white p-8 rounded-3xl border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-[#3B82C4]">Nombre del Cliente</Label>
                <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ej: Juan Pérez" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-[#3B82C4]">WhatsApp / Tel</Label>
                <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Ej: 1123456789" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-[#3B82C4]">Email</Label>
                <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Ej: juan@mail.com" className="h-12 rounded-xl" />
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-3xl border shadow-xl overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h4 className="font-black text-lg">Materiales Solicitados</h4>
                <Button variant="outline" size="sm" onClick={handleAddItem} className="rounded-xl border-dashed">
                  <Plus className="h-4 w-4 mr-2" /> AGREGAR ARTÍCULO
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
                    <tr>
                      <th className="px-6 py-4 text-left">Descripción</th>
                      <th className="px-4 py-4 text-center">m²</th>
                      <th className="px-4 py-4 text-center">Cajas</th>
                      <th className="px-4 py-4 text-right">Precio/Caja</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <Input value={it.name} onChange={e => handleUpdateItem(idx, { name: e.target.value })} className="font-bold h-10 border-0 bg-transparent focus:bg-white" />
                        </td>
                        <td className="px-4 py-4 w-24">
                          <Input type="number" value={it.m2} onChange={e => handleUpdateItem(idx, { m2: parseFloat(e.target.value) || 0 })} className="text-center h-10 border-0 bg-transparent focus:bg-white" />
                        </td>
                        <td className="px-4 py-4 w-24">
                          <Input type="number" value={it.boxes} onChange={e => handleUpdateItem(idx, { boxes: parseInt(e.target.value) || 0 })} className="text-center h-10 border-0 bg-transparent focus:bg-white font-black" />
                        </td>
                        <td className="px-4 py-4 w-32">
                          <Input type="number" value={it.pricePerBox} onChange={e => handleUpdateItem(idx, { pricePerBox: parseFloat(e.target.value) || 0 })} className="text-right h-10 border-0 bg-transparent focus:bg-white font-bold" />
                        </td>
                        <td className="px-6 py-4 text-right font-black text-[#1B2A4A]">{formatARS(it.subtotal)}</td>
                        <td><Button size="icon" variant="ghost" className="text-red-300 hover:text-red-500" onClick={() => setItems(items.filter((_, i) => i !== idx))}><X className="h-4 w-4" /></Button></td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-10 text-slate-400 italic">No hay productos cargados todavía. Hacé click en "Agregar Artículo".</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-[#1B2A4A] p-8 rounded-3xl text-white flex justify-between items-center shadow-2xl">
              <div className="flex gap-10">
                <div>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Flete Estimado</p>
                  <div className="relative mt-1">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20 font-black">$</span>
                    <Input type="number" value={shipping} onChange={e => setShipping(parseFloat(e.target.value) || 0)} className="bg-transparent border-0 text-2xl font-black p-0 focus:ring-0 pl-4 w-32 h-8" />
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10 self-center" />
                <div>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Subtotal Galón</p>
                  <p className="text-2xl font-black">{formatARS(totals.materials)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Presupuesto Total</p>
                <p className="text-6xl font-black text-blue-400 leading-none">{formatARS(totals.grand)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
); }
