import { Collection } from './Collection'
import { SubscriptionErrorFn, SubscriptionFn } from './Subscription'
import { Client } from './Client'
import { Request, CollectionDocument } from './types'

export type DocSnapshotRegister<T> = (d: Doc<T>, fn: SubscriptionFn<CollectionDocument<T>>, errFn?: SubscriptionErrorFn) => (() => void)

export class Doc<T> {
  private id: string
  private collection: Collection
  private client: Client
  private onSnapshotRegister: DocSnapshotRegister<T>

  constructor (id: string, collection: Collection, client: Client, onSnapshotRegister: DocSnapshotRegister<T>) {
    this.id = id
    this.collection = collection
    this.client = client
    this.onSnapshotRegister = onSnapshotRegister
  }

  delete = async () => {
    const res = await this.client.request({
      ...this.request(),
      method: 'DELETE',
    }).send()
    return res.data
  }

  set = async (data: T, publicKeys?: string[]): Promise<CollectionDocument<T>> => {
    // TODO: check validatoon results
    const isValid = await this.collection.validate(data)
    if (!isValid) {
      throw new Error('doc is not valid')
    }

    const res = await this.client.request({
      url: `/${encodeURIComponent(this.collection.id)}/${encodeURIComponent(this.id)}`,
      method: 'PUT',
      data: {
        data: {
          ...data,
          $pk: publicKeys?.join(','),
        },
      },
    }).send()

    return res.data
  }

  get = async () => {
    const res = await this.client.request(this.request()).send()
    return res.data
  }

  key = () => {
    return `doc:${this.collection.id}/${this.id}`
  }

  onSnapshot = (fn: SubscriptionFn<CollectionDocument<T>>, errFn?: SubscriptionErrorFn) => {
    return this.onSnapshotRegister(this, fn, errFn)
  }

  request = (): Request => ({
    url: `/${encodeURIComponent(this.collection.id)}/${encodeURIComponent(this.id)}`,
    method: 'GET',
  })
}
