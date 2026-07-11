import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

type AuthState = {
  session: Session | null
  profile: Profile | null
  gpBalance: number
  loading: boolean
  refreshProfile: () => Promise<void>
  refreshBalance: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  gpBalance: 0,
  loading: true,
  refreshProfile: async () => {},
  refreshBalance: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [gpBalance, setGpBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user) { setProfile(null); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(data)
  }, [session?.user])

  const refreshBalance = useCallback(async () => {
    if (!session?.user) { setGpBalance(0); return }
    const { data } = await supabase.rpc('gp_balance', { _user: session.user.id })
    setGpBalance(data ?? 0)
  }, [session?.user])

  useEffect(() => {
    refreshProfile()
    refreshBalance()
  }, [refreshProfile, refreshBalance])

  return (
    <AuthContext.Provider value={{ session, profile, gpBalance, loading, refreshProfile, refreshBalance }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
