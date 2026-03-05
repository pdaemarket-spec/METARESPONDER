-- Tabla de configuración de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number_id TEXT,
  business_account_id TEXT,
  access_token TEXT,
  webhook_verify_token TEXT DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS whatsapp_mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_number TEXT NOT NULL,
  message_text TEXT,
  response_text TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_mensajes ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own whatsapp_config" ON whatsapp_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own whatsapp_config" ON whatsapp_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own whatsapp_config" ON whatsapp_config FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own whatsapp_mensajes" ON whatsapp_mensajes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own whatsapp_mensajes" ON whatsapp_mensajes FOR INSERT WITH CHECK (auth.uid() = user_id);
