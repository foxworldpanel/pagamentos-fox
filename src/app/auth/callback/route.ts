import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    // Criando um objeto de resposta para manipular cookies
    const response = NextResponse.redirect(`${origin}/dashboard`)
    
    // Criando o cliente Supabase com a API mais recente
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value
          },
          set(name, value, options) {
            response.cookies.set({
              name, 
              value,
              ...options
            })
          },
          remove(name, options) {
            response.cookies.delete({
              name,
              ...options
            })
          },
        },
      }
    )
    
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error('Erro ao trocar código por sessão:', error)
    }
    
    return response
  }

  // Se não houver código, apenas redirecionar
  return NextResponse.redirect(`${origin}/dashboard`)
} 