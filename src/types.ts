
import { AxiosRequestConfig } from 'axios'
export type BasicValue = string|number|boolean

export interface CollectionDocument<T> {
  block: string
  data: T
}

export interface CollectionMeta {
  id: string
  schema: CollectionMetaSchema
  indexes?: CollectionMetaIndex[]
}

export interface CollectionMetaSchema {
  type: 'object',
  properties: Record<string, CollectionMetaSchemaField>
}

export interface CollectionMetaIndex {
  fields: CollectionMetaIndexField[]
}

export interface CollectionMetaIndexField {
  field: string
  direction?: 'asc'|'desc'
}

export interface CollectionMetaSchemaField {
  type: 'string'|'number'|'boolean'
}

export interface Request {
  url: string
  method: 'GET'|'POST'|'PUT'|'DELETE'
  params?: RequestParams
  data?: any
}

export interface RequestParams {
  limit?: number
  since?: string
  where?: Record<string, BasicValue>
}

export type Sender = (config: AxiosRequestConfig) => Promise<SenderResponse>
export interface SenderResponse {
  status: number
  headers: Record<string, string>
  data: any
}

export type Signer = (address: string, data: string) => Promise<string>
export type Hasher = (str: string) => Promise<string>
