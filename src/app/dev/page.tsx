'use client';

import { DevGuard } from '@/components/auth/DevGuard';
import { useState, useEffect } from 'react';
import { getAppSettings, updateSubscription, initAppSettings, AppSettings } from '@/lib/firebase/settings';
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

export default function DevPanelPage() {
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
      setPlanCreated(false); // Reset plan created indicator after manual save
      toast.success('✅ Configuración guardada en Firestore');
    } catch (err) {
      console.error(err);
      toast.error('❌ Error al guardar. Verificá los permisos de Firestore.');
    } finally {
      setUpdating(false);
    }
  }

  /**
   * Crea un plan de suscripción recurrente en Mercado Pago
   * y auto-completa los campos de checkoutUrl y managementUrl
   */
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
        console.error('MP Plan error:', data);
        toast.error(`❌ Error de MP: ${data.error || 'No se pudo crear el plan'}`);
        return;
      }

      // Auto-completar los campos con los URLs de MP
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

  // ── RENDER ──

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A1628]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-[#3B82C4]" />
          <p className="text-white/40 text-sm font-mono">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  const isActive = settings?.subscription.status === 'active';
  const currentAmount = settings?.subscription.amount ?? 70000;

  return (
    <DevGuard>
      <div className="min-h-[100dvh] bg-[#0A1628] text-white font-sans">

        {/* Top Bar */}
        <div className="border-b border-white/5 bg-white/[0.02] px-6 sm:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight">Panel Developer</h1>
              <p className="text-white/30 text-[10px] font-mono">SISTEMA DE CONTROL • RAN</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-mono px-3">
              v1.0.0-beta
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadSettings}
              className="text-white/40 hover:text-white h-8 px-3 gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Recargar</span>
            </Button>
          </div>
        </div>

        <div className="p-6 sm:p-10 space-y-8 max-w-6xl mx-auto">

          {/* ── ESTADO DE SUSCRIPCIÓN ── */}
          <section>
            <SectionTitle icon={<CreditCard className="h-4 w-4" />} label="Estado Actual de la Suscripción" />
            <div className={`rounded-2xl border p-6 flex flex-col sm:flex-row items-center gap-6 transition-all ${
              isActive ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
            }`}>
              {/* Indicador */}
              <div className={`h-20 w-20 shrink-0 rounded-full border-4 flex items-center justify-center ${
                isActive ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'
              }`}>
                {isActive
                  ? <CheckCircle2 className="h-9 w-9 text-green-400" />
                  : <ShieldAlert className="h-9 w-9 text-red-400" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <p className="text-[10px] uppercase tracking-widest font-black text-white/30">Estado actual</p>
                <h2 className={`text-3xl font-black tracking-tighter ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                  {isActive ? 'SERVICIO ACTIVO' : 'SERVICIO SUSPENDIDO'}
                </h2>
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                  <StatChip label="Monto mensual" value={formatARS(currentAmount)} icon={<DollarSign className="h-3 w-3" />} />
                  <StatChip
                    label="Último pago"
                    value={settings?.subscription.lastPaymentDate ? formatDate(settings.subscription.lastPaymentDate) : '—'}
                    icon={<History className="h-3 w-3" />}
                  />
                  <StatChip
                    label="Próximo vencimiento"
                    value={settings?.subscription.nextPaymentDate ? formatDate(settings.subscription.nextPaymentDate) : 'Pendiente'}
                    icon={<CalendarClock className="h-3 w-3" />}
                  />
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-col gap-2 min-w-[200px]">
                <Button
                  onClick={toggleStatus}
                  disabled={updating}
                  variant="outline"
                  className={`h-11 rounded-xl font-bold border text-sm gap-2 ${
                    isActive
                      ? 'border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent'
                      : 'border-green-500/30 text-green-400 hover:bg-green-500/10 bg-transparent'
                  }`}
                >
                  <Power className="h-4 w-4" />
                  {isActive ? 'Suspender Servicio' : 'Reactivar Servicio'}
                </Button>
                <Button
                  onClick={simulatePayment}
                  disabled={updating}
                  className="h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm gap-2 shadow-lg shadow-blue-600/20"
                >
                  <Zap className="h-4 w-4" />
                  Simular Pago (MP)
                </Button>
              </div>
            </div>
          </section>

          {/* ── FACTURACIÓN Y PLAN DE MP ── */}
          <section>
            <SectionTitle icon={<DollarSign className="h-4 w-4" />} label="Facturación y Plan Recurrente de Mercado Pago" />
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-6">

              {/* Paso 1: Monto */}
              <div className="space-y-4">
                <StepLabel number={1} label="Configurá el monto mensual" />
                <div className="max-w-xs">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-white/40 flex items-center gap-1.5 mb-2">
                    <DollarSign className="h-3 w-3" />
                    Monto Mensual (ARS)
                  </Label>
                  <Input
                    type="number"
                    value={tempAmount}
                    onChange={e => setTempAmount(e.target.value)}
                    className="bg-white/5 border-white/10 h-12 rounded-xl text-white text-base font-bold"
                    placeholder="70000"
                  />
                  <p className="text-[10px] text-white/25 px-1 mt-1">Sin puntos ni comas. Ej: 70000</p>
                </div>
              </div>

              {/* Paso 2: Crear plan en MP */}
              <div className="space-y-4">
                <StepLabel number={2} label="Creá el plan de suscripción en Mercado Pago" />

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-blue-300/80 leading-relaxed space-y-1">
                    <p>
                      El botón de abajo llama a la API de Mercado Pago y crea automáticamente un
                      <strong className="text-blue-300"> plan de suscripción recurrente</strong> con el monto configurado.
                    </p>
                    <p>
                      MP genera un link único que el admin usa una sola vez para suscribirse.
                      Después, <strong className="text-blue-300">MP cobra automáticamente cada mes</strong> y tu sistema se actualiza solo via webhook.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={createMPPlan}
                  disabled={creatingPlan || !tempAmount || parseInt(tempAmount) <= 0}
                  className="h-12 px-8 rounded-xl font-black gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-600/20 text-sm disabled:opacity-40"
                >
                  {creatingPlan ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Creando plan en MP...</>
                  ) : planCreated ? (
                    <><Check className="h-4 w-4" /> Plan creado — guardá los cambios</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Crear Plan Recurrente en MP</>
                  )}
                </Button>
              </div>

              {/* Paso 3: URLs (auto-completadas o manuales) */}
              <div className="space-y-4">
                <StepLabel number={3} label="Links de Mercado Pago (se completan automáticamente al crear el plan)" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-white/40 flex items-center gap-1.5">
                      <CreditCard className="h-3 w-3" />
                      URL de Pago / Suscripción
                    </Label>
                    <Input
                      value={tempCheckout}
                      onChange={e => setTempCheckout(e.target.value)}
                      placeholder="Se auto-completa al crear el plan en MP"
                      className="bg-white/5 border-white/10 h-12 rounded-xl text-white text-xs"
                    />
                    <p className="text-[10px] text-white/20 px-1">
                      El admin hace click aquí para suscribirse la primera vez
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-white/40 flex items-center gap-1.5">
                      <Link2 className="h-3 w-3" />
                      URL de Gestión (Baja / Cambios)
                    </Label>
                    <Input
                      value={tempManagement}
                      onChange={e => setTempManagement(e.target.value)}
                      placeholder="Se auto-completa al crear el plan en MP"
                      className="bg-white/5 border-white/10 h-12 rounded-xl text-white text-xs"
                    />
                    <p className="text-[10px] text-white/20 px-1">
                      El admin entra aquí para pausar o cancelar su suscripción
                    </p>
                  </div>
                </div>

                {/* Preview de URLs guardadas */}
                {(settings?.subscription.checkoutUrl || settings?.subscription.managementUrl) && (
                  <div className="border border-white/5 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/20">URLs actualmente en Firestore</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {settings?.subscription.checkoutUrl && (
                        <a href={settings.subscription.checkoutUrl} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 truncate">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{settings.subscription.checkoutUrl}</span>
                        </a>
                      )}
                      {settings?.subscription.managementUrl && (
                        <a href={settings.subscription.managementUrl} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 truncate">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{settings.subscription.managementUrl}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Guardar */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <p className={`text-xs font-bold transition-all ${hasChanges || planCreated ? 'text-amber-400 opacity-100' : 'opacity-0'}`}>
                  ⚠ Tenés cambios sin guardar
                </p>
                <Button
                  onClick={saveAll}
                  disabled={updating || (!hasChanges && !planCreated)}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 h-11 px-8 rounded-xl font-black gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {updating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  GUARDAR EN FIRESTORE
                </Button>
              </div>
            </div>
          </section>

          {/* ── FLUJO AUTOMÁTICO (INFOBOX) ── */}
          <section>
            <SectionTitle icon={<ArrowRight className="h-4 w-4" />} label="Cómo funciona el ciclo automático" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { emoji: '🔗', title: 'Admin se suscribe', desc: 'Hace click en "Pagar Suscripción" y se suscribe en MP con sus datos de pago' },
                { emoji: '🤖', title: 'MP cobra automático', desc: 'Cada mes MP debita el monto acordado sin que el admin tenga que hacer nada' },
                { emoji: '📡', title: 'Webhook notifica', desc: 'MP envía un aviso a /api/webhooks/mercadopago con el resultado del cobro' },
                { emoji: '✅', title: 'Sistema se actualiza', desc: 'Firestore se actualiza: status "active" y nextPaymentDate +1 mes automáticamente' },
              ].map((step, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-5 space-y-2">
                  <span className="text-2xl">{step.emoji}</span>
                  <p className="font-black text-sm text-white">{step.title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── RECORDATORIO WEBHOOK ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="font-black text-amber-500 text-sm">Configurar Webhook en MP</h3>
              </div>
              <p className="text-xs text-amber-500/70 leading-relaxed mb-3">
                Para que el sistema funcione automáticamente, tenés que configurar el webhook en el panel de MP.
              </p>
              <div className="bg-amber-500/10 rounded-lg p-3 font-mono text-[10px] text-amber-300 break-all">
                /api/webhooks/mercadopago
              </div>
              <p className="text-[10px] text-amber-500/50 mt-2">
                Eventos: <strong>payment</strong> y <strong>subscription_preapproval</strong>
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-blue-400" />
                <h3 className="font-black text-blue-400 text-sm">Cuando el admin da de baja</h3>
              </div>
              <p className="text-xs text-blue-400/70 leading-relaxed">
                El admin va a <strong className="text-blue-300">"Gestionar Suscripción"</strong> en MP (link managementUrl),
                cancela desde ahí y MP manda un webhook con status <code className="bg-blue-500/20 px-1 rounded">cancelled</code>.
                El sistema suspende el servicio automáticamente.
              </p>
            </div>
          </section>

        </div>
      </div>
    </DevGuard>
  );
}

// ── Componentes auxiliares ──

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-white/40">{icon}</div>
      <h2 className="text-xs font-black uppercase tracking-widest text-white/40">{label}</h2>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

function StatChip({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-white/60">
      <span className="text-white/30">{icon}</span>
      <span className="text-[10px] uppercase tracking-wide">{label}:</span>
      <span className="text-xs font-bold text-white/90">{value}</span>
    </div>
  );
}

function StepLabel({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
        <span className="text-[10px] font-black text-white/60">{number}</span>
      </div>
      <p className="text-sm font-bold text-white/70">{label}</p>
    </div>
  );
}
