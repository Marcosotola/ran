'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/lib/firebase/auth-context';
import { useEffect, useState, useMemo } from 'react';
import { getQuotesByVendor, updateQuote, updateQuoteStatus, deleteQuote } from '@/lib/firebase/quotes';
import { getAllUsers } from '@/lib/firebase/users';
import { Quote, QuoteStatus, PaymentMethod, QuoteItem, RANUser } from '@/lib/types';
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
  PackagePlus,
  Download
} from 'lucide-react';
import { convertQuoteToSale } from '@/lib/firebase/sales';
import { getAppSettings, AppSettings } from '@/lib/firebase/settings';
import { generateQuotePDF } from '@/lib/utils/pdf-generator';
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

export default function VendedorPage() {
  const { ranUser } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  const refreshQuotes = async () => {
    if (!ranUser?.uid) return;
    try {
      const q = await getQuotesByVendor(ranUser.uid);
      setQuotes(q);
      const s = await getAppSettings();
      setAppSettings(s);
    } catch {
      toast.error('Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ranUser]);

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
    if (!quotes.length) return { totalValue: 0, pendingCount: 0 };
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
    <RoleGuard allowedRoles={['vendedor']}>
      <div className="min-h-[100dvh] bg-[#F8FAFC]">
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Header & KPIs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Panel Vendedor</h1>
              <p className="text-slate-500 font-medium italic">Mis presupuestos y leads asignados</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="bg-white rounded-2xl border border-border p-4 shadow-sm min-w-[180px]">
                <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">En Seguimiento</span>
                <div className="text-2xl font-black text-[#3B82C4]">{stats.pendingCount}</div>
              </div>
              <div className="bg-white rounded-2xl border border-border p-4 shadow-sm min-w-[180px] border-l-4 border-l-green-500">
                <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Mis Ventas (Total)</span>
                <div className="text-2xl font-black text-green-600">{formatARS(stats.totalValue)}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-border shadow-xl overflow-hidden">
            {/* Toolbar */}
            <div className="p-6 border-b border-border bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Buscar presupuesto asignado..." 
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
                  <SelectItem value="all">Ver todos</SelectItem>
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
                  <p className="text-lg font-medium">No tenés presupuestos asignados todavía</p>
                </div>
              ) : (
                filteredQuotes.map((q) => (
                  <QuoteListItem 
                    key={q.id} 
                    quote={q} 
                    onContact={handleContact} 
                    onRefresh={refreshQuotes} 
                    vendorName={ranUser?.displayName || 'Vendedor'}
                    appSettings={appSettings}
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

function QuoteListItem({ quote, onContact, onRefresh, vendorName, appSettings }: { 
  quote: Quote, 
  onContact: (q: Quote, m: 'email' | 'whatsapp') => void, 
  onRefresh: () => void,
  vendorName: string,
  appSettings: AppSettings | null
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
        <div className="flex items-center gap-3">
          {quote.clientPhone && (
            <Button variant="ghost" className="!h-16 !w-16 p-0 relative text-green-500 hover:text-green-600 hover:bg-green-50 rounded-2xl shrink-0" onClick={() => onContact(quote, 'whatsapp')}>
              <MessageCircle className="h-10 w-10 fill-current opacity-20" />
              <MessageCircle className="h-10 w-10 absolute" />
            </Button>
          )}
          <QuoteDetailModal quote={quote} onRefresh={onRefresh} vendorName={vendorName} appSettings={appSettings} />
          <Button 
            variant="ghost" 
            className="!h-16 !w-16 p-0 relative text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl shrink-0"
            onClick={async () => {
              if (window.confirm('¿ELIMINAR este presupuesto?')) {
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
            <Trash2 className="h-10 w-10" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuoteDetailModal({ quote, onRefresh, vendorName, appSettings }: { quote: Quote, onRefresh: () => void, vendorName: string, appSettings: AppSettings | null }) {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);

  const [items, setItems] = useState<QuoteItem[]>(quote.items || []);
  const [shipping, setShipping] = useState<number>(quote.shipping || 0);
  const [notes, setNotes] = useState<string>(quote.notes || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [assignedVendorId, setAssignedVendorId] = useState<string>(quote.assignedVendorId || '');
  const [allVendors, setAllVendors] = useState<RANUser[]>([]);

  // Load items into state if changed or opened
  useEffect(() => {
    if (open) {
      setItems(quote.items || []);
      setShipping(quote.shipping || 0);
      setNotes(quote.notes || '');
      setAssignedVendorId(quote.assignedVendorId || '');
      setEditMode(false);

      // Fetch vendors
      getAllUsers().then(users => {
        setAllVendors(users.filter(u => u.role === 'vendedor' || u.role === 'admin' || u.role === 'dev'));
      });
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
      name: 'Nuevo Artículo',
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
        assignedVendorId: assignedVendorId || undefined
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
      toast.success(`Estado: ${STATUS_LABELS[status]}`);
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
      toast.success('¡Venta cerrada correctamente!');
      onRefresh();
      setOpen(false);
    } catch (err: any) {
      toast.error('Error al vender: ' + err.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-11 px-6 bg-[#3B82C4] hover:bg-[#2F689D] text-white font-black rounded-xl shadow-lg">
          <Eye className="h-4 w-4 mr-2" /> VER DETALLES
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed inset-0 z-50 w-screen h-[100dvh] max-w-none sm:max-w-none m-0 rounded-none p-0 overflow-y-auto border-0 translate-x-0 translate-y-0 flex flex-col bg-white">
        
        {/* Header - Light & Professional */}
        <div className="bg-white border-b border-slate-200 p-6 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full hover:bg-slate-100">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-black text-[10px] tracking-widest text-[#3B82C4] border-[#3B82C4]/30 uppercase">Cotización #{formatQuoteNumber(quote.id || '')}</Badge>
                <Badge className={`${STATUS_STYLES[quote.status]} border-0 font-bold`}>{STATUS_LABELS[quote.status]}</Badge>
              </div>
              <DialogTitle className="text-2xl font-black text-slate-900">{quote.clientName}</DialogTitle>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)} className="font-black text-slate-500 hover:text-slate-900 group">
              Cerrar <X className="h-5 w-5 ml-2 group-hover:rotate-90 transition-transform" />
            </Button>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Iniciado el</p>
              <p className="font-bold">{formatDate(quote.createdAt as any)}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-7xl mx-auto p-8 pb-40 space-y-10">
            
            {/* Contacts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-[#3B82C4] transition-colors col-span-1 md:col-span-1">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#3B82C4] group-hover:scale-110 transition-transform">
                  <User className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Vendedor</p>
                  {editMode ? (
                    <Select value={assignedVendorId} onValueChange={setAssignedVendorId}>
                      <SelectTrigger className="h-10 text-sm font-black rounded-xl bg-slate-50 border-transparent transition-all">
                        <SelectValue placeholder="Asignar" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                        <SelectItem value="none" className="font-bold">Sin asignar</SelectItem>
                        {allVendors.map(v => (
                          <SelectItem key={v.uid} value={v.uid} className="font-bold">
                            {v.displayName || v.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-black text-lg text-slate-800 italic">
                      {allVendors.find(v => v.uid === assignedVendorId)?.displayName || 'Sin asignar'}
                    </p>
                  )}
                </div>
              </div>
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
                <div className="flex gap-2">
                  {appSettings && (
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-2 font-black text-slate-600 border-slate-200 hover:bg-slate-50 gap-2"
                      onClick={() => generateQuotePDF(quote, appSettings)}
                    >
                      <Download className="h-4 w-4" /> DESCARGAR PDF
                    </Button>
                  )}
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
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
                    <tr>
                      <th className="px-8 py-4 text-left">Producto / Modelo</th>
                      <th className="px-5 py-4 text-center">Metros (m²)</th>
                      <th className="px-5 py-4 text-center">Cajas</th>
                      <th className="px-5 py-4 text-right">Precio/Caja</th>
                      <th className="px-8 py-4 text-right">Total Item</th>
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
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.size || 'N/A'}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-5 text-center">
                          {editMode ? (
                            <div className="relative w-24 mx-auto">
                              <Input 
                                type="number" 
                                className="text-center font-black h-10 rounded-xl pr-6 transition-all focus:ring-2 focus:ring-[#3B82C4]" 
                                value={item.m2 || ''} 
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => handleUpdateItem(idx, { m2: parseFloat(e.target.value) || 0 })} 
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">m²</span>
                            </div>
                          ) : <span className="font-bold text-slate-700 text-base">{item.m2} m²</span>}
                        </td>
                        <td className="px-5 py-5 text-center">
                          <div className="flex items-center justify-center gap-3">
                            {editMode && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200" onClick={() => handleUpdateItem(idx, { boxes: Math.max(0, item.boxes - 1) })}><Minus className="h-4 w-4 text-slate-600" /></Button>
                            )}
                            <span className="font-black text-slate-900 text-xl w-8 text-center">{item.boxes || 0}</span>
                            {editMode && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200" onClick={() => handleUpdateItem(idx, { boxes: (item.boxes || 0) + 1 })}><Plus className="h-4 w-4 text-slate-600" /></Button>
                            )}
                          </div>
                          {!editMode && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cajas</p>}
                        </td>
                        <td className="px-5 py-5 text-right">
                          {editMode ? (
                            <div className="relative w-36 ml-auto">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                              <Input 
                                type="number" 
                                className="pl-7 text-right font-black h-10 rounded-xl transition-all focus:ring-2 focus:ring-[#3B82C4]" 
                                value={item.pricePerBox || ''} 
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => handleUpdateItem(idx, { pricePerBox: parseFloat(e.target.value) || 0 })} 
                              />
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
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Logistics */}
              <div className="space-y-6">
                <h4 className="font-black text-2xl text-slate-900 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center text-white"><Truck className="h-5 w-5" /></div>
                  Puntos de Entrega y Envío
                </h4>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-lg space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Flete Sugerido ($)</Label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">$</span>
                      <Input 
                        type="number" 
                        className="pl-10 h-16 text-2xl font-black rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-[#3B82C4] transition-all" 
                        value={shipping || ''} 
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setShipping(parseFloat(e.target.value) || 0)} 
                        disabled={!editMode && quote.status !== 'sent'} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Notas del Vendedor</Label>
                    <Textarea 
                      className="min-h-[150px] rounded-[24px] bg-slate-50 border-transparent focus:bg-white focus:ring-[#3B82C4] p-5 text-base font-medium resize-none shadow-inner" 
                      placeholder="Agregá aclaraciones para el cliente o el equipo..." 
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
                    Historial del Chat / Requerimientos
                  </h4>
                  <div className="bg-slate-900 rounded-[32px] p-8 h-[400px] overflow-y-auto space-y-4 custom-scrollbar shadow-2xl relative">
                    {quote.aiConversationLog.map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.role === 'assistant' ? 'items-start' : 'items-end'}`}>
                        <div className="flex items-center gap-2 mb-1.5 px-2">
                          <span className={`text-[8px] uppercase font-black tracking-tighter ${m.role === 'assistant' ? 'text-purple-400' : 'text-blue-400'}`}>
                            {m.role === 'assistant' ? 'RANI (AI)' : 'CLIENTE'}
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
                <p className="text-white/40 uppercase font-black tracking-[0.3em] text-xs">Métricas de la Operación</p>
                <div className="flex flex-wrap gap-10 justify-center lg:justify-start">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-none mb-2 text-white">Inversión Materiales</p>
                    <p className="font-black text-3xl">{formatARS(totals.materials)}</p>
                  </div>
                  <div className="w-px h-12 bg-white/10 self-center hidden md:block" />
                  <div>
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-none mb-2 text-white">Logística de Entrega</p>
                    <p className="font-black text-3xl text-blue-400">+{formatARS(shipping)}</p>
                  </div>
                </div>
              </div>
              <div className="text-center lg:text-right">
                <p className="text-white/40 uppercase font-black tracking-[0.3em] text-[10px] mb-4 text-white">TOTAL FINAL ESTIMADO</p>
                <h2 className="text-7xl font-black text-white leading-none tracking-tighter">{formatARS(totals.grand)}</h2>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-slate-200">
              {editMode ? (
                <>
                  <Button className="flex-1 h-20 bg-green-600 hover:bg-green-700 text-white font-black text-2xl rounded-3xl shadow-2xl active:scale-95 transition-all" onClick={handleSave} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-3 h-8 w-8" /> : <CheckCircle2 className="mr-3 h-8 w-8" />}
                    GUARDAR Y ACTUALIZAR
                  </Button>
                  <Button variant="outline" className="h-20 px-10 border-4 border-slate-200 font-black text-xl rounded-3xl hover:bg-slate-100" onClick={() => { setItems(quote.items); setEditMode(false); }}>
                    CANCELAR
                  </Button>
                </>
              ) : quote.status === 'sent' ? (
                <>
                  <Button className="flex-1 h-20 bg-green-600 hover:bg-green-700 text-white font-black text-2xl rounded-3xl shadow-2xl active:scale-95 transition-all" onClick={() => setStatus('accepted')} disabled={loading}>
                    ACEPTAR COTIZACIÓN
                  </Button>
                  <Button variant="outline" className="h-20 px-10 border-4 border-red-100 text-red-500 font-black text-xl rounded-3xl hover:bg-red-50" onClick={() => setStatus('rejected')} disabled={loading}>
                    RECHAZARLA
                  </Button>
                </>
              ) : quote.status === 'accepted' ? (
                <div className="w-full bg-white p-10 rounded-[48px] border-2 border-slate-200 shadow-2xl">
                  <h5 className="font-black text-center mb-8 uppercase tracking-[0.4em] text-xs text-[#3B82C4]">Módulo de Cierre de Venta (Vendedor)</h5>
                  <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto items-end">
                    <div className="flex-1 w-full space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest text-[#3B82C4]">Forma de Pago Acordada</Label>
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
                      REGISTRAR VENTA
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full text-center py-6 bg-slate-100 rounded-3xl italic font-bold text-slate-500">
                  Esta operación ya fue convertida en venta.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
