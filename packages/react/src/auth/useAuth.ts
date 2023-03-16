import { useContext } from 'react'
import { createAuthContext, AuthContextValue } from './AuthProvider'
import { Auth, AuthBase } from './types'

export function useAuth<T extends AuthBase = Auth>(): AuthContextValue<T> {
  const AuthContext = createAuthContext<T>()
  return useContext(AuthContext)
}
