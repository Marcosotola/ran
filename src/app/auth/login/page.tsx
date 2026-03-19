'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      // Smart redirect based on role if at root
      if (redirect === '/') {
        // Fetch role manually after login if result is void
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        const userSnap = await getDoc(doc(db, 'users', (await import('@/lib/firebase/config')).auth.currentUser?.uid || ''));
        const target = userSnap.data()?.role === 'admin' ? '/admin' : '/vendedor';
        window.location.href = target;
      } else {
        window.location.href = redirect;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      toast.error(msg.includes('invalid-credential') ? 'Email o contraseña incorrectos' : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push(redirect);
    } catch {
      toast.error('No se pudo iniciar sesión con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen ran-gradient-hero flex items-center justify-center p-4">
      {/* Background tiles pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
      
      <div className="relative w-full max-w-md space-y-2 animate-fade-in-up">
        {/* Logo */}
        <div className="text-center flex justify-center">
          <Link href="/">
            <img src="/logo2Blanco.svg" alt="RAN Logo" className="w-full max-w-[280px] h-auto drop-shadow-xl" />
          </Link>
        </div>

        <Card className="ran-glass p-8 space-y-6 border-white/15">
          <div>
            <h1 className="text-2xl font-bold text-white">Bienvenido de vuelta</h1>
            <p className="text-white/60 text-sm mt-1">Ingresá a tu cuenta para continuar</p>
          </div>

          {/* Google Sign-in */}
          <Button
            type="button"
            variant="outline"
            className="w-full bg-white text-gray-700 hover:bg-gray-50 border-white/20 h-11 font-medium"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            id="btn-google-login"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continuar con Google
          </Button>

          <div className="relative">
            <Separator className="bg-white/15" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1B2A4A] px-2 text-xs text-white/40">
              o con email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80 text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#3B82C4]"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80 text-sm">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#3B82C4]"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full ran-gradient text-white border-0 hover:opacity-90 h-11 font-semibold"
              disabled={loading || googleLoading}
              id="btn-email-login"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <p className="text-center text-sm text-white/50">
            ¿No tenés cuenta?{' '}
            <Link href="/auth/register" className="text-ran-cerulean hover:underline font-medium">
              Crea una cuenta gratis
            </Link>
          </p>
        </Card>

        <p className="text-center text-xs text-white/30">
          Al ingresar aceptás nuestros términos y condiciones de uso.
        </p>
      </div>
    </div>
  );
}
