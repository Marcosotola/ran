'use client';

import { useAppSubscription } from '@/lib/contexts/subscription-context';
import { AlertTriangle, CreditCard, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function SubscriptionBanner() {
  const { isActive, settings } = useAppSubscription();

  if (isActive) return null;

  return (
    <div className="bg-red-600 text-white py-3 px-4 sticky top-0 z-[100] shadow-lg animate-pulse-subtle">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div className="text-sm">
            <p className="font-bold">Servicio suspendido por falta de pago</p>
            <p className="opacity-80 hidden sm:block">
              Por favor, regularice su suscripción mensual para normalizar el servicio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[10px] uppercase opacity-70 font-bold tracking-widest">Monto adeudado</p>
            <p className="text-lg font-black">$70.000,00</p>
          </div>

          <Link
            href="https://www.mercadopago.com.ar" // Generic link for now
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
