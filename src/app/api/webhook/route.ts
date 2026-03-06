import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function buscarEnCatalogo(texto: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: repuestos } = await supabase
    .from('catalogo')
    .select('*')
    .or(`nombre_repuesto.ilike.%${texto}%,marca.ilike.%${texto}%,modelo.ilike.%${texto}%`)
    .limit(5);

  if (repuestos && repuestos.length > 0) {
    let responseText = '¡Hola! Estos son los repuestos que encontré:\n\n';
    for (const r of repuestos) {
      const disponibilidad = r.stock > 0 ? `✓ Disponible (${r.stock} unidades)` : '✗ Agotado';
      responseText += `• ${r.nombre_repuesto} - $${r.precio}\n  ${r.marca} ${r.modelo}\n  ${disponibilidad}\n\n`;
    }
    responseText += '¿Necesitas más información?';
    return responseText;
  }
  
  return '¡Hola! No encontré repuestos que coincidan con tu búsqueda. ¿Podrías darme más detalles?';
}

async function enviarMensajeWhatsApp(phoneNumberId: string, accessToken: string, to: string, message: string) {
  await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    }),
  });
}

async function enviarMensajeMessenger(pageAccessToken: string, recipientId: string, message: string) {
  await fetch(`https://graph.facebook.com/v21.0/me/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pageAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    const supabase = createClient(supabaseUrl, supabaseKey);

    // WhatsApp
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const messages = change.value?.messages || [];
          for (const message of messages) {
            const from = message.from;
            const text = message.text?.body || '';
            const responseText = await buscarEnCatalogo(text);

            await supabase.from('whatsapp_mensajes').insert({
              from_number: from,
              message_text: text,
              response_text: responseText,
            });

            const configData = await supabase
              .from('whatsapp_config')
              .select('phone_number_id, access_token')
              .limit(1)
              .single();

            if (configData.data?.phone_number_id && configData.data?.access_token) {
              await enviarMensajeWhatsApp(
                configData.data.phone_number_id,
                configData.data.access_token,
                from,
                responseText
              );
            }
          }
        }
      }
    }

    // Messenger
    if (body.object === 'page') {
      const entries = body.entry || [];
      for (const entry of entries) {
        const messaging = entry.messaging || [];
        for (const message of messaging) {
          const senderId = message.sender.id;
          const text = message.message?.text || '';
          const responseText = await buscarEnCatalogo(text);

          await supabase.from('messenger_mensajes').insert({
            sender_id: senderId,
            message_text: text,
            response_text: responseText,
          });

          const configData = await supabase
            .from('messenger_config')
            .select('page_access_token')
            .limit(1)
            .single();

          if (configData.data?.page_access_token) {
            await enviarMensajeMessenger(
              configData.data.page_access_token,
              senderId,
              responseText
            );
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
