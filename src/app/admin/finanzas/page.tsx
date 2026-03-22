'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/lib/firebase/auth-context';
import { useEffect, useState, useMemo } from 'react';
import { getSales } from '@/lib/firebase/sales';
import { getExpenses } from '@/lib/firebase/expenses';
import { getAllQuotes } from '@/lib/firebase/quotes';
import { Sale, Expense, Quote, ProductCategory } from '@/lib/types';
import { formatARS, formatDate } from '@/lib/utils/calculations';
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar,
  BarChart3,
  ShoppingCart,
  FileText,
  PieChart as PieChartIcon,
  ChevronDown,
  ArrowRight,
  Target
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

const COLORS = ['#1B2A4A', '#3B82C4', '#4ADE80', '#F87171', '#FB923C', '#A78BFA', '#F472B6'];

export default function AdminFinanzasGlobalPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date Filters
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    Promise.all([getSales(), getExpenses(), getAllQuotes()]).then(([s, e, q]) => {
      setSales(s);
      setExpenses(e);
      setQuotes(q);
    }).finally(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    const start = new Date(fromDate + 'T00:00:00');
    const end = new Date(toDate + 'T23:59:59');

    const fSales = sales.filter(s => {
      const d = new Date(s.createdAt);
      return d >= start && d <= end;
    });

    const fExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    const fQuotes = quotes.filter(q => {
      const d = new Date(q.createdAt);
      return d >= start && d <= end;
    });

    const totalIncome = fSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalOutcome = fExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Categorize expenses for Pie Chart
    const expenseCategories = fExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(expenseCategories).map(([name, value]) => ({ name, value }));

    // Time Series data (grouped by date)
    const timeData: Record<string, { date: string, ingresos: number, egresos: number }> = {};
    const daysCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Fill days
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      timeData[key] = { date: key, ingresos: 0, egresos: 0 };
    }

    fSales.forEach(s => {
      const key = new Date(s.createdAt).toISOString().split('T')[0];
      if (timeData[key]) timeData[key].ingresos += s.totalAmount;
    });
    fExpenses.forEach(e => {
      const key = new Date(e.date).toISOString().split('T')[0];
      if (timeData[key]) timeData[key].egresos += e.amount;
    });

    const seriesData = Object.values(timeData).sort((a,b) => a.date.localeCompare(b.date));

    // Conversion rate
    const converted = fQuotes.filter(q => q.status === 'converted' || q.status === 'accepted').length;
    const conversionRate = fQuotes.length > 0 ? (converted / fQuotes.length) * 100 : 0;

    return {
      totalIncome,
      totalOutcome,
      balance: totalIncome - totalOutcome,
      quotesCount: fQuotes.length,
      conversionRate,
      pieData,
      seriesData
    };
  }, [sales, expenses, quotes, fromDate, toDate]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-[#3B82C4]" /></div>;

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-40">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <BarChart3 className="h-10 w-10 text-[#3B82C4]" /> Finanzas & Reportes
              </h1>
              <p className="text-slate-500 font-medium italic">Análisis integral del rendimiento del negocio</p>
            </div>

            {/* Date Filters */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xl flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-[#3B82C4]">Desde</Label>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-10 rounded-xl border-slate-100 font-bold" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-[#3B82C4]">Hasta</Label>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-10 rounded-xl border-slate-100 font-bold" />
              </div>
            </div>
          </div>

          {/* Main Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="Ingresos por Ventas" 
              value={formatARS(filteredData.totalIncome)} 
              icon={TrendingUp} 
              color="bg-green-500" 
              sub="Facturación total"
            />
            <StatCard 
              label="Egresos Registrados" 
              value={formatARS(filteredData.totalOutcome)} 
              icon={TrendingDown} 
              color="bg-red-400" 
              sub="Gastos operativos"
            />
            <StatCard 
              label="Balance del Periodo" 
              value={formatARS(filteredData.balance)} 
              icon={Wallet} 
              color={filteredData.balance >= 0 ? "bg-[#1B2A4A]" : "bg-red-600"} 
              sub="Resultado neto"
            />
             <StatCard 
              label="Tasa de Conversión" 
              value={`${filteredData.conversionRate.toFixed(1)}%`} 
              icon={Target} 
              color="bg-[#3B82C4]" 
              sub={`${filteredData.quotesCount} presupuestos`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Area Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Evolución de Caja</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Ingresos vs Egresos Diario</p>
                </div>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredData.seriesData}>
                    <defs>
                      <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fontWeight: 700 }} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fontWeight: 700 }} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                      labelFormatter={(val) => `Día: ${val}`}
                      formatter={(v: any) => [formatARS(Number(v)), '']}
                    />
                    <Area type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={4} fillOpacity={1} fill="url(#colorInc)" />
                    <Area type="monotone" dataKey="egresos" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Expenses by Category */}
            <div className="bg-[#1B2A4A] p-8 rounded-[3rem] text-white shadow-2xl flex flex-col items-center justify-center text-center space-y-6">
              <div className="space-y-1">
                <PieChartIcon className="h-10 w-10 text-blue-400 mx-auto" />
                <h4 className="text-xl font-black">Distribución de Gastos</h4>
                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Inversión por Categoría</p>
              </div>
              
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredData.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {filteredData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', background: '#FFF', color: '#000' }}
                      formatter={(v: any) => formatARS(Number(v))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full text-left">
                {filteredData.pieData.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-[10px] font-black uppercase truncate max-w-20">{item.name}</span>
                    </div>
                    <p className="text-xs font-bold text-white/60">{formatARS(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </RoleGuard>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }: { 
  label: string; value: string; icon: any; color: string; sub: string 
}) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-4 hover:scale-[1.02] transition-all duration-300">
      <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">{value}</h3>
        <Badge variant="secondary" className="bg-slate-50 text-[10px] uppercase font-black px-2 py-0.5 rounded-lg border-slate-100">
          {sub}
        </Badge>
      </div>
    </div>
  );
}
