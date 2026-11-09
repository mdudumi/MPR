import { type Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

type AuthState = { session: Session | null; loading: boolean }
const AuthContext = createContext<AuthState>({ session: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: isSupabaseConfigured })
  useEffect(() => {
    if (!supabase) { setState({ session: null, loading: false }); return }
    supabase.auth.getSession().then(({ data }) => setState({ session: data.session, loading: false }))
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => setState({ session, loading: false }))
    return () => subscription.subscription.unsubscribe()
  }, [])
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
