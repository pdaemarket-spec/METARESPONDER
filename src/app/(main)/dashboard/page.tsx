'use client';

import { createClient } from '@/shared/lib/supabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
  total_repuestos: number;
  total_conversaciones: number;
  mensajes_hoy: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    total_repuestos: 0,
    total_conversaciones: 0,
    mensajes_hoy: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        
        const { data: repuestos } = await supabase
          .from('catalogo')
          .select('id', { count: 'exact' });
        
        const { data: conversaciones } = await supabase
          .from('conversaciones')
          .select('id', { count: 'exact' });

        const today = new Date().toISOString().split('T')[0];
        const { data: hoy } = await supabase
          .from('conversaciones')
          .select('id', { count: 'exact' })
          .gte('timestamp', today);

        setStats({
          total_repuestos: repuestos?.length || 0,
          total_conversaciones: conversaciones?.length || 0,
          mensajes_hoy: hoy?.length || 0,
        });
      }
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

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
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-900">METARESPONDER</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <p className="text-sm text-gray-500">Total Repuestos</p>
            <p className="text-3xl font-bold text-blue-600">{stats.total_repuestos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <p className="text-sm text-gray-500">Conversaciones</p>
            <p className="text-3xl font-bold text-green-600">{stats.total_conversaciones}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <p className="text-sm text-gray-500">Mensajes Hoy</p>
            <p className="text-3xl font-bold text-purple-600">{stats.mensajes_hoy}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h3 className="text-lg font-semibold mb-4">Catálogo</h3>
            <p className="text-gray-600 mb-4">Gestiona tu inventario</p>
            <Link href="/catalogo" className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-2">
              Ver Catálogo
            </Link>
            <Link href="/agregar" className="block text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              + Agregar Uno
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h3 className="text-lg font-semibold mb-4">WhatsApp</h3>
            <p className="text-gray-600 mb-4">Conecta tu número de WhatsApp</p>
            <Link href="/whatsapp" className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-2">
              Configurar WhatsApp
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h3 className="text-lg font-semibold mb-4">Messenger</h3>
            <p className="text-gray-600 mb-4">Conecta Facebook Messenger</p>
            <Link href="/messenger" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Configurar Messenger
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h3 className="text-lg font-semibold mb-4">Configuración</h3>
            <p className="text-gray-600 mb-4">Personaliza respuestas y horarios</p>
            <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Configurar
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h3 className="text-lg font-semibold mb-4">Subir Catálogo</h3>
            <p className="text-gray-600 mb-4">Importa tu catálogo desde Excel/PDF</p>
            <Link href="/importar" className="inline-block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              Importar
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
