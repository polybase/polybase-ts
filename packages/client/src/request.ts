<<<<<<< HEAD
import { createError, PolybaseError } from './errors'
import { Request, SenderResponse } from './types'

export interface RequestConfig extends Request {
  baseUrl?: string;
  clientId?: string;
  headers?: Record<string, string>;
}

export async function fetchSender (config: RequestConfig): Promise<SenderResponse> {
  const { baseUrl, clientId, url, method, params, data, headers } = config
  const urlParams = new URLSearchParams(params as Record<string, string>)
  const urlWithParams = `${baseUrl}${url}?${urlParams.toString()}`
  const res = await fetch(urlWithParams, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Polybase-Client-ID': clientId ?? 'Polybase',
      ...headers,
    },
    body: data,
  })
  //   if (res.status >= 400) {
  //     const body = await res.json()
  //     createError(body.error.reason, body.error.message)
  //   }
  const body = await res.json()
  return {
    status: res.status,
    data: body,
    headers: res.headers as unknown as Record<string, string>,
  } as SenderResponse
=======
import { ClientConfig } from './Client'
import { createError, ErrorResponseData, ERROR_CODES, ERROR_REASONS, PolybaseError } from './errors'
import { Request, SenderResponse } from './types'

export async function makeFetchRequest (req: Request, config?: ClientConfig): Promise<SenderResponse> {
  const request: globalThis.RequestInit = {
    body: req.data,
    headers: {
      'X-Polybase-Client': config?.clientId ?? 'Polybase',
      ...req.headers,
    },
    method: req.method,
  }

  const res = await fetch(req.url, request).then(async res => {
    if (res.status >= 400) {
      const err = await res.json() as ErrorResponseData

      if (err.error.code === 'ERR_CANCELED') {
        throw createError('request/cancelled')
      }
      throw new PolybaseError(err.error.reason as ERROR_REASONS, {
        message: err.error.message,
        code: err.error.code as keyof typeof ERROR_CODES,
        statusCode: res.status,
      })
    }
    const senderResponse: SenderResponse = {
      status: res.status,
      headers: req.headers as Record<string, string>,
      data: res.json(),
    }
    return senderResponse
  }).catch(err => {
    throw err
  })

  return res
>>>>>>> b85ade9 (Replace  axios with fetch)
}
