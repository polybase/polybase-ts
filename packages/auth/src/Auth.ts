import { connectToChild, Connection, AsyncMethodReturns } from 'penpal'
import { Modal } from './Modal'

export interface AuthState {
  type: 'metamask' | 'email'
  email?: string | null
  userId?: string | null
  publicKey?: string | null
}

export interface ActionRequestEthPersonalSign {
  type: 'ethPersonalSign',
  data: {
    msg: string
  }
}

export interface ActionRequestSignIn {
  type: 'signIn',
  data: {
    // Force sign in modal to show, even if already signed in
    force?: boolean
  }
}

export interface ActionRequestSignOut {
  type: 'signOut',
}

export type ActionRequest = ActionRequestEthPersonalSign | ActionRequestSignIn | ActionRequestSignOut

export interface AuthConfig {
  origin?: string,
  url: string
}

export interface Register {
  domain: string
}

export interface ChildFns {
  register: (register: Register) => Promise<void>
  action: (action: ActionRequest) => Promise<any>
}

export type AuthListener = (state: AuthState | null, auth: Auth) => void
export type AuthUnsubscribeListener = () => void
export interface SignInParameters {
  force?: boolean
}

export const defaultConfig = {
  url: 'https://auth.testnet.polybase.xyz',
}

export class Auth {
  config?: AuthConfig
  isAuthenticated: boolean
  state: AuthState | null
  loading: boolean
  private authUpdateListeners: AuthListener[] = []
  private modal: Modal
  private connection: Connection<ChildFns>
  private promise: Promise<AsyncMethodReturns<ChildFns>>

  constructor(config?: AuthConfig) {
    this.config = {
      ...defaultConfig,
      ...(config ?? {}),
    }

    this.modal = new Modal(`${Date.now()}`, this.config?.url)

    this.connection = connectToChild({
      // The iframe to which a connection should be made.
      iframe: this.modal.iframe,
      // Methods the parent is exposing to the child.
      methods: {
        onAuthUpdate: (auth: AuthState | null) => {
          this.loading = false
          this.isAuthenticated = !!auth
          if (!isEqual(this.state, auth)) {
            this.authUpdateListeners.forEach((fn) => {
              fn(auth, this)
            })
          }
          this.state = auth
        },
        show: () => {
          this.modal.show()
        },
        hide: () => {
          this.modal.hide()
        },
      },
    })
    this.isAuthenticated = false
    this.state = null
    this.loading = true
    this.promise = this.init()
  }

  signIn = async (params?: SignInParameters): Promise<AuthState | null> => {
    const { force } = params ?? {}
    if (force || !this.isAuthenticated) {
      await this.action({
        type: 'signIn',
        data: {
          force,
        },
      })
    }
    return this.state
  }

  signOut = async (): Promise<void> => {
    await this.action({
      type: 'signOut',
    })
  }

  ethPersonalSign = async (msg: string): Promise<string> => {
    return this.action({
      type: 'ethPersonalSign',
      data: {
        msg,
      },
    })
  }

  onAuthUpdate = (listener: AuthListener): AuthUnsubscribeListener => {
    // Add listener
    this.authUpdateListeners.push(listener)
    // Call listener, if not loading
    if (!this.loading) {
      listener(this.state, this)
    }
    return () => {
      // Remove listener
      const index = this.authUpdateListeners.indexOf(listener)
      this.authUpdateListeners.splice(index, 1)
    }
  }

  private init = async () => {
    const child = await this.connection.promise
    await child.register({
      domain: this.config?.origin ?? window.location.origin,
    })
    return child
  }

  private action = async (action: ActionRequest): Promise<any> => {
    return (await this.promise).action(action)
  }
}

function isEqual(obj1: any, obj2: any) {
  if (obj1 === obj2) return true
  if (obj1 === null || obj2 === null) return false
  const obj1Keys = Object.keys(obj1)
  const obj2Keys = Object.keys(obj2)
  return obj1Keys.length === obj2Keys.length && obj1Keys.every((key: any) => obj1[key] === obj2[key])
}
