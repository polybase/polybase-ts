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
}

export type ActionRequest = ActionRequestEthPersonalSign | ActionRequestSignIn

export interface AuthConfig {
  domain?: string,
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

export const defaultConfig = {
  url: 'https://auth.testnet.polybase.xyz',
}

export class Auth {
  config?: AuthConfig
  modal: Modal
  connection: Connection<ChildFns>
  isAuthenticated: boolean
  state: AuthState | null
  loading: boolean
  promise: Promise<AsyncMethodReturns<ChildFns>>
  authUpdateListeners: AuthListener[] = []

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

  init = async () => {
    const child = await this.connection.promise
    await child.register({
      domain: this.config?.domain ?? window.location.origin,
    })
    return child
  }

  signIn = async () => {
    return this.action({
      type: 'signIn',
    })
  }

  ethPersonalSign = async (msg: string) => {
    return this.action({
      type: 'ethPersonalSign',
      data: {
        msg,
      },
    })
  }

  action = async (action: ActionRequest) => {
    return (await this.promise).action(action)
  }

  onAuthUpdate = (listener: AuthListener) => {
    // Add listener
    this.authUpdateListeners.push(listener)
    // Call listener
    listener(this.state, this)
    return () => {
      // Remove listener
      const index = this.authUpdateListeners.indexOf(listener)
      this.authUpdateListeners.splice(index, 1)
    }
  }
}

function isEqual(obj1: any, obj2: any) {
  if (obj1 === obj2) return true
  if (obj1 === null || obj2 === null) return false
  const obj1Keys = Object.keys(obj1)
  const obj2Keys = Object.keys(obj2)
  return obj1Keys.length === obj2Keys.length && obj1Keys.every((key: any) => obj1[key] === obj2[key])
}
