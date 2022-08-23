import Ajv, { ValidateFunction } from 'ajv'
import { Doc } from './Doc'
import { Query } from './Query'
import { Subscription, SubscriptionFn } from './Subscription'
import { Client } from './Client'
import { BasicValue, CollectionMeta } from './types'

export class Collection<T = any> {
  id: string
  private querySubs: Record<string, Subscription<T[]>> = {}
  private docSubs: Record<string, Subscription<T>> = {}
  private meta?: CollectionMeta
  private validator?: ValidateFunction<T>
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
      const res = await this.client.request({
        url: `/$collections/${this.id}`,
        method: 'GET',
      }).send()
      this.meta = res.data
      return res.data
    } catch (e) {
      // TODO: handle missing collection
      throw new Error('Unable to fetch metadata')
    }
  }

  private getValidator = async (): Promise<ValidateFunction<T>> => {
    if (this.validator) return this.validator
    const meta = await this.getMeta()
    const ajv = new Ajv()
    const v = ajv.compile<T>(meta.schema)
    this.validator = v
    return v
  }

  validate = async (data: T) => {
    const validator = await this.getValidator()
    return validator(data)
  }

  get = async () => {
    const res = await this.client.request({
      url: `/${this.id}`,
      method: 'GET',
    }).send()

    return res.data
  }

  doc = (id: string): Doc<T> => {
    const d = new Doc<T>(id, this, this.client, (fn) => {
      this.onDocSnapshotRegister(d, fn)
    })
    return d
  }

  where = (field: string, op: '==', value: BasicValue): Query<T[]> => {
    return this.createQuery().where(field, op, value)
  }

  limit = (limit: number): Query<T[]> => {
    return this.createQuery().limit(limit)
  }

  onSnapshot = (fn: SubscriptionFn<T[]>) => {
    this.createQuery().onSnapshot(fn)
  }

  private createQuery () {
    const q = new Query<T[]>(this.id, this.client, (fn) => {
      this.onQuerySnapshotRegister(q, fn)
    })
    return q
  }

  private onQuerySnapshotRegister = (q: Query<T[]>, fn: SubscriptionFn<T[]>) => {
    const k = q.key()
    if (!this.querySubs[k]) {
      this.querySubs[k] = new Subscription<T[]>(q.request(), this.client)
    }
    this.querySubs[k].subscribe(fn)
  }

  private onDocSnapshotRegister = (d: Doc<T>, fn: SubscriptionFn<T>) => {
    const k = d.key()
    if (!this.docSubs[k]) {
      this.docSubs[k] = new Subscription<T>(d.request(), this.client)
    }
    this.docSubs[k].subscribe(fn)
  }

  // private onDocSnapshotRegister = (doc: Doc<T[]>) => {
  //   const k = doc.key()
  //   const sub =
  // }
}
