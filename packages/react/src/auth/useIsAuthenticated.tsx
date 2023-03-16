import { useContext } from 'react'
import { AuthContext } from './AuthProvider'

/**
 * Returns the current auth state and loading state. Requires to be a child of
 * an AuthProvider.
 *
 * @returns [isLoggedIn, loading]
 */
export function useIsAuthenticated(): [null | boolean, boolean] {
  const auth = useContext(AuthContext)
  return [auth.loading ? null : !!auth.state, auth.loading]
}
