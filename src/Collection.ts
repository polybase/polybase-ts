import Ajv, { ValidateFunction } from 'ajv'
import { AxiosInstance } from 'axios'
import type { Spacetime } from './Spacetime'
import { Doc } from './Doc'
import { Query } from './Query'
import { Subscription, SubscriptionFn } from './Subscription'
import { BasicValue } from './types'

const ajv = new Ajv()

export interface Listener<T> {
  fn: (val: T) => void
}

export interface CollectionMeta {
  schema: any
  indexes: string[]
}

export interface CollectionListQueryParams {
  cursor: string
  limit: number
  where: CollectionListQueryParamsWhere
  sort: CollectionListQueryParamsSort[]
}

interface CollectionListQueryParamsWhere {

}

interface CollectionListQueryParamsSort {
  [key: string]: -1|1
}

export class Collection<T = any> {
  private st: Spacetime
  id: string
  private querySubs: Record<string, Subscription<T[]>> = {}
  private docSubs: Record<string, Subscription<T>> = {}
  private meta: Promise<CollectionMeta>
  private validator: Promise<ValidateFunction<T>>
  private client: AxiosInstance

  // TODO: this will be fetched
  constructor (id: string, st: Spacetime, client: AxiosInstance) {
    this.st = st
    this.id = id
    this.meta = this.getMeta()
    this.validator = this.getValidator()
    this.client = client
  }

  getMeta = async () => {
    if (this.meta) return this.meta
    const res = await this.client({
      url: `/$collections/${this.id}`,
      method: 'GET',
    })
    return res.data
  }

  private getValidator = async (): Promise<ValidateFunction<T>> => {
    if (this.validator) return this.validator
    const meta = await this.getMeta()
    if (!meta) {
      // TODO: handle errors better
      throw new Error('Schema is not defined')
    }
    return ajv.compile<T>(meta.schema)
  }

  validate = async (data: T) => {
    const validator = await this.getValidator()
    return validator(data)
  }

  get = async () => {
    const res = await this.client({
      url: `/${this.id}`,
      method: 'GET',
    })

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
