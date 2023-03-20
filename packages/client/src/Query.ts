import { Client } from './Client'
import { Collection } from './Collection'
import { CollectionRecord, deserializeRecord } from './Record'
import { SubscriptionFn, SubscriptionErrorFn } from './Subscription'
import {
  Request,
  RequestParams,
  QueryValue,
  QueryWhereOperator,
  QueryWhereKey,
  CollectionList,
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
  private onSnapshotRegister: QuerySnapshotRegister<T>

  constructor(collection: Collection<T>, client: Client, onSnapshotRegister: QuerySnapshotRegister<T>) {
    this.params = {}
    this.collection = collection
    this.client = client
    this.onSnapshotRegister = onSnapshotRegister
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

    const res = await this.client.request(this.request()).send(isReadPubliclyAccessible ? 'none' : 'required', sixtyMinutes)

    const meta = await this.collection.getMeta()
    const ast = JSON.parse(meta.ast)
    for (const record of (res.data?.data ?? [])) {
      deserializeRecord(record.data, getCollectionProperties(this.collection.id, ast))
    }

    return {
      data: res.data?.data,
      cursor: res.data?.cursor,
    }
  }

  // TODO: validate query has required indexes
  validate = () => { }

  key = () => {
    return `query:${this.collection.id}?${JSON.stringify(this.params)}`
  }

  onSnapshot = (fn: SubscriptionFn<CollectionList<T>>, errFn?: SubscriptionErrorFn) => {
    return this.onSnapshotRegister(this, fn, errFn)
  }

  request = (): Request => {
    return {
      url: `/collections/${encodeURIComponent(this.collection.id)}/records`,
      method: 'GET',
      params: this.params,
    }
  }

  clone = (): Query<T> => {
    const q = new Query<T>(this.collection, this.client, this.onSnapshotRegister)
    q.params = {
      ...this.params,
      sort: this.params.sort ? [...this.params.sort] : undefined,
      where: this.params.where ? { ...this.params.where } : undefined,
    }
    return q
  }
}
