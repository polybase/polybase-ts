import { AxiosError } from 'axios'
import { ERROR_CODES, ERROR_REASONS } from './constants'
import { PolybaseError, PolybaseErrorExtra } from './PolybaseError'

export function createError (reason: ERROR_REASONS, extra?: PolybaseErrorExtra) {
  return new PolybaseError(reason, extra)
}

export function wrapError (err: any) {
  return createError(err?.reason ?? 'unknown-error', { originalError: err, message: err?.message })
}

export interface ErrorResponseData {
  error: {
    message: string
    reason: string
    code: string
  }
}

export function createErrorFromAxiosError (err: AxiosError) {
  const data = err.response?.data as ErrorResponseData|undefined
  const e = createError((data?.error?.reason ?? 'unknown/error') as ERROR_REASONS, {
    message: data?.error?.message,
    code: data?.error?.code as keyof typeof ERROR_CODES,
    statusCode: err.response?.status,
    originalError: err,
  })
  return e
}
