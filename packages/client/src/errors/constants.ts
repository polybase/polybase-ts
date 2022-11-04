export const ERROR_CODES = {
  'invalid-argument': 400,
  'failed-precondition': 400,
  'out-of-range': 400,
  unauthenticated: 401,
  'permission-denied': 403,
  'not-found': 404,
  aborted: 409,
  'already-exists': 409,
  'resource-exhausted': 429,
  cancelled: 499,
  unavailable: 500,
  internal: 500,
  'deadline-exceeded': 504,
}

export const ERROR_REASONS: Record<string, { code?: keyof typeof ERROR_CODES, message: string }> = {
  'not-found': { code: 'not-found', message: 'Not found' },
  'record-not-found': { code: 'not-found', message: 'Record not found' },
  'server-error': { code: 'internal', message: 'An internal error occured' },
  'request-cancelled': { message: 'Request was cancelled by the client' },
  'unknown-error': { message: 'Unexpected error received' },
  'missing-namespace': { code: 'invalid-argument', message: 'Namespace is required' },
}
