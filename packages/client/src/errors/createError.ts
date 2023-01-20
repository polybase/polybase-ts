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

export function createErrorFromFetchError (err: globalThis.Error) {
  const e = createError((err.message ?? 'unknown/error') as ERROR_REASONS, {
    message: err.message,
    code: err.message as keyof typeof ERROR_CODES,
    originalError: err,
  })
  return e
}
