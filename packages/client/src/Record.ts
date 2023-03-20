import { Collection } from './Collection'
import { SubscriptionErrorFn, SubscriptionFn } from './Subscription'
import { Client } from './Client'
import { Request, CollectionRecordResponse, CallArgs } from './types'
import { decodeBase64, getCollectionProperties, serializeValue } from './util'

export type CollectionRecordSnapshotRegister<T> = (d: CollectionRecord<T>, fn: SubscriptionFn<CollectionRecordResponse<T>>, errFn?: SubscriptionErrorFn) => (() => void)

export type CollectionRecordReference = {
  collectionId: string
  id: string
}

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
    const isCallPubliclyAccessible = await this.collection.isCallPubliclyAccessible(functionName)

    const res = await this.client.request({
      url: `/collections/${encodeURIComponent(this.collection.id)}/records/${encodeURIComponent(this.id)}/call/${encodeURIComponent(functionName)}`,
      method: 'POST',
      data: {
        args: args.map(serializeValue),
      },
    }).send(isCallPubliclyAccessible ? 'optional' : 'required')

    deserializeRecord(res.data.data, getCollectionProperties(this.collection.id, ast))

    return res.data
  }

  get = async (): Promise<CollectionRecordResponse<T>> => {
    const isReadPubliclyAccessible = await this.collection.isReadPubliclyAccessible()
    const sixtyMinutes = 60 * 60 * 1000
    const res = await this.client.request(this.request()).send(isReadPubliclyAccessible ? 'none' : 'required', sixtyMinutes)

    // Without this, we would be infinitely recursing, trying to get the meta of Collection
    if (this.collection.id !== 'Collection') {
      const meta = await this.collection.getMeta()
      const ast = JSON.parse(meta.ast)
      deserializeRecord(res.data.data, getCollectionProperties(this.collection.id, ast))
    }

    return res.data
  }

  reference = (): CollectionRecordReference => ({
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

export function deserializeRecord(data: Record<string, any>, properties: { name: string, type: any; fields?: any }[]) {
  if (!data) return

  for (const property of properties) {
    switch (property.type.kind) {
      case 'primitive':
        switch (property.type.value) {
          case 'bytes':
            if (property.name in data) {
              data[property.name] = decodeBase64(data[property.name])
            }
        }
        break
      case 'object':
        deserializeRecord(data[property.name], property.type.fields)
        break
    }
  }
}
