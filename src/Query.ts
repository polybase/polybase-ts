import { AxiosInstance } from 'axios'
import { Request, RequestParams } from './types'
import { SubscriptionFn } from './Subscription'
import { toAxiosRequest } from './util'

export type QuerySnapshotRegister<T> = (fn: SubscriptionFn<T>) => void

export class Query<T> {
  id: string
  params: RequestParams
  client: AxiosInstance
  onSnapshotRegister: QuerySnapshotRegister<T>

  constructor (id: string, client: AxiosInstance, onSnapshotRegister: QuerySnapshotRegister<T>) {
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
    const res = await this.client({
      method: 'GET',
      ...toAxiosRequest(this.request()),
    })
    return res.data
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
      params: this.params,
    }
  }
}
