'use client';

import { createClient } from '@/shared/lib/supabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MessengerConfig {
  id: string;
  page_id: string;
  page_access_token: string;
  is_active: boolean;
}

export default function MessengerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<MessengerConfig | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    page_id: '',
    page_access_token: '',
  });

  useEffect(() => {
    const fetchConfig = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('messenger_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setConfig(data);
        setForm({
          page_id: data.page_id || '',
          page_access_token: data.page_access_token || '',
        });
      }
      setLoading(false);
    };

    fetchConfig();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    if (config) {
      const { error: updateError } = await supabase
        .from('messenger_config')
        .update({
          page_id: form.page_id,
          page_access_token: form.page_access_token,
        })
        .eq('id', config.id);

      if (updateError) {
        setError('Error al guardar: ' + updateError.message);
      } else {
        setSuccess('Configuración guardada');
      }
    } else {
      const { error: insertError } = await supabase
        .from('messenger_config')
        .insert({
          user_id: user.id,
          page_id: form.page_id,
          page_access_token: form.page_access_token,
        });

      if (insertError) {
        setError('Error al guardar: ' + insertError.message);
      } else {
        setSuccess('Configuración guardada');
      }
    }

    setSaving(false);
  };

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
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Volver
              </button>
              <h1 className="text-xl font-bold text-blue-900">Facebook Messenger</h1>
            </div>
            <div className="flex items-center">
              <button onClick={handleLogout} className="text-sm text-red-600">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-6">Configurar Facebook Messenger</h2>

          {config?.is_active && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✓ Messenger conectado</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="space-y-5">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Cómo obtener las credenciales:</h3>
              <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                <li>Ve a developers.facebook.com → tu app → Messenger → Configuración</li>
                <li>Genera un Token de acceso a página</li>
                <li>Copia el Page ID y el Access Token</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page ID
              </label>
              <input
                type="text"
                value={form.page_id}
                onChange={(e) => setForm({ ...form, page_id: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page Access Token
              </label>
              <input
                type="password"
                value={form.page_access_token}
                onChange={(e) => setForm({ ...form, page_access_token: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="EAAC..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
