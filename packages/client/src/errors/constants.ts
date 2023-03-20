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

export type ERROR_REASONS =
  'record/not-found'
  | 'index/missing-index'
  | 'constructor/no-id-assigned'
  | 'function/invalidated-id'
  | 'function/not-found'
  | 'function/invalid-args'
  | 'function/invalid-call'
  | 'collection/id-exists'
  | 'collection/invalid-id'
  | 'collection/invalid-schema'

  // Local
  | 'collection/invalid-ast'
  | 'collection/missing-namespace'
  | 'collection/not-found'
  | 'unknown/error'
  | 'request/cancelled'
  | 'request/no-signer'
