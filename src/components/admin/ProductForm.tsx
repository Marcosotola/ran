'use client';

import { useState, useRef, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth-context';
import { addProduct, updateProduct } from '@/lib/firebase/products';
import { ProductCategory, ProductFinish, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, Plus, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProductFormProps {
  initialData?: Product;
}

interface FormData {
  name: string;
  description: string;
  category: ProductCategory;
  size: string;
  finish: ProductFinish;
  pricePerM2: string;
  pricePerBox: string;
  m2PerBox: string;
  piecesPerBox: string;
  stock: string;
  stockPallets: string;
  weight: string;
  sku: string;
  m2PerPallet: string;
}

const SIZES = ['35x35', '56x56', '18x56', '31x53', '20x50', '45x45', '60x60', '30x60'];
const FINISHES: ProductFinish[] = ['Brillante', 'Mate', 'Pulido', 'Rectificado', 'Natural', 'Otro'];

export default function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isEdit = !!initialData;
  
  const [form, setForm] = useState<FormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'pisos',
    size: initialData?.size || '',
    finish: initialData?.finish || 'Brillante',
    pricePerM2: initialData?.pricePerM2?.toString() || '',
    pricePerBox: initialData?.pricePerBox?.toString() || '',
    m2PerBox: initialData?.m2PerBox?.toString() || '',
    piecesPerBox: initialData?.piecesPerBox?.toString() || '',
    stock: initialData?.stock?.toString() || '0',
    stockPallets: initialData?.stockPallets?.toString() || '0',
    weight: initialData?.weight?.toString() || '',
    sku: initialData?.sku || '',
    m2PerPallet: initialData?.m2PerPallet?.toString() || '',
  });

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(initialData?.images || []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const arr = Array.from(selected).slice(0, 5 - previews.length);
    setFiles((prev) => [...prev, ...arr]);
    
    arr.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((p) => [...p, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    // If it's an existing image, we just remove it from previews
    // If it's a new file, we remove it from files too
    const previewToRemove = previews[i];
    const isNewFile = previews[i].startsWith('data:');

    if (isNewFile) {
        // Find which file it matches (local image vs existing url)
        const fileIndex = previews.filter((p, idx) => idx < i && p.startsWith('data:')).length;
        setFiles(f => f.filter((_, idx) => idx !== fileIndex));
    }
    
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const uploadImages = async (productId: string): Promise<string[]> => {
    const urls: string[] = [];
    // Mantain existing ones that weren't removed
    const existingUrls = previews.filter(p => !p.startsWith('data:'));
    urls.push(...existingUrls);

    let done = 0;
    for (const file of files) {
      const storageRef = ref(storage, `products/${productId}/${Date.now()}_${file.name}`);
      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file);
        task.on(
          'state_changed',
          (snap) => {
            const progress = (done / files.length + snap.bytesTransferred / snap.totalBytes / files.length) * 100;
            setUploadProgress(Math.round(progress));
          },
          reject,
          async () => {
            urls.push(await getDownloadURL(task.snapshot.ref));
            done++;
            resolve();
          },
        );
      });
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.pricePerM2 || !form.size) {
      toast.error('Completá los campos obligatorios: nombre, tamaño y precio/m²');
      return;
    }
    if (!user) {
      toast.error('Debes estar autenticado para realizar esta acción');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      // Build object, omitting fields that are empty/undefined for Firestore compatibility
      const productData: any = {
        name: form.name,
        description: form.description,
        category: form.category,
        size: form.size,
        finish: form.finish,
        pricePerM2: parseFloat(form.pricePerM2),
        pricePerBox: parseFloat(form.pricePerBox || '0'),
        m2PerBox: parseFloat(form.m2PerBox || '1'),
        piecesPerBox: parseInt(form.piecesPerBox || '1'),
        stock: parseInt(form.stock || '0'),
        stockPallets: parseInt(form.stockPallets || '0'),
        images: previews.filter(p => !p.startsWith('data:')),
        isActive: initialData?.isActive ?? true,
        createdBy: initialData?.createdBy || user.uid,
      };

      if (form.weight) productData.weight = parseFloat(form.weight);
      if (form.sku) productData.sku = form.sku;
      if (form.m2PerPallet) productData.m2PerPallet = parseFloat(form.m2PerPallet);

      let productId = initialData?.id;

      if (isEdit && productId) {
        await updateProduct(productId, productData);
      } else {
        productId = await addProduct(productData);
      }

      // Upload new images if any
      if (files.length > 0) {
        const finalUrls = await uploadImages(productId);
        await updateProduct(productId, { images: finalUrls });
      } else if (isEdit) {
        // Ensure image list is updated even if no new uploads (removals)
        await updateProduct(productId, { images: productData.images });
      }

      setSuccess(true);
      toast.success(isEdit ? 'Producto actualizado' : 'Producto creado');
      
      if (isEdit) {
        setTimeout(() => router.push('/admin/productos'), 1500);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el producto.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (success && !isEdit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-black">¡Producto cargado!</h2>
        <p className="text-muted-foreground">El producto está ahora disponible en el catálogo.</p>
        <div className="flex gap-3">
          <Button onClick={() => setSuccess(false)} className="ran-gradient text-white border-0">
            <Plus className="h-4 w-4 mr-2" />
            Agregar otro
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/productos">Ir al listado</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/admin/productos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black">{isEdit ? 'Editar Producto' : 'Subir Producto'}</h1>
          <p className="text-muted-foreground text-sm">
            {isEdit ? `Modificando ${initialData.name}` : 'Completá los datos para agregar un nuevo producto'}
          </p>
        </div>
      </div>

      {/* Basic info */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-bold">Información básica</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="prod-name">Nombre *</Label>
              <Input id="prod-name" placeholder="Piso Gris Oxford 56x56" value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prod-sku">SKU / Código</Label>
              <Input id="prod-sku" placeholder="PGO-5656" value={form.sku} onChange={(e) => update('sku', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="prod-desc">Descripción</Label>
            <Textarea id="prod-desc" placeholder="Descripción del producto..." value={form.description} onChange={(e) => update('description', e.target.value)} rows={2} className="resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Categoría *</Label>
              <Select value={form.category} onValueChange={(v) => update('category', v as ProductCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pisos">Pisos</SelectItem>
                  <SelectItem value="paredes">Paredes</SelectItem>
                  <SelectItem value="ambos">Piso & Pared</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tamaño *</Label>
              <Select value={form.size} onValueChange={(v) => update('size', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => <SelectItem key={s} value={s}>{s} cm</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Acabado *</Label>
              <Select value={form.finish} onValueChange={(v) => update('finish', v as ProductFinish)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FINISHES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-bold">Precios y especificaciones</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="price-m2">Precio por m² * (ARS)</Label>
            <Input id="price-m2" type="number" placeholder="15000" value={form.pricePerM2} onChange={(e) => update('pricePerM2', e.target.value)} required min="0" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="price-box">Precio por caja (ARS)</Label>
            <Input id="price-box" type="number" placeholder="23400" value={form.pricePerBox} onChange={(e) => update('pricePerBox', e.target.value)} min="0" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="m2-box">m² por caja</Label>
            <Input id="m2-box" type="number" placeholder="1.56" value={form.m2PerBox} onChange={(e) => update('m2PerBox', e.target.value)} step="0.01" min="0" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pieces-box">Piezas por caja</Label>
            <Input id="pieces-box" type="number" placeholder="4" value={form.piecesPerBox} onChange={(e) => update('piecesPerBox', e.target.value)} min="1" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="stock">Stock (cajas)</Label>
            <Input id="stock" type="number" placeholder="0" value={form.stock} onChange={(e) => update('stock', e.target.value)} min="0" />
          </div>
          <div className="space-y-1 text-blue-600">
            <Label htmlFor="stockPallets">Stock (pallets)</Label>
            <Input id="stockPallets" type="number" placeholder="0" value={form.stockPallets} onChange={(e) => update('stockPallets', e.target.value)} min="0" className="border-blue-200 focus:ring-blue-500" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="weight">Peso por caja (kg)</Label>
            <Input id="weight" type="number" placeholder="18" value={form.weight} onChange={(e) => update('weight', e.target.value)} step="0.1" min="0" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="m2-pallet">m² por Pallet</Label>
            <Input id="m2-pallet" type="number" placeholder="75.84" value={form.m2PerPallet} onChange={(e) => update('m2PerPallet', e.target.value)} step="0.01" min="0" />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-bold">Imágenes (máx. 5)</h2>

        <button
          type="button"
          disabled={previews.length >= 5}
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-[#3B82C4]/50 hover:bg-[#3B82C4]/5 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ImageIcon className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">Clic para seleccionar imágenes</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP · Máx. {5 - previews.length} archivos más</p>
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {previews.length > 0 && (
          <div className="grid grid-cols-5 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden group border border-border">
                <Image src={src} alt="" fill className="object-cover" sizes="80px" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full ran-gradient transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {isEdit ? 'Actualizando' : 'Subiendo'}... {uploadProgress}%
          </p>
        </div>
      )}

      <Button
        type="submit"
        disabled={uploading}
        className="w-full h-12 ran-gradient text-white border-0 hover:opacity-90 font-bold"
      >
        {uploading ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</>
        ) : (
          <><Upload className="h-4 w-4 mr-2" />{isEdit ? 'Guardar Cambios' : 'Publicar Producto'}</>
        )}
      </Button>
    </form>
  );
}
