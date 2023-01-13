
import { AxiosRequestConfig } from 'axios'
import { CollectionRecord } from './Record'
export type BasicValue = string|number|boolean

export interface CollectionRecordResponse<T> {
  block: string
  data: T
  publicKeys: string[]
}

export interface CollectionList<T> {
  data: CollectionRecordResponse<T>[]
  cursor: {
    after: string
    before: string
  }
}

export interface CollectionMeta {
  id: string
  code: string
  lastRecordUpdated?: string
  publicKey?: string
}

export interface Request {
  url: string
  method: 'GET'|'POST'|'PUT'|'DELETE'
  params?: RequestParams
  data?: any
  headers?: Record<string, string>
}

export interface RequestParams {
  limit?: number
  after?: string
  before?: string
  since?: string
  waitFor?: string
  where?: Record<string, QueryWhereValue>
  sort?: [string, 'asc'|'desc'][]
}

export type QueryWhereValue = BasicValue|Record<QueryWhereKey, BasicValue>
export type QueryWhereKey = '$lt'|'$gt'|'$gte'|'$lte'|'$eq'
export type QueryWhereOperator = '=='|'>'|'<'|'>='|'<='

export type Sender = () => Promise<SenderResponse>
export interface SenderResponse {
  status: number
  headers: Headers
  data: any
}

export type Signer = (data: string, req: Request) => Promise<SignerResponse|null>|SignerResponse|null

export interface SignerResponse {
  h: 'eth-personal-sign'
  sig: string
  pk?: string
}

interface Map {
  [k: string | number]: FieldTypes
}

type FieldTypes =
  string
  | number
  | boolean
  | string[]
  | number[]
  | boolean[]
  | Map

export type CallArg = FieldTypes | CollectionRecord<any>

export type CallArgs = CallArg[]
