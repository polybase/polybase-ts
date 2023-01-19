import { ERROR_REASONS } from './errors'
import { PolybaseError } from './errors/PolybaseError'
import { Request, SenderResponse } from './types'

export interface RequestConfig extends Request {
  baseUrl?: string;
  clientId?: string;
  headers?: Record<string, string>;
}

export async function fetchSender (config: RequestConfig): Promise<SenderResponse> {
  const { baseUrl, clientId, url, method, params, data, headers } = config

  // Format URL
  const urlParams = new URLSearchParams(params as Record<string, string>)
  const urlWithParams = `${baseUrl}${url}?${urlParams.toString()}`

  // Format Request
  const request = new Request(urlWithParams)
  const init = {
    method,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'X-Polybase-Client-ID': clientId ?? 'Polybase',
    },
    body: JSON.stringify(data),
  }

  // Make  Request
  const res = await fetch(request, init)
  const body = await res.json()

  if (!res.ok) throw new PolybaseError(body.error.reason as ERROR_REASONS)
  const resHeaders = Object.fromEntries(res.headers.entries())
  const response: SenderResponse = {
    status: res.status,
    headers: resHeaders as Record<string, string>,
    data: body,
  }

  return response
}
