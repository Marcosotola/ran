'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { formatARS } from '@/lib/utils/calculations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, Eye, Box } from 'lucide-react';
import { useAuth, hasRole } from '@/lib/firebase/auth-context';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { role } = useAuth();
  const canSeePrices = hasRole(role, ['vendedor', 'finanzas']);
  const coverImage = product.images?.[0] || null;

  return (
    <Card className="group overflow-hidden ran-card-hover border-border bg-card hover:border-ran-cerulean/40 transition-all">
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
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-ran-navy/10 to-ran-cerulean/10">
              <Box className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          {/* Category badge */}
          <div className="absolute top-2 left-2">
            <Badge
              className={`text-xs font-semibold ${
                product.category === 'pisos'
                  ? 'bg-ran-navy text-white'
                  : product.category === 'paredes'
                  ? 'bg-ran-cerulean text-white'
                  : 'bg-ran-gold text-ran-navy'
              }`}
            >
              {product.category === 'pisos' ? 'Piso' : product.category === 'paredes' ? 'Pared' : 'Piso & Pared'}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 space-y-4">
        <div>
          <Link href={`/catalogo/${product.id}`}>
            <h3 className="font-bold text-sm leading-tight hover:text-ran-cerulean transition-colors line-clamp-2 text-ran-navy">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {product.size} cm • {product.finish}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-1">
          {canSeePrices && (
            <div className="flex items-center justify-between text-[11px] font-bold border-b border-border/50 pb-2 mb-1">
              <span className="text-ran-navy">{formatARS(product.pricePerM2)}/m²</span>
              <span className={product.stock === 0 ? 'text-red-500' : product.stock < 10 ? 'text-amber-500' : 'text-green-600'}>
                Stock: {product.stock}
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <Button className="flex-[2] ran-gradient text-white border-0 hover:opacity-90 h-9 text-xs font-bold shadow-sm" size="sm" asChild>
              <Link href={`/catalogo/${product.id}`}>
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Ver
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9 border-ran-cerulean/30 hover:bg-ran-cerulean/10 hover:border-ran-cerulean text-ran-cerulean font-bold text-[10px]"
              asChild
            >
              <Link href={`/chat?producto=${product.id}`} title="Consultar con un asesor">
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Asesor
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
