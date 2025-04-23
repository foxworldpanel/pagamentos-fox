# Configuração do Supabase para Fox World Panel Pagamentos

Este guia explica como configurar o Supabase para autenticação e banco de dados em tempo real para o sistema de pagamentos.

## Pré-requisitos

1. Criar uma conta no [Supabase](https://supabase.com)
2. Criar um novo projeto

## Configuração do Projeto

### 1. Obter as credenciais do Supabase

Após criar um projeto no Supabase, você precisa obter:

- URL do projeto (Project URL)
- Chave anônima (anon key)

Essas informações podem ser encontradas em:
- Dashboard do Supabase > Projeto > Project Settings > API > Project URL e Project API keys

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
```

### 3. Configuração de Autenticação

#### Habilitar autenticação por Email/Senha

1. No dashboard do Supabase, vá para Authentication > Providers
2. Certifique-se de que Email está habilitado
3. Configure as opções de acordo com suas necessidades

### 4. Gerenciar usuários (sem cadastro público)

Como mencionado no requisito, não haverá cadastro público. Para adicionar usuários:

1. Vá para Authentication > Users
2. Clique em "Invite User" ou "Add User"
3. Insira o email e a senha do usuário

### 5. Configurar banco de dados em tempo real

Para dados em tempo real que você deseja monitorar:

1. Vá para Database > Tables
2. Crie tabelas necessárias para seu sistema de pagamentos (exemplo abaixo)
3. Configure as permissões nas políticas RLS (Row Level Security)

#### Exemplo de tabela de pagamentos:

```sql
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  payment_date TIMESTAMP WITH TIME ZONE
);

-- Políticas RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Apenas usuários autenticados podem ver pagamentos
CREATE POLICY "Usuários podem ver pagamentos" ON payments
  FOR SELECT USING (auth.role() = 'authenticated');
```

## Uso no Frontend

As integrações com o Supabase já estão configuradas no código:

- Autenticação: `src/lib/auth-context.tsx`
- Cliente Supabase: `src/lib/supabase.ts`
- Proteção de rotas: `src/middleware.ts`

## Implementando recursos em tempo real

Para usar recursos em tempo real do Supabase, você pode adicionar o seguinte código:

```typescript
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

// Exemplo para componente que exibe pagamentos em tempo real
function RealtimePayments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    // Carregar dados iniciais
    fetchPayments();

    // Inscrever para atualizações em tempo real
    const subscription = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          // Atualizar a lista de pagamentos quando houver mudanças
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setPayments(data);
  }

  return (
    <div>
      {/* Renderizar os pagamentos */}
    </div>
  );
}
```

## Suporte

Para mais informações, consulte a [documentação oficial do Supabase](https://supabase.com/docs). 