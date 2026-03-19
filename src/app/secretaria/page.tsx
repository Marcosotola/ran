'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search, FileText, Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getProducts } from '@/lib/firebase/products';
import { createDirectSale } from '@/lib/firebase/sales';
import { getAllQuotes } from '@/lib/firebase/quotes';
import { toast } from 'sonner';
import { Product, Quote } from '@/lib/types';
import { useAuth } from '@/lib/firebase/auth-context';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatARS, formatDate, formatQuoteNumber } from '@/lib/utils/calculations';

const STATUS_LABELS: Record<string, string> = {
  sent: 'Enviado', accepted: 'Aceptado', rejected: 'Rechazado',
  viewed: 'Visto', draft: 'Borrador', expired: 'Vencido',
  converted: 'Vendido',
};
const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700', accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700', viewed: 'bg-purple-100 text-purple-700',
  draft: 'bg-gray-100 text-gray-600', expired: 'bg-gray-100 text-gray-500',
  converted: 'bg-amber-100 text-amber-700',
};

export default function SecretariaPage() {
  const { ranUser } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filtered, setFiltered] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [savingSale, setSavingSale] = useState(false);

  // New sale form state
  const [newSale, setNewSale] = useState({
    clientName: '',
    paymentMethod: 'efectivo' as any,
    items: [{ productId: '', boxes: 1, pricePerBox: 0, name: '' }]
  });

  useEffect(() => {
    Promise.all([
      getAllQuotes(),
      getProducts({ isActive: true })
    ]).then(([q, p]) => {
      setQuotes(q);
      setFiltered(q);
      setProducts(p);
    }).finally(() => setLoading(false));
  }, []);

  const handleCreateSale = async () => {
    if (!newSale.clientName || newSale.items.some(i => !i.productId)) {
      toast.error('Completá los datos del cliente y productos');
      return;
    }
    setSavingSale(true);
    try {
      const saleItems = newSale.items.map(item => {
        const p = products.find(x => x.id === item.productId)!;
        return {
          productId: p.id,
          name: p.name,
          size: p.size,
          m2: item.boxes * p.m2PerBox,
          boxes: item.boxes,
          pricePerBox: p.pricePerBox,
          subtotal: item.boxes * p.pricePerBox
        };
      });

      const total = saleItems.reduce((s, i) => s + i.subtotal, 0);

      await createDirectSale({
        clientId: 'manual',
        clientName: newSale.clientName,
        vendorId: ranUser?.uid ?? 'none',
        items: saleItems,
        totalAmount: total,
        paymentMethod: newSale.paymentMethod,
        status: 'paid',
      });

      toast.success('Venta registrada y stock actualizado');
      setSaleDialogOpen(false);
      setNewSale({ clientName: '', paymentMethod: 'efectivo', items: [{ productId: '', boxes: 1, pricePerBox: 0, name: '' }] });
      
      const q = await getAllQuotes();
      setQuotes(q);
    } catch (err) {
      toast.error('Error al registrar venta');
    } finally {
      setSavingSale(false);
    }
  };

  useEffect(() => {
    if (!search) { setFiltered(quotes); return; }
    const s = search.toLowerCase();
    setFiltered(quotes.filter(q =>
      q.clientName?.toLowerCase().includes(s) ||
      q.clientEmail?.toLowerCase().includes(s) ||
      q.id?.includes(s)
    ));
  }, [quotes, search]);

  const totalAccepted = quotes.filter(q => q.status === 'accepted' || q.status === 'converted').reduce((s, q) => s + q.grandTotal, 0);

  return (
    <RoleGuard allowedRoles={['secretaria', 'admin']}>
      <div className="min-h-screen bg-background">
        <div className="bg-[#1B2A4A] py-8">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-white">Panel Secretaría</h1>
              <p className="text-white/60 text-sm">Registro de presupuestos y ventas</p>
            </div>
            
            <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="ran-gradient text-white border-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Venta Manual
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nueva Venta Directa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Nombre del Cliente</Label>
                    <Input 
                      placeholder="Ej: Juan Pérez" 
                      value={newSale.clientName}
                      onChange={e => setNewSale({...newSale, clientName: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Metodo de Pago</Label>
                    <Select 
                      value={newSale.paymentMethod} 
                      onValueChange={v => setNewSale({...newSale, paymentMethod: v as any})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="tarjeta_debito">Débito</SelectItem>
                        <SelectItem value="tarjeta_credito">Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label>Productos</Label>
                    {newSale.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Select 
                          value={item.productId}
                          onValueChange={v => {
                            const items = [...newSale.items];
                            items[idx].productId = v;
                            setNewSale({...newSale, items});
                          }}
                        >
                          <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name} ({p.stock} disp.)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input 
                          type="number" 
                          className="w-20" 
                          min="1" 
                          value={item.boxes}
                          onChange={e => {
                            const items = [...newSale.items];
                            items[idx].boxes = parseInt(e.target.value);
                            setNewSale({...newSale, items});
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full h-12 ran-gradient text-white border-0"
                    disabled={savingSale}
                    onClick={handleCreateSale}
                  >
                    {savingSale ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Receipt className="h-4 w-4 mr-2" />}
                    Confirmar Venta y Bajar Stock
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className="text-3xl font-black mb-1">{quotes.length}</div>
              <div className="text-xs text-muted-foreground">Total presupuestos</div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className="text-3xl font-black mb-1 text-green-600">
                {quotes.filter(q => q.status === 'accepted').length}
              </div>
              <div className="text-xs text-muted-foreground">Ventas cerradas</div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className="text-2xl font-black mb-1">{formatARS(totalAccepted)}</div>
              <div className="text-xs text-muted-foreground">Total vendido</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#3B82C4]" /></div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">N° Presupuesto</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Monto</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(q => (
                    <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{formatQuoteNumber(q.id ?? '')}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold truncate max-w-32">{q.clientName}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-32">{q.clientEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                        {q.createdAt ? formatDate(q.createdAt as any) : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold">{formatARS(q.grandTotal)}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${STATUS_STYLES[q.status] ?? ''}`}>{STATUS_LABELS[q.status] ?? q.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No se encontraron registros</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
