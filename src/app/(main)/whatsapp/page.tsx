'use client';

import { createClient } from '@/shared/lib/supabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WhatsAppConfig {
  id: string;
  phone_number_id: string;
  business_account_id: string;
  is_active: boolean;
}

export default function WhatsAppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    phone_number_id: '',
    business_account_id: '',
    access_token: '',
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
        .from('whatsapp_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setConfig(data);
        setForm({
          phone_number_id: data.phone_number_id || '',
          business_account_id: data.business_account_id || '',
          access_token: '',
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
        .from('whatsapp_config')
        .update({
          phone_number_id: form.phone_number_id,
          business_account_id: form.business_account_id,
          access_token: form.access_token,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);

      if (updateError) {
        setError('Error al guardar: ' + updateError.message);
      } else {
        setSuccess('Configuración guardada');
        setForm({ ...form, access_token: '' });
      }
    } else {
      const { error: insertError } = await supabase
        .from('whatsapp_config')
        .insert({
          user_id: user.id,
          phone_number_id: form.phone_number_id,
          business_account_id: form.business_account_id,
          access_token: form.access_token,
        });

      if (insertError) {
        setError('Error al guardar: ' + insertError.message);
      } else {
        setSuccess('Configuración guardada');
      }
    }

    setSaving(false);
  };

  const testWhatsApp = async () => {
    if (!form.phone_number_id || !form.access_token) {
      setError('Necesitas guardar la configuración primero');
      return;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${form.phone_number_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${form.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: 'YOUR_TEST_NUMBER',
            type: 'text',
            text: { body: 'Hola! Esta es una prueba de METARESPONDER' },
          }),
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('¡Mensaje de prueba enviado! (Revisa tu WhatsApp)');
      } else {
        setError('Error: ' + (data.error?.message || 'Desconocido'));
      }
    } catch (err) {
      setError('Error de conexión');
    }
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
              <h1 className="text-xl font-bold text-blue-900">WhatsApp</h1>
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
          <h2 className="text-lg font-semibold mb-6">Configurar WhatsApp Business</h2>

          {config?.is_active && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✓ WhatsApp conectado</p>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number ID
              </label>
              <input
                type="text"
                value={form.phone_number_id}
                onChange={(e) => setForm({ ...form, phone_number_id: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1039451079249946"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Business Account ID
              </label>
              <input
                type="text"
                value={form.business_account_id}
                onChange={(e) => setForm({ ...form, business_account_id: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="787997663857070"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token
              </label>
              <input
                type="password"
                value={form.access_token}
                onChange={(e) => setForm({ ...form, access_token: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="EAA..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Token de Meta for Developers (dura 24 horas)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
              <button
                onClick={testWhatsApp}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Probar Conexión
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Próximos pasos:</h3>
            <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
              <li>Guarda la configuración con tus credenciales</li>
              <li>Configura el Webhook para recibir mensajes</li>
              <li>Activa el agente IA para responder automáticamente</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
