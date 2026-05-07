'use client';

import { useState, useEffect } from 'react';
import { getAppSettings, updateSubscription, initAppSettings, AppSettings } from '@/lib/firebase/settings';
import { formatARS, formatDate } from '@/lib/utils/calculations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  CreditCard,
  History,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Power,
  ShieldAlert,
  DollarSign,
  Save,
  Link2,
  CalendarClock,
  Info,
  ExternalLink,
  Zap,
  Sparkles,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SuscripcionAdminPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [planCreated, setPlanCreated] = useState(false);

  // Form fields
  const [tempAmount, setTempAmount] = useState<string>('');
  const [tempCheckout, setTempCheckout] = useState<string>('');
  const [tempManagement, setTempManagement] = useState<string>('');

  const hasChanges =
    settings !== null &&
    (
      tempAmount !== settings.subscription.amount.toString() ||
      tempCheckout !== (settings.subscription.checkoutUrl || '') ||
      tempManagement !== (settings.subscription.managementUrl || '')
    );

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const s = await getAppSettings();
      setSettings(s);
      setTempAmount(s.subscription.amount.toString());
      setTempCheckout(s.subscription.checkoutUrl || '');
      setTempManagement(s.subscription.managementUrl || '');
    } catch {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus() {
    if (!settings) return;
    setUpdating(true);
    const newStatus = settings.subscription.status === 'active' ? 'paused' : 'active';
    try {
      await updateSubscription({ status: newStatus });
      setSettings({ ...settings, subscription: { ...settings.subscription, status: newStatus } });
      toast.success(`Suscripción ${newStatus === 'active' ? '✅ Activada' : '⏸ Pausada'}`);
    } catch {
      toast.error('Error al actualizar status');
    } finally {
      setUpdating(false);
    }
  }

  async function simulatePayment() {
    if (!settings) return;
    setUpdating(true);
    const last = new Date();
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    try {
      await updateSubscription({ status: 'active', lastPaymentDate: last, nextPaymentDate: next });
      setSettings({
        ...settings,
        subscription: { ...settings.subscription, status: 'active', lastPaymentDate: last, nextPaymentDate: next },
      });
      toast.success('✅ Pago simulado exitosamente');
    } catch {
      toast.error('Error al simular pago');
    } finally {
      setUpdating(false);
    }
  }

  async function saveAll() {
    if (!settings) return;
    const val = parseInt(tempAmount);
    if (isNaN(val) || val <= 0) {
      toast.error('⚠️ El monto debe ser un número mayor a 0');
      return;
    }
    setUpdating(true);
    try {
      await initAppSettings();
      await updateSubscription({ amount: val, checkoutUrl: tempCheckout, managementUrl: tempManagement });
      setSettings({
        ...settings,
        subscription: { ...settings.subscription, amount: val, checkoutUrl: tempCheckout, managementUrl: tempManagement },
      });
      setPlanCreated(false);
      toast.success('✅ Configuración guardada en Firestore');
    } catch (err) {
      console.error(err);
      toast.error('❌ Error al guardar. Verificá los permisos de Firestore.');
    } finally {
      setUpdating(false);
    }
  }

  async function createMPPlan() {
    const val = parseInt(tempAmount);
    if (isNaN(val) || val <= 0) {
      toast.error('⚠️ Ingresá el monto mensual antes de crear el plan');
      return;
    }

    setCreatingPlan(true);
    try {
      const res = await fetch('/api/subscription/create-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: val }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(`❌ Error de MP: ${data.error || 'No se pudo crear el plan'}`);
        return;
      }

      setTempCheckout(data.checkoutUrl);
      setTempManagement(data.managementUrl);
      setPlanCreated(true);

      toast.success('🎉 Plan creado en Mercado Pago. Guardá los cambios para aplicarlo.');
    } catch (err) {
      console.error(err);
      toast.error('❌ Error de red al crear el plan en MP');
    } finally {
      setCreatingPlan(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-[#3B82C4]" />
          <p className="text-muted-foreground text-sm">Cargando configuración de suscripción...</p>
        </div>
      </div>
    );
  }

  const isActive = settings?.subscription.status === 'active';
  const currentAmount = settings?.subscription.amount ?? 70000;

  return (
    <div className="p-6 md:p-10 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Suscripción</h1>
          <p className="text-slate-500 font-medium">Control de pagos y facturación del sistema RAN</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200"}>
            {isActive ? 'SERVICIO ACTIVO' : 'SERVICIO SUSPENDIDO'}
          </Badge>
          <Button variant="outline" size="sm" onClick={loadSettings} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Recargar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Principal: Estado y Configuración */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Status Card */}
          <Card className="border-none shadow-xl shadow-slate-200/60 overflow-hidden">
            <CardHeader className={`${isActive ? 'bg-emerald-500' : 'bg-rose-500'} text-white py-8`}>
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 bg-white/20 rounded-3xl backdrop-blur-md flex items-center justify-center ring-4 ring-white/10 shadow-inner">
                  {isActive ? <CheckCircle2 className="h-10 w-10" /> : <ShieldAlert className="h-10 w-10" />}
                </div>
                <div>
                  <CardDescription className="text-white/70 font-black uppercase tracking-widest text-[10px]">Estado del Sistema</CardDescription>
                  <CardTitle className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                    {isActive ? 'Operativo' : 'Suspendido'}
                  </CardTitle>
                  <div className="flex gap-4 mt-3">
                    <StatBox label="Monto" value={formatARS(currentAmount)} />
                    <StatBox label="Próximo Pago" value={settings?.subscription.nextPaymentDate ? formatDate(settings.subscription.nextPaymentDate) : 'Pendiente'} />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex flex-col md:flex-row gap-4">
              <Button
                onClick={toggleStatus}
                disabled={updating}
                variant="outline"
                className={`flex-1 h-14 rounded-2xl font-black text-sm gap-3 ${
                  isActive ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <Power className="h-5 w-5" />
                {isActive ? 'SUSPENDER SERVICIO' : 'REACTIVAR SERVICIO'}
              </Button>
              <Button
                onClick={simulatePayment}
                disabled={updating}
                className="flex-1 h-14 rounded-2xl bg-[#3B82C4] hover:bg-[#2D6BA3] text-white font-black text-sm gap-3 shadow-xl shadow-blue-500/20"
              >
                <Zap className="h-5 w-5" />
                SIMULAR PAGO (MP)
              </Button>
            </CardContent>
          </Card>

          {/* Configuración de Pago */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                <DollarSign className="h-5 w-5 text-[#3B82C4]" />
                Facturación y Plan Recurrente
              </CardTitle>
              <CardDescription>Configura los parámetros de cobro de Mercado Pago</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Paso 1 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">1</span>
                  <h4 className="font-bold text-slate-700">Monto Mensual</h4>
                </div>
                <div className="max-w-xs relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    value={tempAmount}
                    onChange={e => setTempAmount(e.target.value)}
                    className="h-14 pl-10 rounded-2xl border-slate-200 font-black text-lg focus:ring-2 focus:ring-[#3B82C4]"
                  />
                </div>
              </div>

              {/* Paso 2 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">2</span>
                  <h4 className="font-bold text-slate-700">Crear Plan en Mercado Pago</h4>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4">
                  <Info className="h-5 w-5 text-[#3B82C4] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#1B2A4A]/70 leading-relaxed">
                    Al crear el plan, se generará un link de suscripción automática. <strong>MP cobrará automáticamente cada mes</strong> y enviará una notificación al sistema para renovar el acceso.
                  </p>
                </div>
                <Button
                  onClick={createMPPlan}
                  disabled={creatingPlan || !tempAmount || parseInt(tempAmount) <= 0}
                  className="h-14 px-8 rounded-2xl font-black gap-2 bg-[#3B82C4] hover:bg-[#2D6BA3] text-white shadow-lg"
                >
                  {creatingPlan ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {planCreated ? 'PLAN CREADO - ¡GUARDAR CAMBIOS!' : 'CREAR PLAN RECURRENTE MP'}
                </Button>
              </div>

              {/* Paso 3 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">3</span>
                  <h4 className="font-bold text-slate-700">Links de Gestión</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Link de Pago</Label>
                    <Input value={tempCheckout} onChange={e => setTempCheckout(e.target.value)} placeholder="URL de Mercado Pago" className="h-12 rounded-xl border-slate-100 text-xs font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Link de Baja</Label>
                    <Input value={tempManagement} onChange={e => setTempManagement(e.target.value)} placeholder="URL de Gestión" className="h-12 rounded-xl border-slate-100 text-xs font-mono" />
                  </div>
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                <p className={`text-xs font-bold text-amber-600 flex items-center gap-2 ${hasChanges || planCreated ? 'opacity-100' : 'opacity-0'}`}>
                  <AlertTriangle className="h-4 w-4" />
                  Tienes cambios sin guardar en Firestore
                </p>
                <Button
                  onClick={saveAll}
                  disabled={updating || (!hasChanges && !planCreated)}
                  className="w-full md:w-auto h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black gap-2 shadow-xl shadow-emerald-500/20"
                >
                  {updating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  GUARDAR CONFIGURACIÓN
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra Lateral: Info y Webhooks */}
        <div className="space-y-6">
          <Card className="border-none shadow-md bg-slate-50">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-400">Ciclo Automático</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { icon: <CreditCard className="h-4 w-4" />, title: "Admin Paga", desc: "Se suscribe una vez en Mercado Pago." },
                { icon: <RefreshCw className="h-4 w-4" />, title: "Cobro Mensual", desc: "MP debita el monto automáticamente." },
                { icon: <ArrowRight className="h-4 w-4" />, title: "Notificación", desc: "El webhook avisa al sistema." },
                { icon: <CheckCircle2 className="h-4 w-4" />, title: "Renovación", desc: "Firestore suma +1 mes al acceso." },
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-8 w-8 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 text-[#3B82C4]">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-700">{step.title}</p>
                    <p className="text-[10px] text-slate-500 leading-tight">{step.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-amber-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Configurar Webhook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Copia esta URL y pégala en el panel de desarrolladores de Mercado Pago para automatizar los cobros:
              </p>
              <div className="bg-slate-100 p-3 rounded-xl font-mono text-[9px] text-slate-600 break-all border border-slate-200">
                /api/webhooks/mercadopago
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white/10 px-3 py-1 rounded-lg">
      <p className="text-[8px] uppercase font-black text-white/50 tracking-tighter">{label}</p>
      <p className="text-xs font-bold">{value}</p>
    </div>
  );
}
