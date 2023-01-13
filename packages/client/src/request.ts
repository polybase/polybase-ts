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
}
