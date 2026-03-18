'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { RANUser, UserRole } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/calculations';
import { Search, Users, Shield, Loader2 } from 'lucide-react';

const ROLES: UserRole[] = ['cliente', 'vendedor', 'secretaria', 'contenido', 'finanzas', 'admin'];

const ROLE_COLORS: Record<UserRole, string> = {
  cliente: 'bg-gray-100 text-gray-700',
  vendedor: 'bg-blue-100 text-blue-700',
  secretaria: 'bg-pink-100 text-pink-700',
  contenido: 'bg-amber-100 text-amber-700',
  finanzas: 'bg-green-100 text-green-700',
  admin: 'bg-purple-100 text-purple-700',
  dev: 'bg-slate-100 text-slate-700',
};

const ROLE_LABELS: Record<UserRole, string> = {
  cliente: 'Cliente',
  vendedor: 'Vendedor',
  secretaria: 'Secretaria',
  contenido: 'Gestor de Catálogo',
  finanzas: 'Finanzas',
  admin: 'Admin',
  dev: 'Developer',
};

export default function UsuariosAdminPage() {
  const [users, setUsers] = useState<RANUser[]>([]);
  const [filtered, setFiltered] = useState<RANUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    getDocs(collection(db, 'users'))
      .then((snap) => {
        const data = snap.docs.map((d) => ({ uid: d.id, ...d.data() })) as RANUser[];
        setUsers(data);
        setFiltered(data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...users];
    if (roleFilter !== 'all') result = result.filter((u) => u.role === roleFilter);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s),
      );
    }
    setFiltered(result);
  }, [users, search, roleFilter]);

  const changeRole = async (uid: string, newRole: UserRole) => {
    setUpdatingId(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)));
      toast.success('Rol actualizado');
    } catch {
      toast.error('Error al actualizar el rol');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleActive = async (uid: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isActive: !current });
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, isActive: !current } : u)));
      toast.success(!current ? 'Usuario activado' : 'Usuario desactivado');
    } catch {
      toast.error('Error al actualizar usuario');
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black">Usuarios</h1>
        <p className="text-muted-foreground text-sm">{users.length} usuarios registrados</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Role summary chips */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => {
          const count = users.filter((u) => u.role === r).length;
          return (
            <button
              key={r}
              onClick={() => setRoleFilter(r === roleFilter ? 'all' : r)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                roleFilter === r ? 'ran-gradient text-white border-transparent' : 'border-border text-muted-foreground hover:border-foreground'
              }`}
            >
              {ROLE_LABELS[r]} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-ran-cerulean" />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Usuario</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Registrado</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Rol</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => (
                <tr key={user.uid} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold truncate max-w-36">{user.displayName ?? '—'}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-36">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {user.createdAt ? formatDate(user.createdAt as any) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {updatingId === user.uid ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(v) => changeRole(user.uid, v as UserRole)}
                        >
                          <SelectTrigger className="h-7 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r} className="text-xs">
                                {ROLE_LABELS[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(user.uid, user.isActive ?? true)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        user.isActive === false
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {user.isActive === false ? 'Inactivo' : 'Activo'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No se encontraron usuarios</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
