'use client';

import { useAuth, hasRole } from '@/lib/firebase/auth-context';
import { UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAppSubscription } from '@/lib/contexts/subscription-context';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const { ranUser, loading } = useAuth();
  const { isActive, isLoading: subLoading } = useAppSubscription();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !subLoading) {
      if (!ranUser) {
        router.push('/auth/login');
      } else if (!hasRole(ranUser.role, allowedRoles)) {
        if (redirectTo) router.push(redirectTo);
      }
    }
  }, [ranUser, loading, subLoading, allowedRoles, redirectTo, router]);

  if (loading || subLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#3B82C4]" />
          <p className="text-muted-foreground text-sm">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!ranUser) return null;

  // Enforce subscription for internal panels
  if (!isActive) {
    return (
      <div className="flex h-screen items-center justify-center p-8 bg-[#0F1A2E] text-white">
        <div className="text-center max-w-md space-y-6">
          <div className="mx-auto h-24 w-24 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black">Servicio Suspendido</h1>
            <p className="text-white/60">
              El acceso a los paneles de gestión ha sido restringido por falta de pago de la suscripción mensual.
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Costo de regularización</p>
            <p className="text-2xl font-black">$70.000,00</p>
          </div>
          <Button asChild className="w-full h-12 ran-gradient text-white border-0 font-bold">
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!hasRole(ranUser.role, allowedRoles)) {
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <div className="text-center max-w-md space-y-4">
          <div className="mx-auto h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p className="text-muted-foreground">
            No tenés permiso para acceder a esta sección. Comunicate con el administrador si creés que esto es un error.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="/">Volver al inicio</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/login">Cambiar cuenta</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
