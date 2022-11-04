import { ERROR_CODES, ERROR_REASONS } from './constants'

export interface PolybaseErrorExtra {
  /** Message that can be presented to the user */
  message?: string

  /** The status code or error group */
  code?: keyof typeof ERROR_CODES

  /** Status code */
  statusCode?: number

  /** Data that can be presented to the user */
  data?: any

  /** Original error message before normalization */
  originalError?: Error
}

export class PolybaseError extends Error {
  reason: keyof typeof ERROR_REASONS

  /** The status code or error group */
  code?: keyof typeof ERROR_CODES

  /** Status code */
  statusCode?: number

  /** Data that can be presented to the user */
  data?: any

  /** Original error message before normalization */
  originalError?: Error

  constructor (
    reason: keyof typeof ERROR_REASONS,
    extra?: PolybaseErrorExtra,
  ) {
    super(`${reason} error`)
    Object.setPrototypeOf(this, PolybaseError.prototype)

    this.reason = reason
    this.data = extra?.data

    const { code, message } = ERROR_REASONS[reason] ?? {}

    this.message = extra?.message ?? message
    this.code = code
    this.statusCode = extra?.statusCode
    if (code && !this.statusCode) {
      this.statusCode = ERROR_CODES[code]
    }

    if (extra?.originalError) {
      this.stack = extra.originalError?.stack
      this.originalError = extra.originalError
    }
  }
}
