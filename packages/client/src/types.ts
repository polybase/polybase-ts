
import { AxiosRequestConfig } from 'axios'
import { CollectionRecord, CollectionRecordReference, CollectionRecordResponse } from './Record'
import { SubscriptionFn, SubscriptionErrorFn } from './Subscription'
export type QueryValue = string | number | boolean | PublicKey | CollectionRecord<any> | CollectionRecordReference

export type CollectionRecordSnapshotRegister<T> = (d: CollectionRecord<T>, fn: SubscriptionFn<CollectionRecordResponse<T>>, errFn?: SubscriptionErrorFn) => (() => void)

export interface CollectionList<T> {
  data: CollectionRecordResponse<T>[]
  cursor: {
    after: string
    before: string
  }
}

export interface CollectionMeta {
  id: string
  name: string
  code: string
  ast: string
  lastRecordUpdated?: string
  publicKey?: PublicKey
}

export interface Request {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: RequestParams
  data?: any
}

export interface RequestParams {
  limit?: number
  after?: string
  before?: string
  since?: string
  waitFor?: string
  where?: Record<string, QueryWhereValue>
  sort?: [string, 'asc' | 'desc'][]
}

export type QueryWhereValue = QueryValue | Record<QueryWhereKey, QueryValue>
export type QueryWhereKey = '$lt' | '$gt' | '$gte' | '$lte' | '$eq'
export type QueryWhereOperator = '==' | '>' | '<' | '>=' | '<='

export type Sender = (config: AxiosRequestConfig) => Promise<SenderResponse>
export interface SenderResponse<T = any> {
  status: number
  headers: Record<string, string>
  data: T
}

export interface SenderRawRecordResponse<T = any> {
  data: T
  block: Block
}

export interface SenderRawListResponse<T = any> {
  data: SenderRawRecordResponse<T>[]
  cursor: {
    after: string
    before: string
  }
}

export type Signer = (data: string, req: Request) => Promise<SignerResponse | null> | SignerResponse | null

export interface SignerResponse {
  h: 'eth-personal-sign'
  sig: string
  pk?: string
}

interface Map {
  [k: string | number]: FieldTypes
}

export type FieldTypes =
  string
  | number
  | boolean
  | Map
  | Uint8Array
  | FieldTypes[]

export type CallArg = FieldTypes | CollectionRecord<any> | CollectionRecord<any>[]

export type CallArgs = CallArg[]

export type Block = {
  hash: string
} | null

export interface PublicKey {
  alg: string,
  crv: string
  kty: string,
  use: string,
  x: string
  y: string
}
