import { AxiosError } from 'axios'
import merge from 'lodash.merge'
import { Client } from './Client'
import { wrapError, SpacetimeError } from './errors'
import { Request } from './types'

export type SubscriptionFn<T> = ((data: T) => void)
export type SubscriptionErrorFn = ((err: SpacetimeError) => void)

export interface SubscriptionOptions {
  // Default timeout between long poll requests
  timeout: number
  // Max timeout after error backoff
  maxErrorTimeout: number
}

const defaultOptions: SubscriptionOptions = {
  timeout: 100,
  maxErrorTimeout: 60 * 1000,
}

export interface Listener<T> {
  fn: SubscriptionFn<T>
  errFn?: SubscriptionErrorFn
}

export class Subscription<T> {
  private listeners: Listener<T>[]
  private req: Request
  private client: Client
  private since?: number
  private aborter?: () => void
  private stopped = true
  private options: SubscriptionOptions
  private errors = 0
  private data?: T

  constructor (req: Request, client: Client, options?: Partial<SubscriptionOptions>) {
    this.req = req
    this.client = client
    this.listeners = []
    this.options = merge({}, defaultOptions, options)
  }

  tick = async () => {
    const params = this.req.params ?? {}
    if (this.since) {
      params.since = `${this.since}`
    }

    try {
      const req = this.client.request({
        ...this.req,
        params,
      })
      this.aborter = req.abort
      const res = await req.send()

      const timestamp = res.headers['x-spacetime-timestamp']
      this.since = timestamp ? parseFloat(res.headers['x-spacetime-timestamp']) : Date.now() * 1000
      this.data = res.data

      this.listeners.forEach(({ fn }) => {
        fn(res.data)
      })
    } catch (err: any) {
      const statusCode = err.statusCode ?? err.status ?? err.code

      // Don't error for 304
      if (statusCode !== 304) {
        // TODO: we should create a client abort error
        if (err instanceof AxiosError) {
          // We cancelled the request
          if (err.code === 'ERR_CANCELED') {
            return
          }
        }

        let e = err
        if (!(err instanceof SpacetimeError)) {
          e = wrapError(err)
        }

        if (e instanceof SpacetimeError) {
          this.listeners.forEach(({ errFn }) => {
            if (errFn) errFn(e)
          })
        }

        // Also log to console
        console.error(err)

        this.errors += 1

        // Longer timeout before next tick if we
        //  received an error
        const errTimeout = Math.min(
          1000 * this.errors,
          this.options.maxErrorTimeout,
        )
        setTimeout(() => {
          this.tick()
        }, errTimeout)

        return
      }
    }

    this.errors = 0

    // If no since has been stored, then we need to wait longer
    // because
    if (!this.stopped) {
      setTimeout(() => {
        if (this.stopped) return
        this.tick()
      }, this.options.timeout)
    }
  }

  subscribe = (fn: SubscriptionFn<T>, errFn?: SubscriptionErrorFn) => {
    const l = { fn, errFn }
    this.listeners.push(l)
    if (this.data) {
      fn(this.data)
    }
    this.start()
    return () => {
      const index = this.listeners.indexOf(l)

      // Already removed, shouldn't happen
      if (index === -1) return

      // Remove the listener
      this.listeners.splice(index, 1)

      // Stop if no more listeners
      if (this.listeners.length === 0) {
        this.stop()
      }
    }
  }

  start = async () => {
    if (this.stopped) {
      this.stopped = false
      this.tick()
    }
  }

  // TODO: prevent race conditions by waiting for abort
  // before allowing start again
  stop = async () => {
    this.stopped = true
    this.since = undefined
    if (this.aborter) this.aborter()
  }
}
