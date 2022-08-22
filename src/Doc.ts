import { AxiosInstance } from 'axios'
import { Collection } from './Collection'
import { SubscriptionFn } from './Subscription'
import { Request } from './types'
import { toAxiosRequest } from './util'

export type DocSnapshotRegister<T> = (fn: SubscriptionFn<T>) => void

export class Doc<T> {
  private id: string
  private collection: Collection
  private client: AxiosInstance
  private onSnapshotRegister: DocSnapshotRegister<T>

  constructor (id: string, collection: Collection, client: AxiosInstance, onSnapshotRegister: DocSnapshotRegister<T>) {
    this.id = id
    this.collection = collection
    this.client = client
    this.onSnapshotRegister = onSnapshotRegister
  }

  delete = async () => {
    const res = await this.client({
      ...this.request(),
      method: 'DELETE',
    })
    return res.data
  }

  set = async (data: T) => {
    // TODO: check validatoon results
    const isValid = await this.collection.validate(data)
    if (!isValid) {
      throw new Error('doc is not valid')
    }

    const res = await this.client({
      ...toAxiosRequest(this.request()),
      method: 'PUT',
      data,
    })

    return res.data
  }

  get = async () => {
    const res = await this.client({
      ...toAxiosRequest(this.request()),
      method: 'GET',
    })

    return res.data
  }

  key = () => {
    return `doc:${this.collection.id}/${this.id}`
  }

  onSnapshot = (fn: SubscriptionFn<T>) => {
    this.onSnapshotRegister(fn)
  }

  request = (): Request => ({
    url: `/${this.collection.id}/${this.id}`,
    params: {},
  })
}
