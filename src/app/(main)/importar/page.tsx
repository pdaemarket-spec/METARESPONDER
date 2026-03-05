'use client';

import { createClient } from '@/shared/lib/supabase';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

interface Repuesto {
  marca: string;
  modelo: string;
  categoria: string;
  nombre_repuesto: string;
  precio: number;
  stock: number;
}

export default function ImportarPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Repuesto[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError('');
    setSuccess(0);

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();

    if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

      const repuestos: Repuesto[] = json.map((row) => ({
        marca: String(row.marca || row.Marca || row.MARCA || ''),
        modelo: String(row.modelo || row.Modelo || row.MODELO || ''),
        categoria: String(row.categoria || row.Categoria || row.CATEGORIA || ''),
        nombre_repuesto: String(row.nombre || row.nombre_repuesto || row.Nombre || row.producto || ''),
        precio: parseFloat(String(row.precio || row.Precio || row.PRECIO || 0)),
        stock: parseInt(String(row.stock || row.Stock || row.STOCK || 0)),
      })).filter(r => r.nombre_repuesto);

      setPreview(repuestos);
    } else {
      setError('Solo se aceptan archivos Excel (.xlsx, .xls) o CSV');
    }
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('Debes iniciar sesión');
      setLoading(false);
      return;
    }

    const itemsToInsert = preview.map(r => ({
      user_id: user.id,
      marca: r.marca,
      modelo: r.modelo,
      categoria: r.categoria,
      nombre_repuesto: r.nombre_repuesto,
      precio: r.precio,
      stock: r.stock,
    }));

    const { data, error: insertError } = await supabase
      .from('catalogo')
      .insert(itemsToInsert)
      .select();

    if (insertError) {
      setError('Error al importar: ' + insertError.message);
    } else {
      setSuccess(data?.length || preview.length);
      setPreview([]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Volver
              </button>
              <h1 className="text-xl font-bold text-blue-900">Importar Catálogo</h1>
            </div>
            <div className="flex items-center">
              <button onClick={handleLogout} className="text-sm text-red-600">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="text-lg font-semibold mb-4">Sube tu catálogo</h2>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">Formato esperado:</p>
            <p className="text-xs text-blue-600">
              Tu Excel/CSV debe tener estas columnas: marca, modelo, nombre (o producto), precio, stock
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
              ✓ ¡Importados {success} repuestos exitosamente!
            </div>
          )}

          {preview.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Vista previa ({preview.length} items)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Marca</th>
                      <th className="px-3 py-2 text-left">Modelo</th>
                      <th className="px-3 py-2 text-left">Repuesto</th>
                      <th className="px-3 py-2 text-right">Precio</th>
                      <th className="px-3 py-2 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{r.marca}</td>
                        <td className="px-3 py-2">{r.modelo}</td>
                        <td className="px-3 py-2">{r.nombre_repuesto}</td>
                        <td className="px-3 py-2 text-right">${r.precio}</td>
                        <td className="px-3 py-2 text-right">{r.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2">...y {preview.length - 10} más</p>
                )}
              </div>

              <button
                onClick={handleImport}
                disabled={loading}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Importando...' : `Importar ${preview.length} repuestos`}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
