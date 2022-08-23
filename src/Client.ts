import { AxiosRequestConfig } from 'axios'
import { BasicValue } from './types'

export interface Request {
  url: string
  method: 'GET'|'POST'|'PUT'|'DELETE'
  params?: RequestParams
  data?: any
}

export interface RequestParams {
  limit?: number
  since?: string
  where?: Record<string, BasicValue>
}

export type Sender = (config: AxiosRequestConfig) => Promise<SenderResponse>
export interface SenderResponse {
  status: number
  headers: Record<string, string>
  data: any
}

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
