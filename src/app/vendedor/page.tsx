'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/lib/firebase/auth-context';
import { useEffect, useState } from 'react';
import { getQuotesByVendor, updateQuoteStatus } from '@/lib/firebase/quotes';
import { Quote } from '@/lib/types';
import { formatARS, formatDate, formatQuoteNumber } from '@/lib/utils/calculations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, Phone, Mail, CheckCircle2, Clock, Loader2, User, Receipt } from 'lucide-react';
import { convertQuoteToSale } from '@/lib/firebase/sales';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  viewed: 'bg-purple-100 text-purple-700',
  draft: 'bg-gray-100 text-gray-600',
  expired: 'bg-gray-100 text-gray-500',
  converted: 'bg-amber-100 text-amber-700',
};

const STATUS_LABELS: Record<string, string> = {
  sent: 'Pendiente',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  viewed: 'Visto',
  draft: 'Borrador',
  expired: 'Vencido',
  converted: 'Vendido',
};

export default function VendedorPage() {
  const { ranUser } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<any>('efectivo');

  useEffect(() => {
    if (!ranUser?.uid) return;
    getQuotesByVendor(ranUser.uid)
      .then(setQuotes)
      .finally(() => setLoading(false));
  }, [ranUser]);

  const pendingCount = quotes.filter((q) => q.status === 'sent').length;
  const totalValue = quotes
    .filter((q) => q.status === 'accepted' || q.status === 'converted')
    .reduce((s, q) => s + q.grandTotal, 0);

  const handleContact = (quote: Quote, method: 'email' | 'whatsapp') => {
    if (method === 'whatsapp' && quote.clientPhone) {
      const phone = quote.clientPhone.replace(/\D/g, '');
      const msg = encodeURIComponent(`Hola ${quote.clientName}! Soy ${ranUser?.displayName} de RAN Pisos & Revestimientos. Te contacto en relación a tu presupuesto N° ${formatQuoteNumber(quote.id ?? '')}.`);
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    } else if (method === 'email' && quote.clientEmail) {
      window.open(`mailto:${quote.clientEmail}?subject=Presupuesto RAN ${formatQuoteNumber(quote.id ?? '')}&body=Hola ${quote.clientName}!`, '_blank');
    }
  };

  const handleConvertToSale = async (quote: Quote) => {
    if (!quote.id) return;
    setConverting(quote.id);
    try {
      await convertQuoteToSale(quote, paymentMethod);
      toast.success('¡Presupuesto convertido a venta con éxito!');
      setQuotes((prev) =>
        prev.map((q) => (q.id === quote.id ? { ...q, status: 'converted' } : q))
      );
    } catch (err) {
      toast.error('Error al convertir presupuesto');
    } finally {
      setConverting(null);
    }
  };

  return (
    <RoleGuard allowedRoles={['vendedor', 'admin']}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <div className="bg-[#1B2A4A] py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl font-black text-white">Mi Panel de Ventas</h1>
            <p className="text-white/60 text-sm">Bienvenido, {ranUser?.displayName}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className="text-3xl font-black mb-1">{quotes.length}</div>
              <div className="text-xs text-muted-foreground">Presupuestos asignados</div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className="text-3xl font-black mb-1 text-amber-500">{pendingCount}</div>
              <div className="text-xs text-muted-foreground">Pendientes de contacto</div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className="text-2xl font-black mb-1 text-green-600">{formatARS(totalValue)}</div>
              <div className="text-xs text-muted-foreground">Ventas cerradas</div>
            </div>
          </div>

          {/* Quotes list */}
          <div>
            <h2 className="font-bold text-lg mb-4">Mis presupuestos asignados</h2>
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[#3B82C4]" />
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No tenés presupuestos asignados todavía</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {quotes.map((q) => (
                  <div key={q.id} className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">{formatQuoteNumber(q.id ?? '')}</span>
                          <Badge className={`text-xs ${STATUS_STYLES[q.status] ?? ''}`}>
                            {STATUS_LABELS[q.status] ?? q.status}
                          </Badge>
                        </div>
                        <p className="font-black text-lg">{q.clientName}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(q.createdAt as any)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl">{formatARS(q.grandTotal)}</p>
                        <p className="text-xs text-muted-foreground">{q.items?.length ?? 0} producto(s)</p>
                      </div>
                    </div>

                    {/* Products summary */}
                    {q.items && q.items.length > 0 && (
                      <div className="bg-muted rounded-xl p-3 space-y-1">
                        {q.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span>{item.name} · {item.boxes} cajas</span>
                            <span className="font-semibold">{formatARS(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {q.clientPhone && (
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs bg-green-500 hover:bg-green-600 text-white border-0"
                          onClick={() => handleContact(q, 'whatsapp')}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                      {q.clientEmail && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={() => handleContact(q, 'email')}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                      )}
                      
                      {q.status === 'accepted' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white border-0"
                            >
                              <Receipt className="h-3 w-3 mr-1" />
                              Convertir en Venta
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle>Confirmar Venta</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <p className="text-sm text-muted-foreground">
                                Se registrará la venta y se descontará el stock de los productos.
                              </p>
                              <div className="space-y-2">
                                <Label>Medodo de Pago</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="efectivo">Efectivo</SelectItem>
                                    <SelectItem value="transferencia">Transferencia</SelectItem>
                                    <SelectItem value="tarjeta_debito">Débito</SelectItem>
                                    <SelectItem value="tarjeta_credito">Crédito</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button 
                                className="w-full h-12 ran-gradient text-white border-0 font-bold"
                                onClick={() => handleConvertToSale(q)}
                                disabled={converting === q.id}
                              >
                                {converting === q.id ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                Finalizar Venta
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      {q.status === 'sent' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs ml-auto"
                          onClick={async () => {
                            await updateQuoteStatus(q.id!, 'accepted');
                            setQuotes((prev) => prev.map((x) => x.id === q.id ? { ...x, status: 'accepted' } : x));
                            toast.success('Presupuesto aceptado');
                          }}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Presupuesto Aceptado
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
