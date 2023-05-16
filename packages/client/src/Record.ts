import { Collection } from './Collection'
import { SubscriptionErrorFn, SubscriptionFn } from './Subscription'
import { CollectionRecordSnapshotRegister, Request, CallArgs, SenderRawRecordResponse, Block } from './types'
import { Client } from './Client'
import { PolybaseError } from './errors'
import { getCollectionProperties, deserializeRecord, serializeValue } from './util'
import { Collection as ASTCollection } from '@polybase/polylang/dist/ast'

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

  call = async (functionName: string, args: CallArgs = []): Promise<CollectionRecordResponse<T, T | null>> => {
    const ast = await this.collection.getAST()
    const isCallPubliclyAccessible = await this.collection.isCallPubliclyAccessible(functionName)

    const res = await this.client.request({
      url: `/collections/${encodeURIComponent(this.collection.id)}/records/${encodeURIComponent(this.id)}/call/${encodeURIComponent(functionName)}`,
      method: 'POST',
      data: {
        args: args.map(serializeValue),
      },
    }).send<SenderRawRecordResponse<T | null>>(isCallPubliclyAccessible ? 'optional' : 'required')

    return new CollectionRecordResponse(this.id, res.data, ast, this.collection, this.client, this.onSnapshotRegister)
  }

  get = async (): Promise<CollectionRecordResponse<T, T | null>> => {
    const ast = await this.collection.getAST()
    const isReadPubliclyAccessible = await this.collection.isReadPubliclyAccessible()
    const sixtyMinutes = 60 * 60 * 1000

    try {
      const res = await this.client.request(this.request())
        .send<SenderRawRecordResponse<T | null>>(isReadPubliclyAccessible ? 'none' : 'required', sixtyMinutes)
      return new CollectionRecordResponse<T, T | null>(this.id, res.data, ast, this.collection, this.client, this.onSnapshotRegister)
    } catch (err) {
      if (err instanceof PolybaseError && err.reason === 'record/not-found') {
        return new CollectionRecordResponse<T, T | null>(this.id, { data: null, block: null }, ast, this.collection, this.client, this.onSnapshotRegister)
      }
      throw err
    }
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

export class CollectionRecordResponse<T, NT extends T | null = T> extends CollectionRecord<T> {
  data: NT
  block: Block

  constructor(id: string, response: SenderRawRecordResponse, ast: ASTCollection, collection: Collection<T>, client: Client, onSnapshotRegister: CollectionRecordSnapshotRegister<T>) {
    super(id, collection, client, onSnapshotRegister)
    const { data, block } = response
    deserializeRecord(data as any, getCollectionProperties(ast)) as NT
    this.data = data
    this.block = block
  }

  exists = (): this is CollectionRecordResponse<NonNullable<T>> => {
    return this.data !== null
  }

  toJSON = () => {
    return {
      data: this.data,
      block: this.block,
    }
  }
}

/**
 * @deprecated use CollectionRecord
 */
export const Doc = CollectionRecord
