'use client';

import { useAuth } from '@/lib/firebase/auth-context';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { updateUser } from '@/lib/firebase/users';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Bell, 
  BellOff, 
  Save, 
  Loader2, 
  Camera,
  Smartphone,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { updateProfile, updatePassword } from 'firebase/auth';
import { requestNotificationPermission } from '@/lib/firebase/messaging-utils';

export default function MiPerfilPage() {
  const { ranUser, user, logOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // States
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Sincronizar con ranUser
  useEffect(() => {
    if (ranUser) {
      setDisplayName(ranUser.displayName || '');
      setPhone(ranUser.phone || '');
      setEmail(ranUser.email || '');
      // Notificaciones desde Firestore: verificamos si hay algún token registrado
      setNotificationsEnabled(!!ranUser.fcmTokens?.length || !!ranUser.fcmToken);
    }
  }, [ranUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ranUser?.uid || !user) return;
    
    setSaving(true);
    try {
      // 1. Actualizar Firebase Auth si cambió el nombre
      if (displayName !== ranUser.displayName) {
        await updateProfile(user, { displayName });
      }

      // 2. Actualizar Firestore
      await updateUser(ranUser.uid, {
        displayName,
        phone,
      });

      // 3. Password si se cargó una nueva
      if (newPassword) {
        if (newPassword.length < 6) throw new Error('Password muy corta (min 6)');
        await updatePassword(user, newPassword);
        setNewPassword('');
      }

      toast.success('¡Perfil actualizado correctamente!');
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleNotifications = async (checked: boolean) => {
    if (!ranUser?.uid) return;
    
    if (checked) {
      setLoading(true);
      try {
        const token = await requestNotificationPermission(ranUser.uid, ranUser.fcmTokens);
        if (token) {
          setNotificationsEnabled(true);
          toast.success('¡Notificaciones activadas!');
        } else {
          setNotificationsEnabled(false);
          toast.error('No se pudo activar. Verificá los permisos del navegador.');
        }
      } catch (err) {
        toast.error('Error al solicitar permiso');
      } finally {
        setLoading(false);
      }
    } else {
      setNotificationsEnabled(false);
      await updateUser(ranUser.uid, { notificationsEnabled: false });
      toast.info('Notificaciones desactivadas para este navegador');
    }
  };

  if (!ranUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#3B82C4]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Seccion */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-8 rounded-[40px] border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-ran-navy/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl ran-gradient flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-blue-500/20">
              {displayName.charAt(0) || ranUser.email?.charAt(0) || 'U'}
            </div>
            <button className="absolute -bottom-2 -right-2 bg-white h-10 w-10 rounded-xl border shadow-lg flex items-center justify-center text-slate-400 hover:text-ran-navy transition-colors">
              <Camera className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{displayName || 'Usuario de RAN'}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 font-bold px-3">
                ROL: {ranUser.role?.toUpperCase()}
              </Badge>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Mail className="h-3.5 w-3.5" />
                {ranUser.email}
              </div>
            </div>
          </div>

          <Button variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50 gap-2 rounded-2xl" onClick={logOut}>
            <LogOut className="h-4 w-4" /> Salir
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[32px] border-slate-200 shadow-md">
              <CardHeader className="px-8 pt-8">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <User className="h-5 w-5 text-ran-navy" /> Datos de contacto
                </CardTitle>
                <CardDescription>Esta información es vital para que el equipo te contacte</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-[#3B82C4] ml-1">Nombre Completo</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input 
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        className="h-14 pl-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#3B82C4] transition-all font-medium" 
                        placeholder="Juan Pérez" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-[#3B82C4] ml-1">WhatsApp / Celular</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="h-14 pl-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#3B82C4] transition-all font-medium" 
                        placeholder="11 2345 5678" 
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic ml-1">* Usaremos este número para derivarte consultas de clientes.</p>
                  </div>

                  <div className="pt-6 border-t border-dashed">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-ran-navy ml-1">Cambiar Contraseña</Label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input 
                          type="password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="h-14 pl-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-ran-navy transition-all font-medium" 
                          placeholder="Nueva contraseña (dejar vacío si no quieres cambiarla)" 
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-16 ran-gradient text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                    GUARDAR CAMBIOS EN MI PERFIL
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Settings / App Status */}
          <div className="space-y-8">
            <Card className="rounded-[32px] border-slate-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-ran-navy" /> App & Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl gap-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm">Alertas del Negocio</p>
                    <p className="text-[10px] text-slate-500">Notificaciones Push en tiempo real</p>
                  </div>
                  <Switch 
                    checked={notificationsEnabled}
                    onCheckedChange={toggleNotifications}
                  />
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
                  <Bell className="h-6 w-6 text-[#3B82C4] shrink-0" />
                  <div>
                    <h5 className="font-black text-sm text-blue-900 mb-1">PWA Instalada</h5>
                    <p className="text-xs text-blue-800/70 leading-relaxed font-medium">
                      Instala RAN en tu pantalla de inicio para una experiencia nativa y recibir todas las alertas.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Mi Actividad</h6>
                  <Link href="/perfil/consultas" className="flex items-center justify-between group cursor-pointer">
                    <span className="text-sm font-bold text-slate-600 group-hover:text-ran-navy transition-colors">Mis Consultas</span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </Link>
                  <Link href="/perfil/presupuestos" className="flex items-center justify-between group cursor-pointer">
                    <span className="text-sm font-bold text-slate-600 group-hover:text-ran-navy transition-colors">Mis Presupuestos</span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="bg-slate-900 rounded-[32px] p-8 text-white text-center space-y-4 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-ran-gradient" />
              <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-8 w-8 text-blue-400" />
              </div>
              <h4 className="font-black text-xl">Seguridad RAN</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                Tus datos están protegidos bajo protocolos de encriptación de Firebase Admin. Ningún cliente externo puede ver tu número personal.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
