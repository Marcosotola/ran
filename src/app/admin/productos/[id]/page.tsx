'use client';

import { useEffect, useState, use } from 'react';
import { getProduct } from '@/lib/firebase/products';
import { Product } from '@/lib/types';
import ProductForm from '@/components/admin/ProductForm';
import { Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditarProductoPage({ params }: PageProps) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3B82C4]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Package className="h-12 w-12 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-bold">Producto no encontrado</h2>
        <p className="text-muted-foreground text-sm">El producto que intentás editar no existe o fue eliminado.</p>
        <Button asChild variant="outline">
          <Link href="/admin/productos">Volver al listado</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <ProductForm initialData={product} />
    </div>
  );
}
