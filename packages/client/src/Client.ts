
import { AxiosError, AxiosRequestConfig } from 'axios'
import { createError, createErrorFromAxiosError } from './errors'
import { BasicValue, Request, RequestParams, Sender, SenderResponse, Signer, SignerResponse } from './types'

export interface ClientConfig {
  clientId: string
  baseURL: string
}

type SignatureCache = Record<string, { timeMs: number, sig: SignerResponse }>

export class Client {
  private sender: Sender
  signer?: Signer
  private config?: ClientConfig
  private signatureCache: SignatureCache

  constructor(sender: Sender, signer?: Signer, config?: ClientConfig) {
    this.sender = sender
    this.signer = signer
    this.config = config
    this.signatureCache = {}
  }

  request = (req: Request): ClientRequest => {
    return new ClientRequest(this.sender, {
      url: req.url,
      method: req.method,
      params: parseParams(req.params),
      data: req.data,
    }, this.signatureCache, this.signer, this.config)
  }
}

export class ClientRequest {
  private aborter: AbortController
  private req: Request
  private sender: Sender
  private signer?: Signer
  private config?: ClientConfig
  private signatureCache: SignatureCache

  constructor(sender: Sender, req: Request, signatureCache: SignatureCache, signer?: Signer, config?: ClientConfig) {
    this.aborter = new AbortController()
    this.req = req
    this.sender = sender
    this.signer = signer
    this.config = config
    this.signatureCache = signatureCache
  }

  abort = () => {
    this.aborter.abort()
  }

  /* Sending a request to the server. */
  send = async (withAuth?: boolean, sigExtraTimeMs?: number): Promise<SenderResponse> => {
    try {
      const req = this.req as AxiosRequestConfig
      if (this.signer && withAuth) {
        const sig = await this.getSignature(sigExtraTimeMs || 0)
        if (sig) {
          if (!req.headers) req.headers = {}
          req.headers['X-Polybase-Signature'] = sig
        }
      }
      const res = await this.sender({
        ...req,
        headers: {
          'X-Polybase-Client': this.config?.clientId ?? 'Polybase',
          ...req.headers,
        },
        baseURL: this.config?.baseURL,
        signal: this.aborter.signal,
      })
      return res
    } catch (e: unknown) {
      if (e && typeof e === 'object' && e instanceof AxiosError) {
        if (e.code === 'ERR_CANCELED') {
          throw createError('request/cancelled')
        }
        throw createErrorFromAxiosError(e)
      }
      throw e
    }
  }

  private getSignature = async (extraTimeMs: number) => {
    if (!this.signer) return ''
    let t

    let sig: SignerResponse

    const jsonBody = this.req.data ? JSON.stringify(this.req.data) : ''
    const cachedSignature = this.signatureCache[jsonBody]
    // It takes time to send a request,
    // so we want the signature to be valid at least 30s from now.
    const cacheTimeTolerance = 30 * 1000
    if (cachedSignature && cachedSignature.timeMs > Date.now() + cacheTimeTolerance) {
      t = cachedSignature.timeMs
      sig = cachedSignature.sig
    } else {
      t = Date.now() + extraTimeMs
      const s = await this.signer(`${t}.${jsonBody}`, this.req)
      if (!s) return null

      sig = s

      if (extraTimeMs > 0) {
        this.signatureCache[jsonBody] = {
          timeMs: t,
          sig: s,
        }
      }
    }

    const h = [
      'v=0',
      `t=${t}`,
      `h=${sig.h}`,
      `sig=${sig.sig}`,
    ]
    if (sig.pk) {
      h.push(`pk=${sig.pk}`)
    }
    return h.join(',')
  }
}

export function parseParams(params?: RequestParams): Record<string, BasicValue | undefined> {
  if (!params) return {}
  return {
    ...params,
    where: params?.where ? JSON.stringify(params?.where) : undefined,
    sort: params?.sort ? JSON.stringify(params?.sort) : undefined,
  }
}
