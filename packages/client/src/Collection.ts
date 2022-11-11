import { CollectionRecord } from './Record'
import { Query } from './Query'
import { Subscription, SubscriptionFn, SubscriptionErrorFn } from './Subscription'
import { Client } from './Client'
import { BasicValue, CollectionMeta, CollectionRecordResponse, CollectionList, QueryWhereOperator, CallArgs } from './types'
import { parse, validateSet } from '@polybase/polylang'
import { validateCallParameters, getCollectionAST } from './util'
import { createError, PolybaseError } from './errors'

export class Collection<T> {
  id: string
  private querySubs: Record<string, Subscription<CollectionList<T>>> = {}
  private recordSubs: Record<string, Subscription<CollectionRecordResponse<T>>> = {}
  private meta?: CollectionMeta
  private validator?: (data: Partial<T>) => Promise<boolean>
  private client: Client

  // TODO: this will be fetched
  constructor (id: string, client: Client) {
    this.id = id
    this.client = client
  }

  load = async () => {
    await Promise.all([
      this.getValidator(),
    ])
  }

  getMeta = async () => {
    try {
      if (this.meta) return this.meta
      const col = new Collection<CollectionMeta>('Collection', this.client)
      const res = await col.record(this.id).get()
      this.meta = res.data
      return this.meta
    } catch (e: any) {
      if (e && typeof e === 'object' && e instanceof PolybaseError) {
        if (e.reason === 'record/not-found') {
          throw createError('collection/not-found')
        }
        throw e
      }
      throw createError('unknown/error', { originalError: e })
    }
  }

  private getValidator = async (): Promise<(data: Partial<T>) => Promise<boolean>> => {
    if (this.validator) return this.validator
    const meta = await this.getMeta()
    const ast = await parse(meta.code)
    this.validator = async (data: Partial<T>) => {
      try {
        await validateSet(getCollectionAST(this.id, ast), data)
        return true
      } catch {
        return false
      }
    }

    return this.validator
  }

  validate = async (data: Partial<T>) => {
    const validator = await this.getValidator()
    return await validator(data)
  }

  create = async (args: CallArgs): Promise<CollectionRecordResponse<T>> => {
    const meta = await this.getMeta()
    const ast = await parse(meta.code)
    validateCallParameters(this.id, 'constructor', ast, args)

    const res = await this.client.request({
      url: `/collections/${encodeURIComponent(this.id)}/records`,
      method: 'POST',
      data: {
        args,
      },
    }).send()

    return res.data
  }

  get = async (): Promise<CollectionList<T>> => {
    const res = await this.client.request({
      url: `/collections/${encodeURIComponent(this.id)}/records`,
      method: 'GET',
    }).send()

    return res.data
  }

  record = (id: string): CollectionRecord<T> => {
    return new CollectionRecord<T>(id, this, this.client, this.onCollectionRecordSnapshotRegister)
  }

  /**
   * @deprecated use .record(id: string)
   */
  doc = (id: string): CollectionRecord<T> => {
    return this.record(id)
  }

  where = (field: string, op: QueryWhereOperator, value: BasicValue): Query<T> => {
    return this.createQuery().where(field, op, value)
  }

  sort = (field: string, direction?: 'asc'|'desc'): Query<T> => {
    return this.createQuery().sort(field, direction)
  }

  limit = (limit: number): Query<T> => {
    return this.createQuery().limit(limit)
  }

  onSnapshot = (fn: SubscriptionFn<CollectionList<T>>) => {
    return this.createQuery().onSnapshot(fn)
  }

  after = (cursor: string): Query<T> => {
    return this.createQuery().after(cursor)
  }

  before = (cursor: string): Query<T> => {
    return this.createQuery().before(cursor)
  }

  key = () => {
    return `collection:${this.id}`
  }

  private createQuery () {
    return new Query<T>(this.id, this.client, this.onQuerySnapshotRegister)
  }

  private onQuerySnapshotRegister = (q: Query<T>, fn: SubscriptionFn<CollectionList<T>>, errFn?: SubscriptionErrorFn) => {
    const k = q.key()
    if (!this.querySubs[k]) {
      this.querySubs[k] = new Subscription<CollectionList<T>>(q.request(), this.client)
    }
    return this.querySubs[k].subscribe(fn, errFn)
  }

  private onCollectionRecordSnapshotRegister = (d: CollectionRecord<T>, fn: SubscriptionFn<CollectionRecordResponse<T>>, errFn?: SubscriptionErrorFn) => {
    const k = d.key()
    if (!this.recordSubs[k]) {
      this.recordSubs[k] = new Subscription<CollectionRecordResponse<T>>(d.request(), this.client)
    }
    return this.recordSubs[k].subscribe(fn, errFn)
  }
}
