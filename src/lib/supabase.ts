import { createBrowserClient } from '@supabase/ssr'

// Versão para uso no cliente (browser)
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Para uso direto no cliente
export const supabase = createClient() 