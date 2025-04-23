'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'
import { Session, User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Carrega a sessão do usuário no carregamento inicial
    async function loadSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setSession(session)
          setUser(session.user)
        } else {
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error)
      } finally {
        setIsLoading(false)
      }
      
      // Configura o listener para mudanças na autenticação
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (event === 'SIGNED_OUT') {
            router.push('/login')
          } else if (event === 'SIGNED_IN' && session) {
            router.push('/dashboard')
          }
        }
      )
      
      return () => {
        subscription.unsubscribe()
      }
    }
    
    loadSession()
  }, [router])

  async function signOut() {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  
  return context
} 