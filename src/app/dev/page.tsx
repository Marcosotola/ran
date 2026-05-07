'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DevRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/suscripcion');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 text-white font-mono text-sm">
      Redirigiendo al nuevo panel de suscripción...
    </div>
  );
}
