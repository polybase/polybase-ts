import { AxiosError } from 'axios'
import { ERROR_CODES } from './constants'
import { SpacetimeError, SpacetimeErrorExtra } from './SpacetimeError'

export function createError (reason: string, extra: SpacetimeErrorExtra) {
  return new SpacetimeError(reason, extra)
}

export interface ErrorResponseData {
  message: string
  reason: string
  code: string
}

export function createErrorFromAxiosError (err: AxiosError) {
  const data = err.response?.data as ErrorResponseData
  const e = createError(data.reason, {
    message: data?.message,
    code: data?.code as keyof typeof ERROR_CODES,
    statusCode: err.response?.status,
    originalError: err,
  })
  return e
}
