
import { AxiosRequestConfig } from 'axios'
import { BasicValue, Request, RequestParams, Sender, SenderResponse } from './types'

export interface ClientConfig {
  userAgent: string
  baseURL: string
}

export class Client {
  private sender: Sender
  private config?: ClientConfig

  constructor (sender: Sender, config?: ClientConfig) {
    this.sender = sender
    this.config = config
  }

  request = (req: Request): ClientRequest => {
    return new ClientRequest(this.sender, {
      url: req.url,
      method: req.method,
      params: parseParams(req.params),
      baseURL: this.config?.baseURL,
      data: req.data,
      headers: {
        'User-Agent': this.config?.userAgent ?? 'Spacetime',
      },
    })
  }
}

export class ClientRequest {
  private aborter: AbortController
  private req: AxiosRequestConfig
  private sender: Sender

  constructor (sender: Sender, req: AxiosRequestConfig) {
    this.aborter = new AbortController()
    this.req = req
    this.sender = sender
  }

  abort = () => {
    this.aborter.abort()
  }

  send = async (): Promise<SenderResponse> => {
    return this.sender({
      ...this.req,
      signal: this.aborter.signal,
    })
  }
}

export function parseParams (params?: RequestParams): Record<string, BasicValue|undefined> {
  if (!params) return {}
  return {
    ...params,
    where: params?.where ? JSON.stringify(params?.where) : undefined,
  }
}
