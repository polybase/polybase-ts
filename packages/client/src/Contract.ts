import { Doc } from './Doc'
import { Query } from './Query'
import { Subscription, SubscriptionFn, SubscriptionErrorFn } from './Subscription'
import { Client } from './Client'
import { BasicValue, ContractMeta, ContractDocument, ContractList, QueryWhereOperator, CallArgs } from './types'
import { parse, validateSet } from '@polybase/polylang'
import { validateCallParameters, getContractAST } from './util'

export class Contract<T> {
  id: string
  private querySubs: Record<string, Subscription<ContractList<T>>> = {}
  private docSubs: Record<string, Subscription<ContractDocument<T>>> = {}
  private meta?: ContractMeta
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
      const res = await this.client.request({
        url: `/contracts/$Contract/${encodeURIComponent(this.id)}`,
        method: 'GET',
      }).send()
      this.meta = res.data?.data as ContractMeta
      return this.meta
    } catch (e) {
      // TODO: handle missing contract
      throw new Error('Unable to fetch metadata')
    }
  }

  private getValidator = async (): Promise<(data: Partial<T>) => Promise<boolean>> => {
    if (this.validator) return this.validator

    const meta = await this.getMeta()
    const ast = await parse(meta.code)
    this.validator = async (data: Partial<T>) => {
      try {
        await validateSet(getContractAST(this.id, ast), data)
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

  create = async (args: CallArgs, pk?: string): Promise<ContractDocument<T>> => {
    const meta = await this.getMeta()
    const ast = await parse(meta.code)
    validateCallParameters(this.id, 'constructor', ast, args)

    const res = await this.client.request({
      url: `/contracts/${encodeURIComponent(this.id)}`,
      method: 'POST',
      data: {
        args,
      },
    }).send(pk ? true : undefined)

    return res.data
  }

  get = async (): Promise<ContractList<T>> => {
    const res = await this.client.request({
      url: `/contracts/${encodeURIComponent(this.id)}`,
      method: 'GET',
    }).send()

    return res.data
  }

  doc = (id: string): Doc<T> => {
    return new Doc<T>(id, this, this.client, this.onDocSnapshotRegister)
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

  onSnapshot = (fn: SubscriptionFn<ContractList<T>>) => {
    return this.createQuery().onSnapshot(fn)
  }

  after = (cursor: string): Query<T> => {
    return this.createQuery().after(cursor)
  }

  before = (cursor: string): Query<T> => {
    return this.createQuery().before(cursor)
  }

  key = () => {
    return `contract:${this.id}`
  }

  private createQuery () {
    return new Query<T>(this.id, this.client, this.onQuerySnapshotRegister)
  }

  private onQuerySnapshotRegister = (q: Query<T>, fn: SubscriptionFn<ContractList<T>>, errFn?: SubscriptionErrorFn) => {
    const k = q.key()
    if (!this.querySubs[k]) {
      this.querySubs[k] = new Subscription<ContractList<T>>(q.request(), this.client)
    }
    return this.querySubs[k].subscribe(fn, errFn)
  }

  private onDocSnapshotRegister = (d: Doc<T>, fn: SubscriptionFn<ContractDocument<T>>, errFn?: SubscriptionErrorFn) => {
    const k = d.key()
    if (!this.docSubs[k]) {
      this.docSubs[k] = new Subscription<ContractDocument<T>>(d.request(), this.client)
    }
    return this.docSubs[k].subscribe(fn, errFn)
  }
}
