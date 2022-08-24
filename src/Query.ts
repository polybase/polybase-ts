import { Client } from './Client'
import { SubscriptionFn, SubscriptionErrorFn } from './Subscription'
import { Request, RequestParams, CollectionDocument } from './types'

export type QuerySnapshotRegister<T> = (q: Query<T>, fn: SubscriptionFn<T[]>, errFn?: SubscriptionErrorFn) => (() => void)

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

  // TODO:
  // sort = async (field: string, direction: 'asc'|'desc') => {

  // }

  limit = (limit: number) => {
    this.params.limit = limit
    return this
  }

  where = (field: string, op: '==', value: string|number|boolean) => {
    if (!this.params.where) this.params.where = {}
    this.params.where[field] = value
    return this
  }

  get = async (): Promise<CollectionDocument<T>[]> => {
    // Activate query
    const res = await this.client.request(this.request()).send()
    return res.data?.data
  }

  // TODO: validate query has required indexes
  validate = () => {}

  key = () => {
    return `query:${this.id}?${JSON.stringify(this.params)}`
  }

  onSnapshot = (fn: SubscriptionFn<T[]>, errFn?: SubscriptionErrorFn) => {
    return this.onSnapshotRegister(this, fn, errFn)
  }

  request = (): Request => {
    return {
      url: `/${this.id}`,
      method: 'GET',
      params: this.params,
    }
  }
}
