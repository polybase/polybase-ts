import React, { createContext, useState, useEffect, useMemo } from 'react'
import { Polybase } from '@polybase/client'
import type { AuthState } from '@polybase/auth'
import { Auth, AuthBase } from './types'

export interface AuthContextValue<T extends AuthBase> {
  auth: T,
  state: AuthState | null
  loading: boolean
}

export function createAuthContext<T extends AuthBase = Auth>() {
  return createContext<AuthContextValue<T>>({
    auth: {} as T,
    state: null,
    loading: false,
  })
}

// export const AuthContext = createContext<AuthContextValue<Auth>>({
//   auth: {
//     signIn: async () => { throw new Error('signIn: Not implemented') },
//     signOut: async () => { throw new Error('signOut: Not implemented') },
//     ethPersonalSign: async () => { throw new Error('ethPersonalSign: Not implemented') },
//     onAuthUpdate: (cb) => { throw new Error('onAuthUpdate: Not implemented') },
//   },
//   loading: true,
//   state: null,
// })

export interface AuthProviderProps<T> {
  children: React.ReactNode
  polybase: Polybase
  auth: T
}

export function AuthProvider<T extends AuthBase = Auth>({ children, auth, polybase }: AuthProviderProps<T>) {
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [loading, setLoading] = useState(true)
  const AuthContext = createAuthContext<T>()

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
