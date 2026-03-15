'use client';

import { useAuth } from '@/lib/firebase/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';

const DEV_UID = process.env.NEXT_PUBLIC_DEV_UID;

export function DevGuard({ children }: { children: React.ReactNode }) {
  const { user, ranUser, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.uid !== DEV_UID) {
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F1A2E]">
        <Loader2 className="h-10 w-10 animate-spin text-[#3B82C4]" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0F1A2E] text-white p-4 text-center">
        <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <Lock className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-3xl font-black mb-2">Acceso Restringido</h1>
        <p className="text-white/60 max-w-md">
          Este panel es exclusivo para el desarrollador del sistema. Si crees que deberías tener acceso, contactá al soporte técnico.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-semibold"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
