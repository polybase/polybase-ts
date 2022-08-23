import { Client, Request, RequestParams } from './Client'
import { SubscriptionFn } from './Subscription'

export type QuerySnapshotRegister<T> = (fn: SubscriptionFn<T>) => void

export class Query<T> {
  id: string
  params: RequestParams
  client: Client
  onSnapshotRegister: QuerySnapshotRegister<T>

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

  get = async () => {
    // Activate query
    const res = await this.client.request({
      ...this.request(),
      method: 'GET',
    }).send()
    return res.data
  }

  // TODO: validate query has required indexes
  validate = () => {

  }

  key = () => {
    return `query:${this.id}?${JSON.stringify(this.params)}`
  }

  onSnapshot = (fn: SubscriptionFn<T>) => {
    this.onSnapshotRegister(fn)
  }

  request = (): Request => {
    return {
      url: `/${this.id}`,
      method: 'GET',
      params: this.params,
    }
  }
}
