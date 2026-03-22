'use client';

import { useAppSubscription } from '@/lib/contexts/subscription-context';
import { useAuth } from '@/lib/firebase/auth-context';
import { AlertTriangle, CreditCard, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatARS } from '@/lib/utils/calculations';

export function SubscriptionBanner() {
  const { isActive, settings } = useAppSubscription();
  const { ranUser } = useAuth();

  // Solo mostrar el banner si:
  // 1. El servicio NO está activo
  // 2. El usuario logueado es ADMIN (nadie más necesita verlo)
  // La pantalla de bloqueo completa (SuspendedGate) ya se encarga del resto de los roles
  if (isActive) return null;
  if (ranUser?.role !== 'admin') return null;

  const amount = settings?.subscription.amount ?? 70000;
  const checkoutUrl = settings?.subscription.checkoutUrl || 'https://www.mercadopago.com.ar';

  return (
    <div className="bg-red-600 text-white py-3 px-4 sticky top-0 z-[100] shadow-lg">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div className="text-sm">
            <p className="font-bold">Servicio suspendido por falta de pago</p>
            <p className="opacity-80 hidden sm:block">
              Por favor, regularice su suscripción mensual para normalizar el servicio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right hidden md:block">
            <p className="text-[10px] uppercase opacity-70 font-bold tracking-widest">Monto adeudado</p>
            <p className="text-lg font-black">{formatARS(amount)}</p>
          </div>
          <Link
            href={checkoutUrl}
            target="_blank"
            className="bg-white text-red-600 px-5 py-1.5 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-red-50 transition-colors shadow-sm"
          >
            <CreditCard className="h-4 w-4" />
            Pagar en MercadoPago
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
