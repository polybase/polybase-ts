
import { AxiosRequestConfig } from 'axios'
import { BasicValue, Request, RequestParams, Sender, SenderResponse } from './types'

export class Client {
  private sender: Sender
  private baseURL?: string

  constructor (sender: Sender, baseURL?: string) {
    this.sender = sender
    this.baseURL = baseURL
  }

  request = (req: Request): ClientRequest => {
    return new ClientRequest(this.sender, {
      url: req.url,
      method: req.method,
      params: parseParams(req.params),
      baseURL: this.baseURL,
      data: req.data,
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
