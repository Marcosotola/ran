'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { formatARS } from '@/lib/utils/calculations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, Eye, Box } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const coverImage = product.images?.[0] || null;

  return (
    <Card className="group overflow-hidden ran-card-hover border-border bg-card hover:border-[#3B82C4]/40 transition-all">
      {/* Image */}
      <Link href={`/catalogo/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#1B2A4A]/10 to-[#3B82C4]/10">
              <Box className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          {/* Category badge */}
          <div className="absolute top-2 left-2">
            <Badge
              className={`text-xs font-semibold ${
                product.category === 'pisos'
                  ? 'bg-[#1B2A4A] text-white'
                  : 'bg-[#3B82C4] text-white'
              }`}
            >
              {product.category === 'pisos' ? 'Piso' : 'Pared'}
            </Badge>
          </div>
          {/* Low stock warning */}
          {product.stock < 10 && product.stock > 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className="text-xs">Pocas unidades</Badge>
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full">Sin stock</span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <Link href={`/catalogo/${product.id}`}>
            <h3 className="font-semibold text-sm leading-tight hover:text-[#3B82C4] transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">
            {product.size} cm • {product.finish}
          </p>
        </div>

        {/* Price */}
        <div>
          <p className="text-xl font-bold text-[#1B2A4A] dark:text-white">
            {formatARS(product.pricePerM2)}
            <span className="text-xs font-normal text-muted-foreground">/m²</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Caja ({product.m2PerBox} m²): {formatARS(product.pricePerBox)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button className="flex-1 ran-gradient text-white border-0 hover:opacity-90 h-8 text-xs" size="sm" asChild>
            <Link href={`/catalogo/${product.id}`}>
              <Eye className="h-3 w-3 mr-1" />
              Ver detalle
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-[#3B82C4]/30 hover:bg-[#3B82C4]/10 hover:border-[#3B82C4]"
            asChild
          >
            <Link href={`/chat?producto=${product.id}`} title="Consultar con IA">
              <MessageSquare className="h-3.5 w-3.5 text-[#3B82C4]" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
