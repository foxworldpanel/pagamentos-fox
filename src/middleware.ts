import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lista de rotas que não precisam de autenticação
const publicRoutes = ['/login', '/forgot-password']
// Rotas a ignorar completamente no middleware
const ignoredRoutes = ['/api', '/_next', '/static', '/images', '/favicon.ico', '/auth/callback']
// Rotas públicas que qualquer um pode acessar
const openRoutes = ['/pagamento']

export async function middleware(request: NextRequest) {
  // Verificar se a rota deve ser ignorada
  const { pathname } = request.nextUrl
  
  // Ignorar rotas estáticas e de API
  if (ignoredRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Permitir acesso à página de pagamento sem autenticação
  if (openRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Criar uma resposta que pode ser modificada
  const response = NextResponse.next()
  
  // Criar cliente do Supabase com cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({
            name,
            value,
            ...options,
          })
          // Também configurar com SameSite=None
          response.cookies.set({
            name,
            value,
            sameSite: 'none',
            secure: true,
            ...options,
          })
        },
        remove: (name, options) => {
          response.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )
  
  try {
    // Verificar se o usuário está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    // Clonar a URL para possíveis redirecionamentos
    const url = request.nextUrl.clone()
    
    // Se for a raiz e tiver sessão, redirecionar para o dashboard
    // if (session && pathname === '/') {
    //   url.pathname = '/dashboard'
    //   return NextResponse.redirect(url)
    // }
    
    // // Se estiver em uma rota de autenticação mas já estiver logado, redireciona para o dashboard
    // if (session && publicRoutes.includes(pathname)) {
    //   url.pathname = '/dashboard'
    //   return NextResponse.redirect(url)
    // }
    
    // Se tentar acessar uma rota protegida sem estar logado, redireciona para login
    if (!session && 
        !publicRoutes.includes(pathname) && 
        !pathname.startsWith('/auth/') && 
        !openRoutes.some(route => pathname.startsWith(route))) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    
    return response
  } catch (error) {
    console.error('Erro no middleware:', error)
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 