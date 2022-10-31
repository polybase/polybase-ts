import { parse } from '@polybase/polylang'
import { Collection } from './Collection'
import { SubscriptionErrorFn, SubscriptionFn } from './Subscription'
import { Client } from './Client'
import { Request, CollectionDocument } from './types'
import { validateCallParameters } from './util'

export type DocSnapshotRegister<T> = (d: Doc<T>, fn: SubscriptionFn<CollectionDocument<T>>, errFn?: SubscriptionErrorFn) => (() => void)

export class Doc<T> {
  id: string
  private collection: Collection<T>
  private client: Client
  private onSnapshotRegister: DocSnapshotRegister<T>

  constructor (id: string, collection: Collection<T>, client: Client, onSnapshotRegister: DocSnapshotRegister<T>) {
    this.id = id
    this.collection = collection
    this.client = client
    this.onSnapshotRegister = onSnapshotRegister
  }

  // delete = async (): Promise<CollectionDocument<T>> => {
  //   const res = await this.client.request({
  //     ...this.request(),
  //     method: 'DELETE',
  //   }).send()
  //   return res.data
  // }

  call = async (functionName: string, args: (string | number | Doc<any>)[] = [], pk?: string): Promise<CollectionDocument<T>> => {
    const meta = await this.collection.getMeta()
    const ast = await parse(meta.code)
    validateCallParameters(this.collection.id, functionName, ast, args)

    const res = await this.client.request({
      url: `/contracts/${encodeURIComponent(this.collection.id)}/${encodeURIComponent(this.id)}/call/${encodeURIComponent(functionName)}`,
      method: 'POST',
      data: {
        args: args.map(arg => {
          if (arg instanceof Doc) {
            return { id: arg.id }
          }

          return arg
        }),
      },
    }).send(pk ? true : undefined)

    return res.data
  }

  get = async (): Promise<CollectionDocument<T>> => {
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
    url: `/contracts/${encodeURIComponent(this.collection.id)}/${encodeURIComponent(this.id)}`,
    method: 'GET',
  })
}
