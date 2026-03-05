// WhatsApp Webhook for METARESPONDER
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('WhatsApp Webhook received:', JSON.stringify(body, null, 2));

    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];

      for (const entry of entries) {
        const changes = entry.changes || [];
        
        for (const change of changes) {
          const messages = change.value?.messages || [];
          
          for (const message of messages) {
            const from = message.from;
            const text = message.text?.body || '';
            const timestamp = new Date().toISOString();

            console.log(`Message from ${from}: ${text}`);

            // Buscar en el catálogo
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            const { data: repuestos } = await supabase
              .from('catalogo')
              .select('*')
              .or(`nombre_repuesto.ilike.%${text}%,marca.ilike.%${text}%,modelo.ilike.%${text}%`)
              .limit(5);

            let responseText = '';
            
            if (repuestos && repuestos.length > 0) {
              responseText = '¡Hola! Estos son los repuestos que encontré:\n\n';
              for (const r of repuestos) {
                const disponibilidad = r.stock > 0 ? `✓ Disponible (${r.stock} unidades)` : '✗ Agotado';
                responseText += `• ${r.nombre_repuesto} - $${r.precio}\n  ${r.marca} ${r.modelo}\n  ${disponibilidad}\n\n`;
              }
              responseText += '¿Necesitas más información?';
            } else {
              responseText = '¡Hola! No encontré repuestos que coincidan con tu búsqueda. ¿Podrías darme más detalles?';
            }

            // Guardar en la base de datos
            await supabase.from('whatsapp_mensajes').insert({
              from_number: from,
              message_text: text,
              response_text: responseText,
            });

            // Responder al mensaje
            const configData = await supabase
              .from('whatsapp_config')
              .select('phone_number_id, access_token')
              .limit(1)
              .single();

            if (configData.data?.phone_number_id && configData.data?.access_token) {
              await fetch(
                `https://graph.facebook.com/v21.0/${configData.data.phone_number_id}/messages`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${configData.data.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: from,
                    type: 'text',
                    text: { body: responseText },
                  }),
                }
              );
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = 'metaresponder_webhook';

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}
