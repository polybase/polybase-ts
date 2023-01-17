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
    body: JSON.stringify(data),
  })
  const body = await res.json()
  const resHeaders = Object.fromEntries(res.headers.entries())
  const response: SenderResponse = {
    status: res.status,
    headers: resHeaders as Record<string, string>,
    data: body,
  }

  return response
}
