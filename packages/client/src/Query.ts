import { Client } from './Client'
import { SubscriptionFn, SubscriptionErrorFn } from './Subscription'
import {
  Request,
  RequestParams,
  CollectionDocument,
  BasicValue,
  QueryWhereOperator,
  QueryWhereKey,
} from './types'

export type QuerySnapshotRegister<T> = (q: Query<T>, fn: SubscriptionFn<CollectionDocument<T>[]>, errFn?: SubscriptionErrorFn) => (() => void)

export const QueryWhereOperatorMap: Record<QueryWhereOperator, QueryWhereKey> = {
  '>': '$gt',
  '<': '$lt',
  '>=': '$gte',
  '<=': '$lte',
  '==': '$eq',
}

export class Query<T> {
  private id: string
  private params: RequestParams
  private client: Client
  private onSnapshotRegister: QuerySnapshotRegister<T>

  constructor (id: string, client: Client, onSnapshotRegister: QuerySnapshotRegister<T>) {
    this.id = id
    this.params = {}
    this.client = client
    this.onSnapshotRegister = onSnapshotRegister
  }

  sort = (field: string, direction?: 'asc'|'desc') => {
    if (!this.params.sort) this.params.sort = []
    this.params.sort.push([field, direction ?? 'asc'])
    return this
  }

  limit = (limit: number) => {
    this.params.limit = limit
    return this
  }

  where = (field: string, op: QueryWhereOperator, value: string|number|boolean) => {
    if (!this.params.where) this.params.where = {}
    this.params.where[field] = op === '=='
      ? value
      : { [QueryWhereOperatorMap[op]]: value } as Record<QueryWhereKey, BasicValue>
    return this
  }

  get = async (): Promise<CollectionDocument<T>[]> => {
    const res = await this.client.request(this.request()).send()
    return res.data?.data
  }

  // TODO: validate query has required indexes
  validate = () => {}

  key = () => {
    return `query:${this.id}?${JSON.stringify(this.params)}`
  }

  onSnapshot = (fn: SubscriptionFn<CollectionDocument<T>[]>, errFn?: SubscriptionErrorFn) => {
    return this.onSnapshotRegister(this, fn, errFn)
  }

  request = (): Request => {
    return {
      url: `/${encodeURIComponent(this.id)}`,
      method: 'GET',
      params: this.params,
    }
  }
}
