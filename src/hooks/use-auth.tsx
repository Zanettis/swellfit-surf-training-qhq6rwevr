import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

/** Human-readable message for the auth errors the email+password flow hits. */
function readableAuthError(error: { message?: string } | null | undefined): string {
  const raw = error?.message ?? ''
  const message = raw.toLowerCase()
  if (message.includes('invalid login credentials')) return 'Wrong email or password.'
  if (message.includes('email not confirmed')) return 'This email has not been confirmed yet.'
  if (message.includes('already registered') || message.includes('already exists'))
    return 'An account with this email already exists — try signing in.'
  if (message.includes('password') && message.includes('least'))
    return 'Password must be at least 6 characters.'
  if (message.includes('rate limit')) return 'Too many attempts — wait a moment and try again.'
  if (message.includes('failed to fetch') || message.includes('network'))
    return 'Network error — check your connection and try again.'
  return raw || 'Something went wrong — please try again.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sync only inside the callback — no async/await here (supabase-js fires
    // INITIAL_SESSION synchronously when a persisted session exists).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    return { error: readableAuthError(error) }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: readableAuthError(error) }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
