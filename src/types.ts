export interface Request {
  url: string
  params: RequestParams
}

export interface RequestParams {
  limit?: number
  since?: string
  where?: Record<string, BasicValue>
}

export type BasicValue = string|number|boolean
