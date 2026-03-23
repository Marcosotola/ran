'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/lib/firebase/auth-context';
import { useEffect, useState, useMemo } from 'react';
import { getSales, deleteSale, createDirectSale, updateSale } from '@/lib/firebase/sales';
import { Sale, QuoteItem, PaymentMethod } from '@/lib/types';
import { formatARS, formatDate } from '@/lib/utils/calculations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Loader2, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  CheckCircle2, 
  X,
  User,
  DollarSign,
  Package,
  Receipt,
  Edit2
} from 'lucide-react';
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

export default function AdminSalesPage() {
  const { ranUser } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const refreshSales = () => {
    getSales().then(setSales).finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshSales();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter(s => 
      s.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      s.id?.toLowerCase().includes(search.toLowerCase())
    );
  }, [sales, search]);

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Receipt className="h-10 w-10 text-[#3B82C4]" /> Registro de Ventas
              </h1>
              <p className="text-slate-500 font-medium italic">Histórico de transacciones y cierres de caja</p>
            </div>
            
            <CreateSaleModal onRefresh={refreshSales} />
          </div>

          <div className="bg-white rounded-3xl border border-border shadow-xl overflow-hidden">
            <div className="p-6 border-b border-border bg-slate-50/50">
              <Input 
                placeholder="Buscar venta por cliente o ID..." 
                className="h-12 rounded-xl bg-white border-slate-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b">
                  <tr>
                    <th className="text-left px-8 py-4">Cliente</th>
                    <th className="text-left px-4 py-4">Vendedor</th>
                    <th className="text-left px-4 py-4">Productos y Cantidad</th>
                    <th className="text-left px-4 py-4">Pago / Fecha</th>
                    <th className="text-right px-4 py-4">Monto Total</th>
                    <th className="text-right px-8 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={5} className="py-24 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-[#3B82C4]" /></td></tr>
                  ) : filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-32 text-center text-slate-400">
                        <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-10" />
                        <p className="text-lg font-medium">No hay ventas registradas todavía</p>
                      </td>
                    </tr>
                  ) : filteredSales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-base">{s.clientName}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">ID: {s.id?.slice(-8)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#3B82C4] shadow-sm">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">
                            {s.vendorId?.length && s.vendorId?.length > 10 ? `User: ${s.vendorId.slice(0, 5)}` : (s.vendorId || 'S/D')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {s.items?.map((it, idx) => (
                            <div key={idx} className="bg-white border text-[10px] font-bold px-2.5 py-1 rounded-lg text-slate-500 shadow-sm flex items-center gap-2">
                              <span className="text-[#3B82C4] font-black">{it.boxes} cj.</span>
                              <span className="max-w-[120px] truncate">{it.name}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-5 font-medium text-slate-500">
                        <div className="flex flex-col">
                          <Badge variant="outline" className="w-fit bg-white font-black px-2 py-0.5 rounded-lg border-slate-200 uppercase text-[9px] mb-1">
                            {s.paymentMethod?.replace('_', ' ') || 'S/D'}
                          </Badge>
                          <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">{formatDate(s.createdAt as any)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-right">
                        <span className="text-2xl font-black text-[#1B2A4A] tracking-tighter leading-none">{formatARS(s.totalAmount)}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <EditSaleModal sale={s} onRefresh={refreshSales} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-14 w-14 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl"
                            onClick={async () => {
                              if (window.confirm('¿ELIMINAR este registro de venta de forma DEFINITIVA?')) {
                                try {
                                  await deleteSale(s.id!);
                                  toast.success('Venta eliminada');
                                  refreshSales();
                                } catch {
                                  toast.error('Error al borrar registro');
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-6 w-6" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}

function EditSaleModal({ sale, onRefresh }: { sale: Sale, onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [clientName, setClientName] = useState(sale.clientName);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(sale.paymentMethod);
  const [shipping, setShipping] = useState(sale.shipping || 0);
  const [items, setItems] = useState<QuoteItem[]>(sale.items || []);
  const [vendorId, setVendorId] = useState(sale.vendorId || '');

  const total = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.subtotal || 0), 0) + shipping;
  }, [items, shipping]);

  const handleAddItem = () => {
    setItems([...items, {
      productId: 'manual-' + Date.now(),
      name: 'Artículo Vendido',
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

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateSale(sale.id!, {
        clientName,
        paymentMethod,
        shipping,
        items,
        totalAmount: total,
        vendorId
      });
      toast.success('Venta actualizada correctamente');
      setOpen(false);
      onRefresh();
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-14 w-14 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl">
          <Edit2 className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed inset-0 z-50 w-screen h-[100dvh] max-w-none sm:max-w-none m-0 rounded-none p-0 overflow-y-auto border-0 translate-x-0 translate-y-0 flex flex-col bg-white">
        <div className="bg-white border-b p-4 sm:p-6 sticky top-0 z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full shrink-0">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <DialogTitle className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight italic truncate">
              Modificar Venta <span className="text-blue-400">#{sale.id?.slice(-5)}</span>
            </DialogTitle>
          </div>
          <Button 
            onClick={handleUpdate} 
            disabled={loading} 
            className="ran-gradient h-12 sm:h-14 w-full sm:w-auto px-6 sm:px-10 text-white font-black rounded-xl sm:rounded-2xl shadow-lg text-sm sm:text-base"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
            GUARDAR CAMBIOS
          </Button>
        </div>

        <div className="flex-1 p-10 bg-slate-50/50">
          <div className="max-w-5xl mx-auto pb-40 space-y-10">
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <Label className="text-[10px] uppercase font-black tracking-widest text-[#3B82C4] block mb-2">Vendedor</Label>
              <Input 
                value={vendorId} 
                onChange={e => setVendorId(e.target.value)} 
                className="h-14 rounded-xl text-lg font-bold bg-slate-50 border-0 focus:bg-white"
                placeholder="Nombre o ID del Vendedor"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <Label className="text-[10px] uppercase font-black tracking-widest text-[#3B82C4] block mb-2">Nombre del Cliente</Label>
                <Input value={clientName} onChange={e => setClientName(e.target.value)} className="h-14 rounded-xl text-lg font-bold" />
              </div>
              <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <Label className="text-[10px] uppercase font-black tracking-widest text-[#3B82C4] block mb-2">Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <SelectTrigger className="h-14 rounded-xl text-lg font-black bg-slate-50 border-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo 💵</SelectItem>
                    <SelectItem value="transferencia">Transferencia 🏛️</SelectItem>
                    <SelectItem value="tarjeta_debito">Tarjeta Débito 💳</SelectItem>
                    <SelectItem value="tarjeta_credito">Tarjeta Crédito 💳</SelectItem>
                    <SelectItem value="cheque">Cheque 📝</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-white rounded-[40px] border shadow-xl overflow-hidden">
              <div className="p-8 border-b bg-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-slate-400" />
                  <h4 className="font-black text-xl text-slate-800">Modificar Artículos y Cantidades</h4>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddItem} className="rounded-xl border-dashed border-2 text-[#3B82C4] border-[#3B82C4]/20 font-black">
                  <Plus className="h-4 w-4 mr-2" /> AGREGAR ARTÍCULO
                </Button>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="px-10 py-5 text-left">Detalle Producto</th>
                    <th className="px-5 py-5 text-center">Cajas</th>
                    <th className="px-5 py-5 text-right">Precio/Caja</th>
                    <th className="px-10 py-5 text-right">Subtotal</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-10 py-5">
                        <Input value={it.name} onChange={e => handleUpdateItem(idx, { name: e.target.value })} className="h-12 border-0 bg-transparent focus:bg-white font-black text-lg text-slate-800" />
                      </td>
                      <td className="px-5 py-5">
                        <Input 
                          type="number" 
                          value={it.boxes || ''} 
                          onFocus={(e) => e.target.select()}
                          onChange={e => handleUpdateItem(idx, { boxes: parseInt(e.target.value) || 0 })} 
                          className="h-12 border-0 bg-transparent focus:bg-white text-center font-black text-slate-800 text-xl transition-all" 
                        />
                      </td>
                      <td className="px-5 py-5">
                        <Input 
                          type="number" 
                          value={it.pricePerBox || ''} 
                          onFocus={(e) => e.target.select()}
                          onChange={e => handleUpdateItem(idx, { pricePerBox: parseFloat(e.target.value) || 0 })} 
                          className="h-12 border-0 bg-transparent focus:bg-white text-right font-bold text-slate-700 transition-all" 
                        />
                      </td>
                      <td className="px-10 py-5 text-right font-black text-2xl text-slate-900">{formatARS(it.subtotal)}</td>
                      <td className="px-6 py-5">
                        <Button size="icon" variant="ghost" className="text-red-300 hover:text-red-500" onClick={() => setItems(items.filter((_, i) => i !== idx))}><X className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="bg-[#1B2A4A] text-white p-6 sm:p-8 border-t-8 border-white/5 flex flex-col sm:flex-row justify-between items-center gap-8">
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 w-full sm:w-auto items-center sm:items-start text-center sm:text-left">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-white/30 tracking-widest leading-none">Costo de Flete</p>
                    <div className="flex items-center justify-center sm:justify-start">
                      <span className="text-white/20 font-black mr-1">$</span>
                      <Input 
                        type="number" 
                        value={shipping || ''} 
                        onFocus={(e) => e.target.select()}
                        onChange={e => setShipping(parseFloat(e.target.value) || 0)} 
                        className="bg-transparent border-0 h-10 p-0 text-2xl sm:text-3xl font-black text-blue-400 w-32 focus:ring-0 transition-all text-center sm:text-left" 
                      />
                    </div>
                  </div>
                  
                  <div className="hidden sm:block w-px h-12 bg-white/10 self-center" />
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-white/30 tracking-widest leading-none">Total Percibido</p>
                    <p className="text-3xl sm:text-5xl font-black text-white">{formatARS(total)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateSaleModal({ onRefresh }: { onRefresh: () => void }) {
  const { ranUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [clientName, setClientName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [shipping, setShipping] = useState(0);

  const total = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.subtotal || 0), 0) + shipping;
  }, [items, shipping]);

  const handleAddItem = () => {
    setItems([...items, {
      productId: 'manual-' + Date.now(),
      name: 'Artículo Vendido',
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

  const handleSave = async () => {
    if (!clientName || items.length === 0) {
      return toast.error('Completá cliente y al menos un producto');
    }
    setLoading(true);
    try {
      await createDirectSale({
        clientName,
        items,
        shipping,
        totalAmount: total,
        paymentMethod,
        vendorId: ranUser?.uid || 'manual',
        clientId: 'manual',
        status: 'paid'
      });
      toast.success('¡Venta registrada correctamente!');
      setOpen(false);
      onRefresh();
      // Reset
      setClientName('');
      setItems([]);
      setShipping(0);
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-16 px-8 bg-ran-slate hover:opacity-90 text-white font-black rounded-2xl shadow-lg flex items-center gap-3 transition-all active:scale-95 border-0">
          <Plus className="h-6 w-6 font-black" /> REGISTRAR VENTA
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed inset-0 z-50 w-screen h-[100dvh] max-w-none sm:max-w-none m-0 rounded-none p-0 overflow-y-auto border-0 translate-x-0 translate-y-0 flex flex-col bg-white">
        <div className="bg-white border-b p-4 sm:p-6 sticky top-0 z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full shrink-0">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <DialogTitle className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight truncate">Nueva Venta</DialogTitle>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={loading} 
            className="ran-gradient h-12 sm:h-14 w-full sm:w-auto px-6 sm:px-10 text-white font-black rounded-xl sm:rounded-2xl shadow-lg text-sm sm:text-base"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
            FINALIZAR VENTA
          </Button>
        </div>

        <div className="flex-1 p-10 bg-slate-50/50">
          <div className="max-w-5xl mx-auto pb-40 space-y-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-slate-400 mb-2">
                  <User className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Información del Cliente</span>
                </div>
                <Input 
                  placeholder="Nombre y Apellido del Cliente" 
                  value={clientName} 
                  onChange={e => setClientName(e.target.value)}
                  className="h-16 text-xl font-bold rounded-2xl bg-slate-50 border-0 focus:bg-white focus:ring-2 focus:ring-[#3B82C4]"
                />
              </div>

              <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-slate-400 mb-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Condición de Pago</span>
                </div>
                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <SelectTrigger className="h-16 text-xl font-black rounded-2xl bg-slate-50 border-0 focus:ring-2 focus:ring-[#3B82C4]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo 💵</SelectItem>
                    <SelectItem value="transferencia">Transferencia 🏛️</SelectItem>
                    <SelectItem value="tarjeta_debito">Tarjeta Débito 💳</SelectItem>
                    <SelectItem value="tarjeta_credito">Tarjeta Crédito 💳</SelectItem>
                    <SelectItem value="cheque">Cheque 📝</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-white rounded-[40px] border shadow-xl overflow-hidden">
              <div className="p-8 border-b bg-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-slate-400" />
                  <h4 className="font-black text-xl text-slate-800">Carga de Materiales</h4>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddItem} className="rounded-xl border-dashed border-2 text-[#3B82C4] border-[#3B82C4]/20 font-black">
                  <Plus className="h-4 w-4 mr-2" /> AGREGAR ARTÍCULO
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="px-10 py-5 text-left">Detalle Producto</th>
                      <th className="px-5 py-5 text-center">Metros (m²)</th>
                      <th className="px-5 py-5 text-center">Cajas</th>
                      <th className="px-5 py-5 text-right">Precio/Caja</th>
                      <th className="px-10 py-5 text-right">Subtotal</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-10 py-5">
                          <Input value={it.name} onChange={e => handleUpdateItem(idx, { name: e.target.value })} className="h-12 border-0 bg-transparent focus:bg-white font-black text-lg text-slate-800" />
                        </td>
                        <td className="px-5 py-5">
                          <Input 
                            type="number" 
                            value={it.m2 || ''} 
                            onFocus={(e) => e.target.select()}
                            onChange={e => handleUpdateItem(idx, { m2: parseFloat(e.target.value) || 0 })} 
                            className="h-12 border-0 bg-transparent focus:bg-white text-center font-bold text-slate-600 transition-all" 
                          />
                        </td>
                        <td className="px-5 py-5">
                          <Input 
                            type="number" 
                            value={it.boxes || ''} 
                            onFocus={(e) => e.target.select()}
                            onChange={e => handleUpdateItem(idx, { boxes: parseInt(e.target.value) || 0 })} 
                            className="h-12 border-0 bg-transparent focus:bg-white text-center font-black text-slate-800 text-xl transition-all" 
                          />
                        </td>
                        <td className="px-5 py-5">
                          <Input 
                            type="number" 
                            value={it.pricePerBox || ''} 
                            onFocus={(e) => e.target.select()}
                            onChange={e => handleUpdateItem(idx, { pricePerBox: parseFloat(e.target.value) || 0 })} 
                            className="h-12 border-0 bg-transparent focus:bg-white text-right font-bold text-slate-700 transition-all" 
                          />
                        </td>
                        <td className="px-10 py-5 text-right font-black text-2xl text-slate-900">{formatARS(it.subtotal)}</td>
                        <td className="px-6 py-5">
                          <Button size="icon" variant="ghost" className="text-red-300 hover:text-red-500" onClick={() => setItems(items.filter((_, i) => i !== idx))}><X className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-20 text-slate-400 italic font-medium text-lg">Hacé click en "Agregar Artículo" para empezar la carga de la venta.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#1B2A4A] text-white p-6 sm:p-12 rounded-[32px] sm:rounded-[50px] shadow-2xl flex flex-col sm:flex-row justify-between items-center border-4 border-white/5 gap-8">
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 w-full sm:w-auto items-center sm:items-start">
                <div className="space-y-2 text-center sm:text-left">
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Costo de Flete</p>
                  <div className="relative flex items-center justify-center sm:justify-start">
                    <span className="text-white/20 font-black text-xl">$</span>
                    <Input 
                      type="number" 
                      value={shipping || ''} 
                      onFocus={(e) => e.target.select()}
                      onChange={e => setShipping(parseFloat(e.target.value) || 0)} 
                      className="bg-transparent border-0 h-10 p-0 pl-2 text-2xl sm:text-3xl font-black text-blue-400 w-32 focus:ring-0 transition-all text-center sm:text-left" 
                    />
                  </div>
                </div>
                <div className="w-px h-16 bg-white/10 hidden sm:block self-center" />
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest leading-none">Subtotal Materiales</p>
                  <p className="text-2xl sm:text-3xl font-black text-white/90">{formatARS(total - shipping)}</p>
                </div>
              </div>
              <div className="text-center sm:text-right w-full sm:w-auto pt-6 sm:pt-0 border-t sm:border-0 border-white/10">
                <p className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] mb-2 sm:mb-4">Monto Final Cobrado</p>
                <p className="text-4xl sm:text-7xl md:text-8xl font-black leading-none tracking-tighter break-all">
                  {formatARS(total)}
                </p>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
