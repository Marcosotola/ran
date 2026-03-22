'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/lib/firebase/auth-context';
import { useEffect, useState, useMemo } from 'react';
import { getExpenses, deleteExpense, createExpense, updateExpense } from '@/lib/firebase/expenses';
import { Expense, ExpenseCategory } from '@/lib/types';
import { formatARS, formatDate } from '@/lib/utils/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Loader2, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  X,
  Receipt,
  Edit2,
  TrendingDown,
  ChevronLeft,
  DollarSign,
  Tag
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

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['proveedores', 'operativo', 'sueldos', 'impuestos', 'mantenimiento', 'marketing', 'otro'];

export default function AdminExpensesPage() {
  const { ranUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const refreshExpenses = () => {
    getExpenses().then(setExpenses).finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshExpenses();
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.concept.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, categoryFilter]);

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <TrendingDown className="h-10 w-10 text-red-400" /> Registro de Egresos
              </h1>
              <p className="text-slate-500 font-medium italic">Control de gastos operativos y pagos</p>
            </div>
            
            <ExpenseModal onRefresh={refreshExpenses} />
          </div>

          <div className="bg-white rounded-3xl border border-border shadow-xl overflow-hidden">
            <div className="p-6 border-b border-border bg-slate-50/50 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input 
                  placeholder="Buscar egreso por concepto..." 
                  className="h-12 rounded-xl bg-white border-slate-200"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b">
                  <tr>
                    <th className="text-left px-8 py-4">Concepto</th>
                    <th className="text-left px-4 py-4">Categoría</th>
                    <th className="text-left px-4 py-4">Fecha</th>
                    <th className="text-right px-4 py-4">Monto</th>
                    <th className="text-right px-8 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={5} className="py-24 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-red-300" /></td></tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-32 text-center text-slate-400">
                        <TrendingDown className="h-16 w-16 mx-auto mb-4 opacity-10" />
                        <p className="text-lg font-medium">No hay egresos registrados</p>
                      </td>
                    </tr>
                  ) : filteredExpenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-base">{e.concept}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">ID: {e.id?.slice(-8)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 shadow-sm">
                            <Tag className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-black text-slate-600 uppercase tracking-tighter capitalize">
                            {e.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-5 font-medium text-slate-500">
                        <span className="text-xs font-bold text-slate-400 uppercase leading-none">{formatDate(e.date as any)}</span>
                      </td>
                      <td className="px-4 py-5 text-right">
                        <span className="text-2xl font-black text-red-500 tracking-tighter leading-none">{formatARS(e.amount)}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <ExpenseModal expense={e} onRefresh={refreshExpenses} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-14 w-14 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl"
                            onClick={async () => {
                              if (window.confirm('¿ELIMINAR este egreso de forma DEFINITIVA?')) {
                                try {
                                  await deleteExpense(e.id!);
                                  toast.success('Egreso eliminado');
                                  refreshExpenses();
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

function ExpenseModal({ expense, onRefresh }: { expense?: Expense, onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { ranUser } = useAuth();
  
  const [concept, setConcept] = useState(expense?.concept || '');
  const [amount, setAmount] = useState<string>(expense?.amount.toString() || '');
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category || 'otro');

  const handleSubmit = async () => {
    if (!concept || !amount) {
      toast.error('Concepto e importe son obligatorios');
      return;
    }
    setLoading(true);
    try {
      if (expense) {
        await updateExpense(expense.id, {
          concept,
          amount: parseFloat(amount),
          category
        });
        toast.success('Egreso actualizado');
      } else {
        await createExpense({
          concept,
          amount: parseFloat(amount),
          category,
          registeredBy: ranUser?.uid || 'unknown'
        });
        toast.success('Egreso registrado');
      }
      onRefresh();
      setOpen(false);
    } catch {
      toast.error('Error al guardar registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {expense ? (
          <Button variant="ghost" size="icon" className="h-14 w-14 text-slate-300 hover:text-[#3B82C4] hover:bg-blue-50 rounded-2xl">
            <Edit2 className="h-6 w-6" />
          </Button>
        ) : (
          <Button className="h-16 px-8 bg-red-500 hover:bg-red-600 text-white font-black rounded-3xl shadow-lg flex items-center gap-3 transition-all active:scale-95">
            <Plus className="h-6 w-6" /> REGISTRAR EGRESO
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2rem]">
        <div className="ran-gradient-red p-8 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl" onClick={() => setOpen(false)}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <DialogTitle className="text-2xl font-black">{expense ? 'Editar Egreso' : 'Nuevo Egreso'}</DialogTitle>
          </div>
          <Button 
            className="bg-white text-red-600 hover:bg-red-50 font-black h-12 px-8 rounded-xl shadow-xl transition-all active:scale-95"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
            {expense ? 'GUARDAR' : 'REGISTRAR'}
          </Button>
        </div>

        <div className="p-8 space-y-8 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-red-500 ml-1">Concepto del Gasto</Label>
              <Input 
                value={concept} 
                onChange={e => setConcept(e.target.value)} 
                placeholder="Ej: Pago de Alquiler, Sueldos, Proveedores..." 
                className="h-14 rounded-2xl bg-white border-slate-200 text-lg font-bold px-6 shadow-sm focus:ring-2 focus:ring-red-400 transition-all" 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-red-500 ml-1">Monto (ARS)</Label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl font-bold">$</span>
                <Input 
                  type="number" 
                  value={amount || ''} 
                  onFocus={(e) => e.target.select()}
                  onChange={e => setAmount(e.target.value)} 
                  placeholder="0.00" 
                  className="h-14 pl-10 rounded-2xl bg-white border-slate-200 text-xl font-black shadow-sm focus:ring-2 focus:ring-red-400 transition-all" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-red-500 ml-1">Categoría</Label>
              <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                <SelectTrigger className="h-14 rounded-2xl bg-white border-0 shadow-sm font-black text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-0 shadow-2xl">
                  {EXPENSE_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="capitalize py-3 font-bold">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
