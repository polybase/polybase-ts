import React, { createContext, useState, useEffect, useMemo } from 'react'
import { Polybase } from '@polybase/client'
import type { AuthState } from '@polybase/auth'
import { Auth, AuthBase, PolybaseBase } from './types'

export interface AuthContextValue<T extends AuthBase> {
  auth: T,
  state: AuthState | null
  loading: boolean
}

export const AuthContext = createContext<AuthContextValue<Auth>>({
  auth: {
    signIn: async () => { throw new Error('signIn: Not implemented') },
    signOut: async () => { throw new Error('signOut: Not implemented') },
    ethPersonalSign: async () => { throw new Error('ethPersonalSign: Not implemented') },
    onAuthUpdate: (cb) => { throw new Error('onAuthUpdate: Not implemented') },
  },
  loading: true,
  state: null,
})

export interface AuthProviderProps<T, P> {
  children: React.ReactNode
  polybase: P
  auth: T
}

export function AuthProvider<T extends Auth = Auth, P extends PolybaseBase = Polybase>({ children, auth, polybase }: AuthProviderProps<T, P>) {
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) return
    return auth.onAuthUpdate((authState) => {
      setAuthState(authState)
      setLoading(false)
      polybase.signer(async (data: string) => {
        return { h: 'eth-personal-sign', sig: await auth.ethPersonalSign(data) }
      })
    })
  }, [auth, polybase])

  const value = useMemo(() => ({
    auth,
    state: authState,
    loading,
  }), [auth, authState, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
