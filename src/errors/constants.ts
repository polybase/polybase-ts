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

export const ERROR_REASONS: Record<string, { code: keyof typeof ERROR_CODES, message: string }> = {
  'not-found': { code: 'not-found', message: 'Not found' },
  'server-error': { code: 'internal', message: 'An internal error occured' },
}
