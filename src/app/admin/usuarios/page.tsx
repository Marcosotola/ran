'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
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
import { Search, Users, Shield, Loader2, Trash2, Edit, Save } from 'lucide-react';
import { updateUser, deleteUser } from '@/lib/firebase/users';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
  const [editingUser, setEditingUser] = useState<RANUser | null>(null);
  const [newDisplayName, setNewDisplayName] = useState('');

  const { ranUser, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !ranUser || ranUser.role !== 'admin') return;

    getDocs(collection(db, 'users'))
      .then((snap) => {
        const data = snap.docs.map((d) => ({ uid: d.id, ...d.data() })) as RANUser[];
        setUsers(data);
        setFiltered(data);
      })
      .finally(() => setLoading(false));
  }, [ranUser, authLoading]);

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
      await updateUser(uid, { isActive: !current });
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, isActive: !current } : u)));
      toast.success(!current ? 'Usuario activado' : 'Usuario desactivado');
    } catch {
      toast.error('Error al actualizar usuario');
    }
  };

  const handleDelete = async (uid: string) => {
    try {
      await deleteUser(uid);
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
      toast.success('Usuario eliminado');
    } catch {
      toast.error('Error al eliminar usuario');
    }
  };

  const handleEdit = (user: RANUser) => {
    setEditingUser(user);
    setNewDisplayName(user.displayName);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setUpdatingId(editingUser.uid);
    try {
      await updateUser(editingUser.uid, { displayName: newDisplayName });
      setUsers((prev) => prev.map((u) => (u.uid === editingUser.uid ? { ...u, displayName: newDisplayName } : u)));
      toast.success('Nombre actualizado');
      setEditingUser(null);
    } catch {
      toast.error('Error al guardar cambios');
    } finally {
      setUpdatingId(null);
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
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
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
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50" onClick={() => handleEdit(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará el registro de <strong>{user.displayName}</strong> ({user.email}). 
                              No se borrará la cuenta de autenticación de Firebase (debe hacerse desde la consola), 
                              pero ya no aparecerá en el sistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(user.uid)} className="bg-red-600 hover:bg-red-700 text-white">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Edit Dialog */}
          <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Usuario</DialogTitle>
                <DialogDescription>
                  Cambia la información del usuario. Email no es editable por seguridad.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre visible</Label>
                  <Input
                    id="name"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    value={editingUser?.email}
                    disabled
                    className="col-span-3 bg-muted"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancelar
                </Button>
                <Button onClick={saveEdit} disabled={updatingId === editingUser?.uid} className="ran-gradient text-white border-0">
                  {updatingId === editingUser?.uid ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar cambios
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
