'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getProducts } from '@/lib/firebase/products';
import { Product, ProductFinish } from '@/lib/types';
import { ProductCard } from '@/components/products/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription 
} from '@/components/ui/sheet';
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  Loader2, 
  Package, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, hasRole } from '@/lib/firebase/auth-context';

const CATEGORIES = [
  { value: 'pisos', label: 'Pisos' },
  { value: 'paredes', label: 'Revestimientos' },
  { value: 'ambos', label: 'Piso & Pared' },
];

const SIZES = ['35x35', '56x56', '18x56', '31x53', '60x60', '60x120'];

const FINISHES: ProductFinish[] = ['Brillante', 'Mate', 'Pulido', 'Rectificado', 'Natural', 'Otro'];

const SORTS = [
  { value: 'name', label: 'Nombre A–Z' },
];

const EXTENDED_SORTS = [
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
];

export default function CatalogoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { role } = useAuth();
  const canSeePrices = hasRole(role, ['vendedor', 'finanzas']);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  
  // Multi-select filters
  const [selectedCats, setSelectedCats] = useState<string[]>(
    searchParams.get('categoria')?.split(',').filter(Boolean) || []
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    searchParams.get('size')?.split(',').filter(Boolean) || []
  );
  const [selectedFinishes, setSelectedFinishes] = useState<string[]>(
    searchParams.get('finish')?.split(',').filter(Boolean) || []
  );
  const [sort, setSort] = useState(searchParams.get('sort') || 'name');

  useEffect(() => {
    setLoading(true);
    getProducts({ isActive: true })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Sync state with URL (Pushing changes to URL)
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedCats.length > 0) params.set('categoria', selectedCats.join(','));
    if (selectedSizes.length > 0) params.set('size', selectedSizes.join(','));
    if (selectedFinishes.length > 0) params.set('finish', selectedFinishes.join(','));
    if (sort !== 'name') params.set('sort', sort);

    const query = params.toString();
    const currentQuery = searchParams.toString();
    
    if (query !== currentQuery) {
      router.replace(`/catalogo${query ? `?${query}` : ''}`, { scroll: false });
    }
  }, [search, selectedCats, selectedSizes, selectedFinishes, sort, router, searchParams]);

  // Sync state with URL (Pulling changes from URL manually if needed)
  useEffect(() => {
    const searchParam = searchParams.get('search') || '';
    if (searchParam !== search) setSearch(searchParam);

    const catParam = searchParams.get('categoria')?.split(',').filter(Boolean) || [];
    if (JSON.stringify(catParam) !== JSON.stringify(selectedCats)) setSelectedCats(catParam);
    
    const sizeParam = searchParams.get('size')?.split(',').filter(Boolean) || [];
    if (JSON.stringify(sizeParam) !== JSON.stringify(selectedSizes)) setSelectedSizes(sizeParam);

    const finishParam = searchParams.get('finish')?.split(',').filter(Boolean) || [];
    if (JSON.stringify(finishParam) !== JSON.stringify(selectedFinishes)) setSelectedFinishes(finishParam);

    const sortParam = searchParams.get('sort') || 'name';
    if (sortParam !== sort) setSort(sortParam);
  }, [searchParams]); // Re-run when URL search params change


  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCats.length > 0) {
      result = result.filter((p) => selectedCats.includes(p.category));
    }
    if (selectedSizes.length > 0) {
      result = result.filter((p) => selectedSizes.includes(p.size));
    }
    if (selectedFinishes.length > 0) {
      result = result.filter((p) => selectedFinishes.includes(p.finish));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.size.includes(q),
      );
    }

    result.sort((a, b) => {
      if (sort === 'price-asc') return a.pricePerM2 - b.pricePerM2;
      if (sort === 'price-desc') return b.pricePerM2 - a.pricePerM2;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [products, selectedCats, selectedSizes, selectedFinishes, search, sort]);

  const toggleFilter = (list: string[], setList: (val: string[]) => void, value: string) => {
    if (list.includes(value)) {
      setList(list.filter(i => i !== value));
    } else {
      setList([...list, value]);
    }
  };

  const clearFilters = () => {
    setSelectedCats([]);
    setSelectedSizes([]);
    setSelectedFinishes([]);
    setSearch('');
    setSort('name');
    router.push('/catalogo');
  };

  const activeFiltersCount = selectedCats.length + selectedSizes.length + selectedFinishes.length + (search ? 1 : 0);

  const FilterSidebar = () => (
    <div className="space-y-8 animate-fade-in-up">
      {/* Category */}
      <section>
        <h3 className="text-sm font-black text-ran-navy uppercase tracking-wider mb-4 flex items-center gap-2">
          Categoría
        </h3>
        <div className="space-y-3">
          {CATEGORIES.map((c) => (
            <div key={c.value} className="flex items-center space-x-3 group cursor-pointer" onClick={() => toggleFilter(selectedCats, setSelectedCats, c.value)}>
              <Checkbox 
                id={`cat-${c.value}`} 
                checked={selectedCats.includes(c.value)}
                onCheckedChange={() => toggleFilter(selectedCats, setSelectedCats, c.value)}
                className="border-ran-slate/30 data-[state=checked]:bg-ran-cerulean flex items-center justify-center p-0"
              />
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer group-hover:text-ran-cerulean transition-colors">
                {c.label}
              </label>
            </div>
          ))}
        </div>
      </section>

      <Separator className="bg-border/50" />

      {/* Size */}
      <section>
        <h3 className="text-sm font-black text-ran-navy uppercase tracking-wider mb-4 flex items-center gap-2">
          Formatos (cm)
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggleFilter(selectedSizes, setSelectedSizes, s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                selectedSizes.includes(s)
                  ? 'bg-ran-slate text-white border-transparent shadow-md scale-105'
                  : 'border-border bg-white text-muted-foreground hover:border-ran-cerulean hover:text-ran-cerulean'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <Separator className="bg-border/50" />

      {/* Finish */}
      <section>
        <h3 className="text-sm font-black text-ran-navy uppercase tracking-wider mb-4 flex items-center gap-2">
          Acabado
        </h3>
        <div className="space-y-3">
          {FINISHES.map((f) => (
            <div key={f} className="flex items-center space-x-3 group cursor-pointer" onClick={() => toggleFilter(selectedFinishes, setSelectedFinishes, f)}>
              <Checkbox 
                id={`finish-${f}`} 
                checked={selectedFinishes.includes(f)}
                onCheckedChange={() => toggleFilter(selectedFinishes, setSelectedFinishes, f)}
                className="border-ran-slate/30 data-[state=checked]:bg-ran-cerulean flex items-center justify-center p-0"
              />
              <label className="text-sm font-medium leading-none cursor-pointer group-hover:text-ran-cerulean transition-colors">
                {f}
              </label>
            </div>
          ))}
        </div>
      </section>

      {activeFiltersCount > 0 && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearFilters} 
          className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl"
        >
          <X className="h-3 w-3 mr-2" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFB]">
      {/* Dynamic Header */}
      <div 
        className="relative py-20 overflow-hidden bg-ran-navy"
        style={{ 
          backgroundImage: 'url("/fondoCatalogo.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-ran-dark/60 backdrop-blur-[2px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl sm:text-6xl font-black text-white italic drop-shadow-2xl tracking-tight">
            Catálogo <span className="text-ran-cerulean">Completo</span>
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Desktop Sidebar (Left) */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 custom-scrollbar">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="h-5 w-5 text-ran-cerulean" />
                <h2 className="text-xl font-black text-ran-navy">Filtros</h2>
              </div>
              <FilterSidebar />
              <div className="h-10" /> {/* Bottom spacing for scroll */}
            </div>
          </aside>

          {/* Main Content (Right) */}
          <main className="flex-1 min-w-0">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar modelos, acabados o medidas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 rounded-2xl border-border bg-white shadow-sm focus:border-ran-cerulean transition-all text-sm font-medium"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Mobile Filter Trigger */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden h-12 rounded-2xl px-5 border-border bg-white font-bold flex gap-2 shrink-0">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filtros
                      {activeFiltersCount > 0 && (
                        <Badge className="bg-ran-cerulean text-white h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                    <SheetHeader className="mb-6">
                      <SheetTitle className="text-2xl font-black italic text-ran-navy">Filtros</SheetTitle>
                      <SheetDescription>Refiná tu búsqueda para encontrar el producto ideal.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 overflow-y-auto max-h-[calc(100vh-150px)] px-1">
                      <FilterSidebar />
                    </div>
                  </SheetContent>
                </Sheet>

                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-12 w-full sm:w-[190px] rounded-2xl border-border bg-white font-bold text-sm">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORTS.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="font-medium">{s.label}</SelectItem>
                    ))}
                    {canSeePrices && EXTENDED_SORTS.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="font-medium">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Bar */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 items-center">
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mr-2">Activos:</span>
                {selectedCats.map(c => (
                  <Badge key={c} variant="secondary" className="rounded-lg py-1 px-3 bg-ran-navy/5 text-ran-navy border-ran-navy/10 gap-2">
                    {CATEGORIES.find(cat => cat.value === c)?.label}
                    <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => toggleFilter(selectedCats, setSelectedCats, c)} />
                  </Badge>
                ))}
                {selectedSizes.map(s => (
                  <Badge key={s} variant="secondary" className="rounded-lg py-1 px-3 bg-ran-cerulean/5 text-ran-cerulean border-ran-cerulean/10 gap-2">
                    {s}
                    <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => toggleFilter(selectedSizes, setSelectedSizes, s)} />
                  </Badge>
                ))}
                {selectedFinishes.map(f => (
                  <Badge key={f} variant="secondary" className="rounded-lg py-1 px-3 bg-ran-gold/10 text-ran-gold border-ran-gold/20 gap-2">
                    {f}
                    <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => toggleFilter(selectedFinishes, setSelectedFinishes, f)} />
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground hover:text-ran-navy py-0 h-6 h-auto px-2">
                  Borrar todo
                </Button>
              </div>
            )}

            {/* Results Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-ran-cerulean" />
                <p className="text-muted-foreground font-medium animate-pulse">Consultando el catálogo...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed border-2 bg-muted/5">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-2xl font-black text-ran-navy mb-2 italic">Sin resultados</h3>
                <p className="text-muted-foreground mb-8 max-w-sm font-medium">
                  {search ? `No encontramos productos para "${search}".` : 'Probá combinando otros filtros para encontrar lo que buscás.'}
                </p>
                <Button variant="default" onClick={clearFilters} className="bg-ran-slate text-white border-0 font-bold px-8 rounded-xl h-12 shadow-lg">
                  Limpiar Filtros
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
            
            {!loading && filteredProducts.length > 0 && (
              <div className="mt-16 text-center border-t border-border/50 pt-12 pb-8">
                <p className="text-muted-foreground text-sm font-medium mb-4">¿No encontrás lo que buscás?</p>
                <Button variant="outline" className="border-ran-cerulean/30 text-ran-cerulean hover:bg-ran-cerulean/10 h-12 px-8 rounded-2xl font-bold" asChild>
                  <a href="/chat">Asesoramiento en línea <ChevronRight className="ml-2 h-4 w-4" /></a>
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
