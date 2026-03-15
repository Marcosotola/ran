'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { addProduct } from '@/lib/firebase/products';
import { ProductCategory, ProductFinish } from '@/lib/types';
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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, Plus } from 'lucide-react';
import Image from 'next/image';

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
  weight: string;
  sku: string;
}

const INITIAL: FormData = {
  name: '',
  description: '',
  category: 'pisos',
  size: '',
  finish: 'Brillante',
  pricePerM2: '',
  pricePerBox: '',
  m2PerBox: '',
  piecesPerBox: '',
  stock: '0',
  weight: '',
  sku: '',
};

const SIZES = ['35x35', '56x56', '18x56', '31x53', '20x50', '45x45', '60x60', '30x60'];
const FINISHES: ProductFinish[] = ['Brillante', 'Mate', 'Pulido', 'Rectificado', 'Natural', 'Otro'];

export default function SubirProductosPage() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const arr = Array.from(selected).slice(0, 5);
    setFiles((prev) => [...prev, ...arr].slice(0, 5));
    arr.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((p) => [...p, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeFile = (i: number) => {
    setFiles((f) => f.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const uploadImages = async (productId: string): Promise<string[]> => {
    const urls: string[] = [];
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
    setUploading(true);
    setUploadProgress(0);
    try {
      // Create product first to get ID for storage path
      const productId = await addProduct({
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
        weight: form.weight ? parseFloat(form.weight) : undefined,
        sku: form.sku || undefined,
        images: [],
        isActive: true,
      });

      // Upload images
      let imageUrls: string[] = [];
      if (files.length > 0) {
        imageUrls = await uploadImages(productId);
      }

      // Update product with image URLs
      if (imageUrls.length > 0) {
        const { updateProduct } = await import('@/lib/firebase/products');
        await updateProduct(productId, { images: imageUrls });
      }

      setSuccess(true);
      setForm(INITIAL);
      setFiles([]);
      setPreviews([]);
      toast.success('¡Producto cargado exitosamente!');
    } catch (err) {
      console.error(err);
      toast.error('Error al subir el producto. Intentá de nuevo.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setForm(INITIAL);
    setFiles([]);
    setPreviews([]);
  };

  if (success) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-96 gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-black">¡Producto cargado!</h2>
        <p className="text-muted-foreground">El producto está ahora disponible en el catálogo.</p>
        <div className="flex gap-3">
          <Button onClick={resetForm} className="ran-gradient text-white border-0">
            <Plus className="h-4 w-4 mr-2" />
            Agregar otro
          </Button>
          <Button variant="outline" asChild>
            <a href="/catalogo" target="_blank">Ver catálogo</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black">Subir Producto</h1>
        <p className="text-muted-foreground text-sm">Completá los datos para agregar un nuevo producto al catálogo</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="space-y-1">
              <Label htmlFor="weight">Peso por caja (kg)</Label>
              <Input id="weight" type="number" placeholder="18" value={form.weight} onChange={(e) => update('weight', e.target.value)} step="0.1" min="0" />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-bold">Imágenes (máx. 5)</h2>

          {/* Drop zone */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-[#3B82C4]/50 hover:bg-[#3B82C4]/5 transition-colors text-center"
          >
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Clic para seleccionar imágenes</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP · Máx. 5 archivos · 5MB cada uno</p>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            id="file-input"
          />

          {/* Preview grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                  <Image src={src} alt="" fill className="object-cover" sizes="80px" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {previews.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-[#3B82C4]/50 transition-colors"
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full ran-gradient transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Subiendo... {uploadProgress}%
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={uploading}
          className="w-full h-12 ran-gradient text-white border-0 hover:opacity-90 font-bold"
          id="btn-submit-product"
        >
          {uploading ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Subiendo producto...</>
          ) : (
            <><Upload className="h-4 w-4 mr-2" />Publicar producto</>
          )}
        </Button>
      </form>
    </div>
  );
}
