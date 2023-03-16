import { useContext } from 'react'
import { createAuthContext } from './AuthProvider'
import { Auth } from './types'

/**
 * Returns the current auth state and loading state. Requires to be a child of
 * an AuthProvider.
 *
 * @returns [isLoggedIn, loading]
 */
export function useIsLoggedIn<T extends Auth = Auth>(): [boolean, boolean] {
  const AuthContext = createAuthContext<T>()
  const auth = useContext(AuthContext)
  return [!!auth.state, auth.loading]
}
