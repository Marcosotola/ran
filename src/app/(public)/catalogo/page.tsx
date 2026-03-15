'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProducts } from '@/lib/firebase/products';
import { Product, ProductCategory, ProductFinish } from '@/lib/types';
import { ProductCard } from '@/components/products/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, SlidersHorizontal, Loader2, Package } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

const CATEGORIES = [
  { value: 'all', label: 'Todos' },
  { value: 'pisos', label: 'Pisos' },
  { value: 'paredes', label: 'Paredes' },
];

const SIZES = ['35x35', '56x56', '18x56', '31x53'];

const FINISHES: ProductFinish[] = ['Brillante', 'Mate', 'Pulido', 'Rectificado', 'Natural', 'Otro'];

const SORTS = [
  { value: 'name', label: 'Nombre A–Z' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
];

export default function CatalogoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>(searchParams.get('categoria') || 'all');
  const [size, setSize] = useState<string>(searchParams.get('size') || 'all');
  const [finish, setFinish] = useState<string>('all');
  const [sort, setSort] = useState('name');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    getProducts({ isActive: true })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const applyFilters = useCallback(() => {
    let result = [...products];

    if (category !== 'all') result = result.filter((p) => p.category === category);
    if (size !== 'all') result = result.filter((p) => p.size === size);
    if (finish !== 'all') result = result.filter((p) => p.finish === finish);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.size.includes(q),
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sort === 'price-asc') return a.pricePerM2 - b.pricePerM2;
      if (sort === 'price-desc') return b.pricePerM2 - a.pricePerM2;
      return a.name.localeCompare(b.name);
    });

    setFiltered(result);
  }, [products, category, size, finish, search, sort]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearFilters = () => {
    setCategory('all');
    setSize('all');
    setFinish('all');
    setSearch('');
    setSort('name');
    router.push('/catalogo');
  };

  const activeFiltersCount =
    (category !== 'all' ? 1 : 0) +
    (size !== 'all' ? 1 : 0) +
    (finish !== 'all' ? 1 : 0) +
    (search ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-[#1B2A4A] py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Catálogo de Productos</h1>
          <p className="text-white/60">
            {loading ? 'Cargando...' : `${products.length} productos disponibles`}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search bar + filter toggle */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, tamaño..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              id="search-products"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            className="shrink-0 flex items-center gap-2"
            onClick={() => setFiltersOpen(!filtersOpen)}
            id="btn-toggle-filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge className="ran-gradient text-white text-xs h-5 w-5 p-0 flex items-center justify-center">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px] hidden sm:flex shrink-0">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expandable Filters */}
        {filtersOpen && (
          <div className="mb-6 p-4 rounded-xl border border-border bg-card space-y-4 animate-fade-in-up">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Categoría</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        category === c.value
                          ? 'ran-gradient text-white border-transparent'
                          : 'border-border hover:border-[#3B82C4] hover:text-[#3B82C4]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Tamaño</p>
                <div className="flex flex-wrap gap-2">
                  {['all', ...SIZES].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        size === s
                          ? 'ran-gradient text-white border-transparent'
                          : 'border-border hover:border-[#3B82C4] hover:text-[#3B82C4]'
                      }`}
                    >
                      {s === 'all' ? 'Todos' : `${s} cm`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Finish */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Acabado</p>
                <div className="flex flex-wrap gap-2">
                  {['all', ...FINISHES].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFinish(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        finish === f
                          ? 'ran-gradient text-white border-transparent'
                          : 'border-border hover:border-[#3B82C4] hover:text-[#3B82C4]'
                      }`}
                    >
                      {f === 'all' ? 'Todos' : f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="h-3 w-3 mr-1" />
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Category pills (quick filter) */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                category === c.value
                  ? 'ran-gradient text-white border-transparent'
                  : 'border-border text-muted-foreground hover:border-[#3B82C4] hover:text-[#3B82C4]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-[#3B82C4]" />
              <p className="text-muted-foreground">Cargando productos...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">No encontramos productos</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {search ? `No hay resultados para "${search}"` : 'No hay productos con esos filtros'}
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Mostrando {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
