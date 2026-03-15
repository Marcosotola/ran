'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Database, Download, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { importCatalog } from '@/lib/firebase/seed-catalog';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function CatalogImportPage() {
  const [importing, setImporting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleImport = async () => {
    setImporting(true);
    try {
      const count = await importCatalog();
      setImportedCount(count);
      setCompleted(true);
      toast.success('¡Catálogo importado con éxito!');
    } catch (error) {
      console.error('Error importing catalog:', error);
      toast.error('Error al importar el catálogo');
    } finally {
      setImporting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black mb-2">Migración de Catálogo</h1>
          <p className="text-muted-foreground">Importá masivamente los productos de Cerámicas Lourdes a tu base de datos.</p>
        </div>

        <Card className="border-2 border-dashed border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-ran-cerulean" />
              Sincronización con Cerámicas Lourdes
            </CardTitle>
            <CardDescription>
              Esta herramienta poblará la base de datos con aproximadamente 95 SKUs verificados, incluyendo imágenes oficiales, dimensiones y acabados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>
                <strong>Nota Importante:</strong> Esta acción no duplicará productos existentes con el mismo nombre. Los precios se inicializarán con valores base que deberás ajustar desde el panel de productos.
              </p>
            </div>

            {!completed ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Button 
                  size="lg" 
                  className="ran-gradient text-white h-16 px-10 text-lg font-bold shadow-xl shadow-blue-500/20"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Comenzar Importación Masiva
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground italic">
                  Tiempo estimado: 15-30 segundos dependiendo de la conexión a Firebase.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold">¡Importación Completada!</h3>
                <p className="text-muted-foreground max-w-sm">
                  Se han procesado {importedCount} productos. Ahora podés verlos y editarlos en la sección de Productos.
                </p>
                <Button variant="outline" asChild>
                  <a href="/admin/productos">Ver Catálogo de Productos</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card">
            <h4 className="font-bold mb-2">Formator Incluidos</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 56x56 cm (Pisos)</li>
              <li>• 35x35 cm (Pisos)</li>
              <li>• 18x56 cm (Pisos Wood)</li>
              <li>• 31x53 cm (Piso & Pared)</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <h4 className="font-bold mb-2">Datos Sincronizados</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Imágenes en alta resolución</li>
              <li>• Acabados (Satinado, Brillante, etc.)</li>
              <li>• m² por caja calculados</li>
              <li>• Peso y piezas por caja</li>
            </ul>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
