import { Client } from './Client'
import { Collection } from './Collection'
import { CollectionRecord, CollectionRecordResponse, deserializeRecord } from './Record'
import { SubscriptionFn, SubscriptionErrorFn } from './Subscription'
import {
  Request,
  RequestParams,
  QueryValue,
  QueryWhereOperator,
  QueryWhereKey,
  CollectionList,
  CollectionRecordSnapshotRegister,
  SenderRawListResponse,
} from './types'
import { getCollectionProperties } from './util'

export type QuerySnapshotRegister<T> = (q: Query<T>, fn: SubscriptionFn<CollectionList<T>>, errFn?: SubscriptionErrorFn) => (() => void)

export const QueryWhereOperatorMap: Record<QueryWhereOperator, QueryWhereKey> = {
  '>': '$gt',
  '<': '$lt',
  '>=': '$gte',
  '<=': '$lte',
  '==': '$eq',
}

export class Query<T> {
  collection: Collection<T>
  private params: RequestParams
  private client: Client
  private onQuerySnapshotRegister: QuerySnapshotRegister<T>
  private onRecordSnapshotRegister: CollectionRecordSnapshotRegister<T>

  constructor(collection: Collection<T>, client: Client, onQuerySnapshotRegister: QuerySnapshotRegister<T>, onRecordSnapshotRegister: CollectionRecordSnapshotRegister<T>) {
    this.params = {}
    this.collection = collection
    this.client = client
    this.onQuerySnapshotRegister = onQuerySnapshotRegister
    this.onRecordSnapshotRegister = onRecordSnapshotRegister
  }

  sort = (field: string, direction?: 'asc' | 'desc') => {
    const q = this.clone()

    if (!q.params.sort) q.params.sort = []
    q.params.sort.push([field, direction ?? 'asc'])
    return q
  }

  limit = (limit: number) => {
    const q = this.clone()

    q.params.limit = limit
    return q
  }

  after = (after: string) => {
    this.params.after = after
    return this
  }

  before = (before: string) => {
    this.params.before = before
    return this
  }

  where = (field: string, op: QueryWhereOperator, value: QueryValue) => {
    const q = this.clone()

    const referencedValue =
      value instanceof CollectionRecord
        ? value.reference()
        : value

    if (!q.params.where) q.params.where = {}
    q.params.where[field] = op === '=='
      ? referencedValue
      : { [QueryWhereOperatorMap[op]]: referencedValue } as Record<QueryWhereKey, QueryValue>
    return q
  }

  get = async (): Promise<CollectionList<T>> => {
    const isReadPubliclyAccessible = await this.collection.isReadPubliclyAccessible()
    const sixtyMinutes = 60 * 60 * 1000

    const res = await this.client.request(this.request())
      .send<SenderRawListResponse<T>>(isReadPubliclyAccessible ? 'none' : 'required', sixtyMinutes)

    const { data, cursor } = res.data
    const meta = await this.collection.getMeta()
    const ast = JSON.parse(meta.ast)

    return {
      data: data.map((record) => {
        deserializeRecord(record.data as any, getCollectionProperties(this.collection.id, ast))
        return new CollectionRecordResponse(this.collection.id, record.data, record.block, this.collection, this.client, this.onRecordSnapshotRegister)
      }),
      cursor,
    }
  }

  // TODO: validate query has required indexes
  validate = () => { }

  key = () => {
    return `query:${this.collection.id}?${JSON.stringify(this.params)}`
  }

  onSnapshot = (fn: SubscriptionFn<CollectionList<T>>, errFn?: SubscriptionErrorFn) => {
    return this.onQuerySnapshotRegister(this, fn, errFn)
  }

  request = (): Request => {
    return {
      url: `/collections/${encodeURIComponent(this.collection.id)}/records`,
      method: 'GET',
      params: this.params,
    }
  }

  clone = (): Query<T> => {
    const q = new Query<T>(this.collection, this.client, this.onQuerySnapshotRegister, this.onRecordSnapshotRegister)
    q.params = {
      ...this.params,
      sort: this.params.sort ? [...this.params.sort] : undefined,
      where: this.params.where ? { ...this.params.where } : undefined,
    }
    return q
  }
}
