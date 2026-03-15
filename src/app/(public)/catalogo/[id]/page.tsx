'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProduct } from '@/lib/firebase/products';
import { Product } from '@/lib/types';
import { calcBoxes, formatARS } from '@/lib/utils/calculations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  MessageSquare,
  Box,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Ruler,
  Package,
  Info,
} from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [m2, setM2] = useState<string>('');
  const [calcResult, setCalcResult] = useState<{ boxes: number; subtotal: number } | null>(null);

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then((p) => {
        setProduct(p);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const val = parseFloat(m2);
    if (!product || isNaN(val) || val <= 0) {
      setCalcResult(null);
      return;
    }
    const boxes = calcBoxes(val, product.m2PerBox);
    setCalcResult({ boxes, subtotal: boxes * product.pricePerBox });
  }, [m2, product]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#3B82C4]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <Package className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-bold">Producto no encontrado</h2>
        <Button asChild variant="outline">
          <Link href="/catalogo">Volver al catálogo</Link>
        </Button>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];
  const prevImg = () => setActiveImg((i) => (i > 0 ? i - 1 : images.length - 1));
  const nextImg = () => setActiveImg((i) => (i < images.length - 1 ? i + 1 : 0));

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-[#1B2A4A]/5 border-b border-border py-3">
        <div className="container mx-auto px-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
          <span>/</span>
          <Link href="/catalogo" className="hover:text-foreground transition-colors">Catálogo</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-48">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Images */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted group">
              {images.length > 0 ? (
                <>
                  <Image
                    src={images[activeImg]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImg}
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImg}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#1B2A4A]/10 to-[#3B82C4]/10">
                  <Box className="h-24 w-24 text-muted-foreground/20" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === activeImg ? 'border-[#3B82C4]' : 'border-transparent hover:border-[#3B82C4]/40'
                    }`}
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className={product.category === 'pisos' ? 'bg-[#1B2A4A] text-white' : 'bg-[#3B82C4] text-white'}>
                  {product.category === 'pisos' ? 'Piso' : 'Pared'}
                </Badge>
                <Badge variant="outline">{product.finish}</Badge>
                {product.stock === 0 && <Badge variant="destructive">Sin stock</Badge>}
                {product.stock > 0 && product.stock < 10 && (
                  <Badge variant="destructive" className="bg-amber-500">Pocas cajas</Badge>
                )}
              </div>

              <h1 className="text-3xl font-black mb-2">{product.name}</h1>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            <Separator />

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-end gap-3">
                <span className="text-4xl font-black text-[#1B2A4A] dark:text-white">
                  {formatARS(product.pricePerM2)}
                </span>
                <span className="text-muted-foreground pb-1">/m²</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Precio por caja ({product.m2PerBox} m²):{' '}
                <strong className="text-foreground">{formatARS(product.pricePerBox)}</strong>
              </p>
            </div>

            <Separator />

            {/* Specs */}
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-[#3B82C4]" />
                Especificaciones técnicas
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Formato</dt>
                  <dd className="font-semibold">{product.size} cm</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Acabado</dt>
                  <dd className="font-semibold">{product.finish}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">m² por caja</dt>
                  <dd className="font-semibold">{product.m2PerBox} m²</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Piezas por caja</dt>
                  <dd className="font-semibold">{product.piecesPerBox} u.</dd>
                </div>
                {product.weight && (
                  <div>
                    <dt className="text-muted-foreground">Peso por caja</dt>
                    <dd className="font-semibold">{product.weight} kg</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Stock</dt>
                  <dd className="font-semibold">
                    {product.stock > 0 ? `${product.stock} cajas` : 'Sin stock'}
                  </dd>
                </div>
              </dl>
            </div>

            <Separator />

            {/* m² Calculator */}
            <div className="rounded-xl border border-[#3B82C4]/20 bg-[#3B82C4]/5 p-4 space-y-3">
              <h3 className="font-bold flex items-center gap-2 text-[#1B2A4A] dark:text-white">
                <Ruler className="h-4 w-4 text-[#3B82C4]" />
                Calculadora de m²
              </h3>
              <p className="text-xs text-muted-foreground">Ingresá la superficie a revestir (incluye 10% de desperdicio automáticamente)</p>
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="m2-input" className="text-xs">Superficie en m²</Label>
                  <Input
                    id="m2-input"
                    type="number"
                    placeholder="Ej: 12.5"
                    value={m2}
                    onChange={(e) => setM2(e.target.value)}
                    min="0"
                    step="0.5"
                    className="text-sm"
                  />
                </div>
              </div>
              {calcResult && (
                <div className="ran-gradient rounded-lg p-3 text-white space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-80">Cajas necesarias</span>
                    <strong>{calcResult.boxes} cajas</strong>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-80">Total estimado</span>
                    <strong>{formatARS(calcResult.subtotal)}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 ran-gradient text-white border-0 hover:opacity-90 h-12 font-semibold"
                asChild
              >
                <Link href={`/chat?producto=${product.id}`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Consultar con IA
                </Link>
              </Button>
              <Button variant="outline" className="flex-1 h-12" asChild>
                <Link href="/catalogo">Ver más productos</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
