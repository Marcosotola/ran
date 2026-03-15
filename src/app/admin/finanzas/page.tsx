'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Sale, Expense } from '@/lib/types';
import { formatARS, formatDate } from '@/lib/utils/calculations';
import { getAllQuotes } from '@/lib/firebase/quotes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Wallet, Plus, Loader2, Receipt } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuth } from '@/lib/firebase/auth-context';

const EXPENSE_CATEGORIES = ['proveedores', 'operativo', 'sueldos', 'impuestos', 'mantenimiento', 'marketing', 'otro'];

const StatCard = ({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: React.ElementType; color: string; sub?: string;
}) => (
  <div className="bg-card rounded-2xl border border-border p-5">
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="text-2xl font-black mb-0.5">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </div>
);

export default function FinanzasAdminPage() {
  const { ranUser } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expForm, setExpForm] = useState({ concept: '', amount: '', category: 'otro' });
  const [savingExp, setSavingExp] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [quotesData, salesSnap, expSnap] = await Promise.all([
          getAllQuotes('accepted'),
          getDocs(query(collection(db, 'sales'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'expenses'), orderBy('date', 'desc'))),
        ]);

        const dbSales = salesSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(d.data().createdAt),
        })) as Sale[];

        const salesFromQuotes: Sale[] = quotesData.map((q) => ({
          id: q.id!,
          quoteId: q.id!,
          clientId: q.clientId ?? '',
          clientName: q.clientName ?? '',
          items: q.items ?? [],
          totalAmount: q.grandTotal,
          createdAt: q.createdAt ?? new Date(),
          vendorId: q.assignedVendorId ?? 'none',
          paymentMethod: 'transferencia',
          status: 'paid',
        }));

        const expList = expSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          date: d.data().date?.toDate ? d.data().date.toDate() : new Date(d.data().date),
        })) as Expense[];

        setSales([...dbSales, ...salesFromQuotes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        setExpenses(expList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalIncome = sales.reduce((s, sale) => s + sale.totalAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const chartData = (() => {
    const months: Record<string, { month: string; ingresos: number; egresos: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
      months[key] = { month: label, ingresos: 0, egresos: 0 };
    }
    sales.forEach((s) => {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months[key]) months[key].ingresos += s.totalAmount;
    });
    expenses.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months[key]) months[key].egresos += e.amount;
    });
    return Object.values(months);
  })();

  const saveExpense = async () => {
    if (!expForm.concept || !expForm.amount) {
      toast.error('Completá concepto e importe');
      return;
    }
    setSavingExp(true);
    try {
      const amount = parseFloat(expForm.amount);
      const ref = await addDoc(collection(db, 'expenses'), {
        concept: expForm.concept,
        amount,
        category: expForm.category,
        date: serverTimestamp(),
        registeredBy: ranUser?.uid ?? 'unknown'
      });
      const newExp: Expense = {
        id: ref.id,
        concept: expForm.concept,
        amount,
        category: expForm.category as any,
        date: new Date(),
        registeredBy: ranUser?.uid ?? 'unknown'
      };
      setExpenses((prev) => [newExp, ...prev]);
      setExpForm({ concept: '', amount: '', category: 'otro' });
      setExpenseOpen(false);
      toast.success('Egreso registrado');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSavingExp(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-[#3B82C4]" /></div>;
  }

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Finanzas</h1>
          <p className="text-muted-foreground text-sm">Ingresos, egresos y balance</p>
        </div>
        <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Registrar egreso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Egreso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>Concepto</Label>
                <Input placeholder="Ej: Pago alquiler enero" value={expForm.concept} onChange={(e) => setExpForm((f) => ({ ...f, concept: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Importe (ARS)</Label>
                  <Input type="number" placeholder="50000" value={expForm.amount} onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))} min="0" />
                </div>
                <div className="space-y-1">
                  <Label>Categoría</Label>
                  <Select value={expForm.category} onValueChange={(v) => setExpForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full ran-gradient text-white border-0" onClick={saveExpense} disabled={savingExp}>
                {savingExp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Guardar egreso
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Ingresos totales" value={formatARS(totalIncome)} icon={TrendingUp} color="bg-green-500" sub={`${sales.length} registros`} />
        <StatCard label="Egresos totales" value={formatARS(totalExpenses)} icon={TrendingDown} color="bg-red-400" sub={`${expenses.length} registros`} />
        <StatCard
          label="Balance"
          value={formatARS(balance)}
          icon={Wallet}
          color={balance >= 0 ? 'bg-[#1B2A4A]' : 'bg-red-600'}
          sub={balance >= 0 ? 'Positivo ✓' : 'Negativo ⚠'}
        />
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-bold">Evolución mensual (últimos 6 meses)</h2>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => formatARS(Number(v))} contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Legend />
              <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#22c55e" fill="url(#incGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h2 className="font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Ventas recientes
          </h2>
          {sales.slice(0, 8).map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="font-semibold text-sm">{s.clientName}</p>
                <p className="text-xs text-muted-foreground">{formatDate(s.createdAt as any)}</p>
              </div>
              <span className="font-bold text-green-600">{formatARS(s.totalAmount)}</span>
            </div>
          ))}
          {sales.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin ventas registradas</p>}
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h2 className="font-bold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-red-400" />
            Egresos recientes
          </h2>
          {expenses.slice(0, 8).map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="font-semibold text-sm">{e.concept}</p>
                <p className="text-xs text-muted-foreground">{e.category} · {formatDate(e.date as any)}</p>
              </div>
              <span className="font-bold text-red-400">{formatARS(e.amount)}</span>
            </div>
          ))}
          {expenses.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin egresos registrados</p>}
        </div>
      </div>
    </div>
  );
}
