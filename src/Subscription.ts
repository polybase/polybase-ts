import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { Request } from './types'
import { toAxiosRequest } from './util'

export type SubscriptionFn<T> = ((data: T) => void)

export class Subscription<T> {
  listeners: ((data: T) => void)[]
  req: AxiosRequestConfig
  client: AxiosInstance
  since?: string
  aborter?: AbortController
  stopped = true

  constructor (req: Request, client: AxiosInstance) {
    this.req = toAxiosRequest(req)
    this.client = client
    this.listeners = []
  }

  tick = async () => {
    this.aborter = new AbortController()
    const params = this.req.params
    if (this.since) {
      params.since = this.since
    }

    try {
      const res = await this.client({
        url: this.req.url,
        params,
        signal: this.aborter.signal,
        timeout: 120,
      })

      this.since = res.headers['x-spacetime-timestamp']

      this.listeners.forEach((fn) => {
        fn(res.data)
      })
    } catch (err) {
      // TODO: improve logging
      console.error('error', err)
    }

    if (!this.stopped) {
      this.tick()
    }
  }

  subscribe = async (fn: SubscriptionFn<T>) => {
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

  // TODO: prevent race conditions by waiting for abort before allowing start again
  stop = async () => {
    this.stopped = true
    this.since = undefined
    if (this.aborter) this.aborter.abort()
  }
}
