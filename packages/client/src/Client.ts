
import { AxiosError, AxiosRequestConfig } from 'axios'
import { createError, createErrorFromAxiosError } from './errors'
import { BasicValue, Request, RequestParams, Sender, SenderResponse, Signer } from './types'

export interface ClientConfig {
  clientId: string
  baseURL: string
}

export class Client {
  private sender: Sender
  private signer: Signer
  private config?: ClientConfig

  constructor (sender: Sender, signer: Signer, config?: ClientConfig) {
    this.sender = sender
    this.signer = signer
    this.config = config
  }

  request = (req: Request): ClientRequest => {
    return new ClientRequest(this.sender, this.signer, {
      url: req.url,
      method: req.method,
      params: parseParams(req.params),
      baseURL: this.config?.baseURL,
      data: req.data,
      headers: {
        'X-Spacetime-Client': this.config?.clientId ?? 'Spacetime',
      },
    })
  }
}

export class ClientRequest {
  private aborter: AbortController
  private req: AxiosRequestConfig
  private sender: Sender
  private signer: Signer

  constructor (sender: Sender, signer: Signer, req: AxiosRequestConfig) {
    this.aborter = new AbortController()
    this.req = req
    this.sender = sender
    this.signer = signer
  }

  abort = () => {
    this.aborter.abort()
  }

  send = async (withAuth?: true): Promise<SenderResponse> => {
    try {
      const req = this.req
      if (withAuth) {
        if (!req.headers) req.headers = {}
        const sig = await await this.getSignature()
        req.headers['X-Spacetime-Signature'] = sig
      }
      const res = await this.sender({
        ...req,
        signal: this.aborter.signal,
      })
      return res
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        if (e.code === 'ERR_CANCELED') {
          throw createError('request-cancelled')
        }
        if (e.response?.status === 401 && !withAuth) {
          return this.send(true)
        }
        throw createErrorFromAxiosError(e)
      }
      throw e
    }
  }

  getSignature = async () => {
    const t = Math.round(Date.now() * 1000)
    const sig = await this.signer(`${t}.${JSON.stringify(this.req.data)}`)
    return [
      'v=0',
      `t=${t}`,
      `h=${sig.h}`,
      `sig=${sig.sig}`,
    ].join(',')
  }
}

export function parseParams (params?: RequestParams): Record<string, BasicValue|undefined> {
  if (!params) return {}
  return {
    ...params,
    where: params?.where ? JSON.stringify(params?.where) : undefined,
  }
}
