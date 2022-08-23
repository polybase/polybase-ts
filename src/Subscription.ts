import { AxiosError } from 'axios'
import merge from 'lodash.merge'
import { Client, Request } from './Client'

export type SubscriptionFn<T> = ((data: T) => void)

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

export class Subscription<T> {
  private listeners: ((data: T) => void)[]
  private req: Request
  private client: Client
  private since?: string
  private aborter?: () => void
  private stopped = true
  private options: SubscriptionOptions
  private errors = 0

  constructor (req: Request, client: Client, options?: Partial<SubscriptionOptions>) {
    this.req = req
    this.client = client
    this.listeners = []
    this.options = merge({}, defaultOptions, options)
  }

  tick = async () => {
    const params = this.req.params ?? {}
    if (this.since) {
      params.since = this.since
    }

    try {
      const req = this.client.request({
        ...this.req,
        params,
      })
      this.aborter = req.abort
      const res = await req.send()

      this.since = res.headers['x-spacetime-timestamp']

      this.listeners.forEach((fn) => {
        fn(res.data)
      })
    } catch (err) {
      // TODO: we should create a client abort error
      if (err instanceof AxiosError) {
        // We cancelled the request
        if (err.code === 'ERR_CANCELED') {
          return
        }
      }

      // TODO: improve logging/error
      console.error('error', err)

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

    this.errors = 0

    if (!this.stopped) {
      setTimeout(() => {
        this.tick()
      }, this.options.timeout)
    }
  }

  subscribe = (fn: SubscriptionFn<T>) => {
    this.listeners.push(fn)
    this.start()
    return () => {
      const index = this.listeners.indexOf(fn)

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
