import { useContext } from 'react'
import { AuthContext } from './AuthProvider'
// import { Auth, AuthBase } from './types'

export function useAuth() {
  // const AuthContext = createAuthContext<T>()
  return useContext(AuthContext)
}
