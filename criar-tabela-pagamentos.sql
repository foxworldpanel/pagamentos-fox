-- Criar extensão para UUID se ainda não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de pagamentos para armazenar os dados dos pagamentos PIX
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  external_id TEXT NOT NULL,
  status TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  emv_code TEXT,
  qr_code_image TEXT,
  due_date TIMESTAMP,
  expiration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_id TEXT,
  payment_link TEXT,
  debtor_name TEXT,
  debtor_document TEXT
);

-- Criar índices para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS pagamentos_user_id_idx ON public.pagamentos(user_id);
CREATE INDEX IF NOT EXISTS pagamentos_transaction_id_idx ON public.pagamentos(transaction_id);
CREATE INDEX IF NOT EXISTS pagamentos_external_id_idx ON public.pagamentos(external_id);
CREATE INDEX IF NOT EXISTS pagamentos_status_idx ON public.pagamentos(status);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o campo updated_at
CREATE TRIGGER set_pagamentos_updated_at
BEFORE UPDATE ON public.pagamentos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) para garantir que usuários só vejam seus próprios pagamentos
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar apenas seus próprios pagamentos"
  ON public.pagamentos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios pagamentos"
  ON public.pagamentos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas seus próprios pagamentos"
  ON public.pagamentos
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Função para buscar pagamentos de um usuário
CREATE OR REPLACE FUNCTION get_user_pagamentos(user_uuid UUID)
RETURNS SETOF pagamentos AS $$
BEGIN
  RETURN QUERY 
  SELECT * FROM pagamentos
  WHERE user_id = user_uuid
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 