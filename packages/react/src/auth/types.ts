import type { AuthState } from '@polybase/auth'
import type { Signer } from '@polybase/client'

export interface SignInParameters {
  force?: boolean
}

export interface Auth extends AuthBase {
  signIn: (params?: SignInParameters) => Promise<AuthState | null>
  signOut: () => Promise<void>
}

export interface AuthBase {
  ethPersonalSign: (msg: string) => Promise<string>
  onAuthUpdate: (listener: (state: AuthState | null) => void) => () => void
}

export interface PolybaseBase {
  signer: (fn: Signer) => void
}
