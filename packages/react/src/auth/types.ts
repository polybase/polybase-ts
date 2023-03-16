import type { AuthState } from '@polybase/auth'

export interface SignInParameters {
  force?: boolean
}

export interface Auth extends AuthBase {
  signIn: (params?: SignInParameters) => Promise<AuthState>
  signOut: () => Promise<void>
}

export interface AuthBase {
  ethPersonalSign: (msg: string) => Promise<string>
  onAuthUpdate: (listener: (state: AuthState | null) => void) => () => void
}
