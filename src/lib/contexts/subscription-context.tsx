'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToSettings, AppSettings } from '@/lib/firebase/settings';
import { usePathname, useRouter } from 'next/navigation';
import { AlertTriangle, CreditCard, ChevronRight, LogOut, RefreshCw, Wrench } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import { formatARS } from '@/lib/utils/calculations';

interface SubscriptionContextType {
  settings: AppSettings | null;
  isActive: boolean;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  settings: null,
  isActive: true,
  isLoading: true,
});

export const useAppSubscription = () => useContext(SubscriptionContext);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = subscribeToSettings((newSettings) => {
      setSettings(newSettings);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isActive = settings?.subscription.status === 'active';

  // Rutas que siempre son accesibles sin importar el estado de la suscripción
  const isAlwaysAllowed =
    pathname.startsWith('/auth') ||   // Login / registro
    pathname.startsWith('/dev') ||    // Panel developer
    pathname.startsWith('/api');      // API routes (webhooks MP, etc.)

  return (
    <SubscriptionContext.Provider value={{ settings, isActive, isLoading }}>
      {isLoading ? (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !isActive && !isAlwaysAllowed ? (
        <SuspendedGate settings={settings}>{children}</SuspendedGate>
      ) : (
        <>{children}</>
      )}
    </SubscriptionContext.Provider>
  );
}

// ──────────────────────────────────────────────────────────────
// Decide qué pantalla mostrar según el rol del usuario logueado
// ──────────────────────────────────────────────────────────────
function SuspendedGate({ settings, children }: { settings: AppSettings | null; children: React.ReactNode }) {
  const { ranUser, loading: authLoading, logOut } = useAuth();

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Admin & Dev → pueden navegar normalmente, el banner rojo del SubscriptionBanner
  // es suficiente aviso. No bloqueamos para que puedan acceder a gestionar el sistema
  // y el pago desde Ajustes o el Panel Dev.
  if (ranUser?.role === 'admin' || ranUser?.role === 'dev') {
    return <>{children}</>;
  }

  // No logueado o rol sin privilegios (clientes, vendedores, etc.)
  // → pantalla genérica de mantenimiento sin información de pagos
  return <PublicMaintenanceScreen isLoggedIn={!!ranUser} onLogout={logOut} />;
}

// ──────────────────────────────────────────────────────────────
// Pantalla 1: Pública / Clientes — "Problemas técnicos"
// Sin ninguna mención de pagos ni montos
// ──────────────────────────────────────────────────────────────
function PublicMaintenanceScreen({ isLoggedIn, onLogout }: { isLoggedIn: boolean; onLogout: () => void }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-200/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-200/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="max-w-md w-full text-center space-y-8">
        {/* Icono */}
        <div className="flex justify-center">
          <div className="relative h-24 w-24">
            <div className="absolute inset-0 bg-amber-100 rounded-3xl rotate-6" />
            <div className="absolute inset-0 bg-amber-50 rounded-3xl flex items-center justify-center border-2 border-amber-100">
              <Wrench className="h-11 w-11 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500">
            Mantenimiento
          </p>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">
            Estamos trabajando
            <span className="text-amber-500"> en mejoras</span>
          </h1>
          <p className="text-slate-500 text-base leading-relaxed">
            El sitio se encuentra temporalmente fuera de servicio por tareas de mantenimiento.
            Disculpá las molestias — pronto volveremos con todo.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <p className="text-amber-700 text-sm font-medium">
            Trabajando para volver lo antes posible
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>

        {/* Acceso para staff — discreto */}
        <div className="pt-2 flex items-center justify-center gap-6">
          {!isLoggedIn ? (
            <button
              onClick={() => router.push('/auth/login')}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium"
            >
              Acceso de personal →
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium flex items-center gap-1.5"
            >
              <LogOut className="h-3 w-3" />
              Cerrar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Pantalla 2: Admin — Pago pendiente con monto y link real
// Solo visible para usuarios con rol 'admin'
// ──────────────────────────────────────────────────────────────
function AdminPaymentScreen({ settings, onLogout }: { settings: AppSettings | null; onLogout: () => void }) {
  const amount = settings?.subscription.amount ?? 70000;
  const checkoutUrl = settings?.subscription.checkoutUrl || 'https://www.mercadopago.com.ar';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3B82C4]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="max-w-xl w-full">
        <div className="bg-white rounded-[3rem] border-4 border-white shadow-2xl p-10 md:p-14 text-center space-y-8">
          <div className="h-24 w-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto ring-8 ring-white shadow-xl">
            <AlertTriangle className="h-12 w-12 text-red-600 animate-pulse" />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-500">
              Acceso Restringido
            </p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">
              Servicio <span className="text-red-600">Suspendido</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              El acceso a los paneles de gestión, catálogos e inteligencia artificial ha sido
              restringido temporalmente por falta de pago de la suscripción mensual.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Deuda Pendiente
              </span>
              <span className="text-3xl font-black text-slate-900">
                {formatARS(amount)}
              </span>
            </div>
            <Button
              className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-red-600/20 gap-3 group transition-all active:scale-95"
              asChild
            >
              <a href={checkoutUrl} target="_blank" rel="noreferrer">
                <CreditCard className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                PAGAR EN MERCADOPAGO
                <ChevronRight className="h-5 w-5" />
              </a>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-bold text-[#3B82C4] hover:underline"
            >
              Ya pagué, verificar
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <button
              onClick={onLogout}
              className="text-xs font-bold text-slate-400 hover:text-red-600 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar Sesión
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60">
          PANEL DE CONTROL • RAN PISOS & REVESTIMIENTOS
        </p>
      </div>
    </div>
  );
}


