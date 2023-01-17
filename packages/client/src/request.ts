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
}
