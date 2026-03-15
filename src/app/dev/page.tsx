'use client';

import { DevGuard } from '@/components/auth/DevGuard';
import { useState, useEffect } from 'react';
import { getAppSettings, updateSubscription, AppSettings } from '@/lib/firebase/settings';
import { formatARS, formatDate } from '@/lib/utils/calculations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Wrench,
  CreditCard,
  History,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Power,
  ShieldAlert,
} from 'lucide-react';

export default function DevPanelPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const s = await getAppSettings();
      setSettings(s);
    } catch (err) {
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
      setSettings({
        ...settings,
        subscription: { ...settings.subscription, status: newStatus },
      });
      toast.success(`Suscripción ${newStatus === 'active' ? 'activada' : 'pausada'}`);
    } catch (err) {
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
      await updateSubscription({
        status: 'active',
        lastPaymentDate: last,
        nextPaymentDate: next,
      });
      setSettings({
        ...settings,
        subscription: {
          ...settings.subscription,
          status: 'active',
          lastPaymentDate: last,
          nextPaymentDate: next,
        },
      });
      toast.success('Pago simulado exitosamente');
    } catch (err) {
      toast.error('Error al simular pago');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F1A2E]">
        <RefreshCw className="h-10 w-10 animate-spin text-[#3B82C4]" />
      </div>
    );
  }

  return (
    <DevGuard>
      <div className="min-h-screen bg-[#0F1A2E] text-white p-6 sm:p-10 font-sans">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 ran-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Wrench className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Panel Developer</h1>
              <p className="text-white/50 text-sm">Control de suscripción y estado del sistema</p>
            </div>
          </div>
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-1">
            v1.0.0-beta
          </Badge>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Status Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-400" />
                Estado de la Suscripción
              </h2>

              <div className="flex flex-col sm:flex-row items-center gap-10">
                <div className="relative">
                  <div className={`h-32 w-32 rounded-full border-8 flex items-center justify-center ${
                    settings?.subscription.status === 'active' ? 'border-green-500/20' : 'border-red-500/20'
                  }`}>
                    {settings?.subscription.status === 'active' ? (
                      <CheckCircle2 className="h-12 w-12 text-green-500" />
                    ) : (
                      <ShieldAlert className="h-12 w-12 text-red-500" />
                    )}
                  </div>
                  <Badge className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 ${
                    settings?.subscription.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {settings?.subscription.status?.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">Monto mensual</p>
                      <p className="text-2xl font-black">{formatARS(settings?.subscription.amount ?? 70000)}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">Próximo cobro</p>
                      <p className="text-xl font-bold">
                        {settings?.subscription.nextPaymentDate ? formatDate(settings.subscription.nextPaymentDate) : 'Pendiente'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={toggleStatus}
                      disabled={updating}
                      className={`flex-1 h-12 rounded-2xl font-bold ${
                        settings?.subscription.status === 'active'
                          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
                          : 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20'
                      } border`}
                    >
                      <Power className="h-4 w-4 mr-2" />
                      {settings?.subscription.status === 'active' ? 'Suspender Servicio' : 'Activar Servicio'}
                    </Button>
                    <Button
                      onClick={simulatePayment}
                      disabled={updating}
                      className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
                      Simular Pago (MP)
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* System Config */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <History className="h-5 w-5 text-purple-400" />
                Herramientas del Sistema
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                    <div>
                <p className="font-bold">Modo Mantenimiento</p>
                      <p className="text-xs text-white/40">Bloquea el acceso público</p>
                    </div>
                    <div className="h-6 w-11 bg-white/10 rounded-full relative">
                      <div className="h-4 w-4 bg-white/20 rounded-full absolute left-1 top-1" />
                    </div>
                 </div>
                 <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                    <div>
                      <p className="font-bold">Notificaciones</p>
                      <p className="text-xs text-white/40">Estado de Firebase FCM</p>
                    </div>
                    <Badge className="bg-green-500 text-white">Activo</Badge>
                 </div>
              </div>
            </div>
          </div>

          {/* Logs / Stats */}
          <div className="space-y-8">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-amber-500">Recordatorio</h3>
              </div>
              <p className="text-sm text-amber-500/70 leading-relaxed">
                Si el status de la suscripción pasa a inactivas, el Admin de RAN verá un banner restrictivo y no podrá operar el sistema hasta regularizar el pago de $70.000.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <History className="h-4 w-4 text-white/40" />
                Últimos Eventos
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-xs">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                  <div>
                    <p className="font-semibold">Simulación de pago</p>
                    <p className="text-white/40">Hace 2 minutos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <div className="h-2 w-2 rounded-full bg-purple-500 mt-1.5" />
                  <div>
                    <p className="font-semibold">Acceso a panel dev</p>
                    <p className="text-white/40">Recién</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DevGuard>
  );
}
