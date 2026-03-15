'use client';

import { useEffect, useState } from 'react';
import { getProducts, updateProduct, deleteProduct } from '@/lib/firebase/products';
import { Product } from '@/lib/types';
import { formatARS } from '@/lib/utils/calculations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Search,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Loader2,
  Box,
} from 'lucide-react';
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

export default function ProductosAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    getProducts({})
      .then((p) => {
        setProducts(p);
        setFiltered(p);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search) { setFiltered(products); return; }
    const s = search.toLowerCase();
    setFiltered(products.filter((p) => p.name.toLowerCase().includes(s) || p.size.includes(s)));
  }, [products, search]);

  const toggleActive = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      await updateProduct(id, { isActive: !current });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p)));
      toast.success(current ? 'Producto desactivado' : 'Producto activado');
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Producto eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Productos</h1>
          <p className="text-muted-foreground text-sm">{products.length} productos en el catálogo</p>
        </div>
        <Button className="ran-gradient text-white border-0 hover:opacity-90" asChild>
          <Link href="/admin/subir-productos">
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#3B82C4]" />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Producto</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Tamaño</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Precio/m²</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Stock</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        {product.images?.[0] ? (
                          <Image src={product.images[0]} alt="" width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <Box className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold truncate max-w-36">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{product.size} cm</td>
                  <td className="px-4 py-3 font-semibold hidden sm:table-cell">{formatARS(product.pricePerM2)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={product.stock === 0 ? 'text-red-500' : product.stock < 10 ? 'text-amber-500' : 'text-green-600'}>
                      {product.stock} cajas
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => toggleActive(product.id!, product.isActive)}
                        disabled={togglingId === product.id}
                        title={product.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {togglingId === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : product.isActive ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-[#3B82C4]" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente <strong>{product.name}</strong> del catálogo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 hover:bg-red-600 text-white"
                              onClick={() => handleDelete(product.id!)}
                            >
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
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
