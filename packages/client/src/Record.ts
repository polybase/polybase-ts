import { Collection } from './Collection'
import { SubscriptionErrorFn, SubscriptionFn } from './Subscription'
import { Client } from './Client'
import { Request, CollectionRecordResponse, CallArgs } from './types'
import { referenceArg, validateCallParameters } from './util'

export type CollectionRecordSnapshotRegister<T> = (d: CollectionRecord<T>, fn: SubscriptionFn<CollectionRecordResponse<T>>, errFn?: SubscriptionErrorFn) => (() => void)

export class CollectionRecord<T> {
  id: string
  private collection: Collection<T>
  private client: Client
  private onSnapshotRegister: CollectionRecordSnapshotRegister<T>

  constructor(id: string, collection: Collection<T>, client: Client, onSnapshotRegister: CollectionRecordSnapshotRegister<T>) {
    this.id = id
    this.collection = collection
    this.client = client
    this.onSnapshotRegister = onSnapshotRegister
  }

  call = async (functionName: string, args: CallArgs = []): Promise<CollectionRecordResponse<T>> => {
    const meta = await this.collection.getMeta()
    const ast = JSON.parse(meta.ast)
    validateCallParameters(this.collection.id, functionName, ast, args)

    const res = await this.client.request({
      url: `/collections/${encodeURIComponent(this.collection.id)}/records/${encodeURIComponent(this.id)}/call/${encodeURIComponent(functionName)}`,
      method: 'POST',
      data: {
        args: args.map(referenceArg),
      },
    }).send(true)

    return res.data
  }

  get = async (): Promise<CollectionRecordResponse<T>> => {
    const isPubliclyAccessible = await this.collection.isPubliclyAccessible()
    const needsAuth = !isPubliclyAccessible
    const sixtyMinutes = 60 * 60 * 1000
    const res = await this.client.request(this.request()).send(needsAuth, sixtyMinutes)
    return res.data
  }

  reference = (): { collectionId: string, id: string } => ({
    collectionId: this.collection.id,
    id: this.id,
  })

  key = () => {
    return `record:${this.collection.id}/${this.id}`
  }

  onSnapshot = (fn: SubscriptionFn<CollectionRecordResponse<T>>, errFn?: SubscriptionErrorFn) => {
    return this.onSnapshotRegister(this, fn, errFn)
  }

  request = (): Request => ({
    url: `/collections/${encodeURIComponent(this.collection.id)}/records/${encodeURIComponent(this.id)}`,
    method: 'GET',
  })
}

/**
 * @deprecated use CollectionRecord
 */
export const Doc = CollectionRecord
