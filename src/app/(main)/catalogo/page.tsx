'use client';

import { createClient } from '@/shared/lib/supabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

interface Repuesto {
  id: string;
  marca: string;
  modelo: string;
  categoria: string;
  nombre_repuesto: string;
  precio: number;
  stock: number;
  created_at: string;
}

export default function CatalogoPage() {
  const router = useRouter();
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'agotados'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ precio: 0, stock: 0 });

  useEffect(() => {
    const fetchCatalogo = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('catalogo')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRepuestos(data);
      }
      setLoading(false);
    };

    fetchCatalogo();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este repuesto?')) return;
    
    const supabase = createClient();
    await supabase.from('catalogo').delete().eq('id', id);
    setRepuestos(repuestos.filter(r => r.id !== id));
  };

  const handleExport = () => {
    const dataToExport = filteredRepuestos.map(r => ({
      Marca: r.marca,
      Modelo: r.modelo,
      Categoría: r.categoria || '',
      'Nombre Repuesto': r.nombre_repuesto,
      Precio: r.precio,
      Stock: r.stock,
      Estado: r.stock === 0 ? 'AGOTADO' : r.stock <= 5 ? 'STOCK BAJO' : 'DISPONIBLE',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Catálogo');
    
    const colWidths = [
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 8 }, { wch: 15 }
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, `catalogo_metaresponder_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const startEdit = (repuesto: Repuesto) => {
    setEditingId(repuesto.id);
    setEditForm({ precio: repuesto.precio, stock: repuesto.stock });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ precio: 0, stock: 0 });
  };

  const saveEdit = async (id: string) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('catalogo')
      .update({ precio: editForm.precio, stock: editForm.stock })
      .eq('id', id);

    if (!error) {
      setRepuestos(repuestos.map(r => 
        r.id === id ? { ...r, precio: editForm.precio, stock: editForm.stock } : r
      ));
    }
    
    setEditingId(null);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const filteredRepuestos = repuestos.filter(r => {
    const matchesSearch = 
      r.nombre_repuesto.toLowerCase().includes(search.toLowerCase()) ||
      r.marca.toLowerCase().includes(search.toLowerCase()) ||
      r.modelo.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'agotados') {
      return matchesSearch && r.stock === 0;
    }
    return matchesSearch;
  });

  const agotadosCount = repuestos.filter(r => r.stock === 0).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-blue-900">Mi Catálogo</h1>
            </div>
            <div className="flex items-center">
              <button onClick={handleLogout} className="text-sm text-red-600">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="Buscar repuesto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Todos ({repuestos.length})
                </button>
                <button
                  onClick={() => setFilter('agotados')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'agotados' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Agotados ({agotadosCount})
                </button>
                <button
                  onClick={handleExport}
                  disabled={repuestos.length === 0}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  📥 Exportar Excel
                </button>
              </div>
            </div>
          </div>

          {repuestos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg mb-4">No hay repuestos en tu catálogo</p>
              <button
                onClick={() => router.push('/importar')}
                className="text-blue-600 hover:underline"
              >
                Importar catálogo
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Marca</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Modelo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Categoría</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Repuesto</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Precio</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Stock</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepuestos.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">{r.marca}</td>
                      <td className="px-4 py-3">{r.modelo}</td>
                      <td className="px-4 py-3">
                        {r.categoria ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            {r.categoria}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{r.nombre_repuesto}</td>
                      <td className="px-4 py-3 text-right">
                        {editingId === r.id ? (
                          <input
                            type="number"
                            value={editForm.precio}
                            onChange={(e) => setEditForm({ ...editForm, precio: parseFloat(e.target.value) || 0 })}
                            className="w-24 px-2 py-1 border rounded text-right"
                          />
                        ) : (
                          <span>${r.precio.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingId === r.id ? (
                          <input
                            type="number"
                            value={editForm.stock}
                            onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 border rounded text-right"
                          />
                        ) : (
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${r.stock === 0 ? 'bg-red-100 text-red-800' : r.stock <= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {r.stock === 0 ? 'AGOTADO' : r.stock}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editingId === r.id ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => saveEdit(r.id)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-600 hover:text-gray-800 text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => startEdit(r)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredRepuestos.length > 0 && (
            <div className="p-4 border-t flex justify-between items-center text-sm text-gray-500">
              <span>Total: {filteredRepuestos.length} repuestos</span>
              {agotadosCount > 0 && (
                <span className="text-red-600 font-medium">
                  ⚠ {agotadosCount} producto{agotadosCount > 1 ? 's' : ''} agotado{agotadosCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
