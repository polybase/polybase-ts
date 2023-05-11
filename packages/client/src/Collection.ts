import { CollectionRecord, deserializeRecord, CollectionRecordResponse } from './Record'
import { Query } from './Query'
import { Subscription, SubscriptionFn, SubscriptionErrorFn } from './Subscription'
import { Client } from './Client'
import { QueryValue, CollectionMeta, CollectionList, QueryWhereOperator, CallArgs, SenderRawListResponse, SenderRawRecordResponse } from './types'
import { validateSet } from '@polybase/polylang/dist/validator'
import { getCollectionAST, getCollectionProperties, serializeValue } from './util'
import { createError, PolybaseError } from './errors'
import { Root as ASTRoot, Collection as ASTCollection, Method as ASTMethod, Directive as ASTDirective } from './ast'

export class Collection<T> {
  id: string
  private querySubs: Record<string, Subscription<CollectionList<T>>> = {}
  private recordSubs: Record<string, Subscription<CollectionRecordResponse<T>>> = {}
  private meta?: CollectionMeta
  private validator?: (data: Partial<T>) => Promise<boolean>
  private client: Client
  private astCache?: ASTCollection

  // TODO: this will be fetched
  constructor(id: string, client: Client) {
    this.id = id
    this.client = client
  }

  load = async () => {
    await Promise.all([
      this.getValidator(),
    ])
  }

  getMeta = async (): Promise<CollectionMeta> => {
    if (this.meta) return this.meta
    const col = new Collection<CollectionMeta>('Collection', this.client)
    const res = await col.record(this.id).get()
    if (!res.exists()) {
      throw new PolybaseError('collection/not-found', {
        message: `Collection ${this.id} does not exist`,
      })
    }
    this.meta = res.data
    return this.meta
  }

  private name(): string {
    return this.id.split('/').pop() as string // there is always at least one element from split
  }

  private getCollectionAST = async (): Promise<ASTCollection> => {
    // Return cached value if it exists
    if (this.astCache) return this.astCache
    const meta = await this.getMeta()
    const ast = JSON.parse(meta.ast) as ASTRoot
    const collectionAST = ast.find((node) => node.kind === 'collection' && node.name === this.name())
    if (!collectionAST) throw createError('collection/invalid-ast')
    this.astCache = collectionAST
    return collectionAST
  }

  private getValidator = async (): Promise<(data: Partial<T>) => Promise<boolean>> => {
    if (this.validator) return this.validator
    const meta = await this.getMeta()
    const ast = JSON.parse(meta.ast)
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

  isReadPubliclyAccessible = async (): Promise<boolean> => {
    // Without this, we would recursively call this function
    if (this.id === 'Collection') return true

    return this.isCollectionPubliclyAccessible('read')
  }

  isCallPubliclyAccessible = async (methodName: string) => {
    // Without this, we would recursively call this function
    if (this.id === 'Collection') return true

    const colAST = await this.getCollectionAST()

    // Find the method in the AST
    const methodAST = colAST.attributes.find((attr) => attr.kind === 'method' && attr.name === methodName) as ASTMethod | undefined
    if (!methodAST) throw createError('function/not-found')

    // Do we have any call directives with restrictions
    const methodDirectives = methodAST?.attributes.filter((attr) => attr.kind === 'directive' && attr.name === 'call') as ASTDirective[]
    // Method has @call directives with arguments/restrictions
    if (methodDirectives.some((attr) => attr.arguments.length > 0)) return false
    // Method has @call any
    else if (methodDirectives.length > 0) return true

    // Otherwise check the root of the collection
    return this.isCollectionPubliclyAccessible('call')
  }

  private isCollectionPubliclyAccessible = async (type: 'call' | 'read'): Promise<boolean> => {
    const colAST = await this.getCollectionAST()
    const hasPublicDirective = colAST.attributes.some((attr) => attr.kind === 'directive' && attr.name === 'public')
    const hasTypeDirective = colAST.attributes.some((attr) => attr.kind === 'directive' && attr.name === type && attr.arguments?.length === 0)
    return hasPublicDirective || hasTypeDirective
  }

  create = async (args: CallArgs): Promise<CollectionRecordResponse<T>> => {
    const meta = await this.getMeta()
    const ast = JSON.parse(meta.ast)

    const res = await this.client.request({
      url: `/collections/${encodeURIComponent(this.id)}/records`,
      method: 'POST',
      data: {
        args: args.map(serializeValue),
      },
    }).send<SenderRawRecordResponse<T>>('optional')

    deserializeRecord(res.data.data as Record<string, any>, getCollectionProperties(this.id, ast))

    return new CollectionRecordResponse(this.id, res.data.data, res.data.block, this, this.client, this.onRecordSnapshotRegister)
  }

  get = async (): Promise<CollectionList<T>> => {
    const isPubliclyAccessible = await this.isReadPubliclyAccessible()
    const needsAuth = !isPubliclyAccessible
    const sixtyMinutes = 60 * 60 * 1000

    const res = await this.client.request({
      url: `/collections/${encodeURIComponent(this.id)}/records`,
      method: 'GET',
    }).send<SenderRawListResponse<T>>(needsAuth ? 'required' : 'none', sixtyMinutes)

    const { data, cursor } = res.data
    const meta = await this.getMeta()
    const ast = JSON.parse(meta.ast)

    return {
      cursor,
      data: data.map((record) => {
        deserializeRecord(record.data as any, getCollectionProperties(this.id, ast))
        return new CollectionRecordResponse(this.id, record.data, record.block, this, this.client, this.onRecordSnapshotRegister)
      }),
    }
  }

  record = (id: string): CollectionRecord<T> => {
    return new CollectionRecord<T>(id, this, this.client, this.onRecordSnapshotRegister)
  }

  /**
 * @deprecated use .record(id: string)
 */
  doc = (id: string): CollectionRecord<T> => {
    return this.record(id)
  }

  where = (field: string, op: QueryWhereOperator, value: QueryValue): Query<T> => {
    return this.createQuery().where(field, op, value)
  }

  sort = (field: string, direction?: 'asc' | 'desc'): Query<T> => {
    return this.createQuery().sort(field, direction)
  }

  limit = (limit: number): Query<T> => {
    return this.createQuery().limit(limit)
  }

  onSnapshot = (fn: SubscriptionFn<CollectionList<T>>, errFn?: SubscriptionErrorFn) => {
    return this.createQuery().onSnapshot(fn, errFn)
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

  private createQuery() {
    return new Query<T>(this, this.client, this.onQuerySnapshotRegister, this.onRecordSnapshotRegister)
  }

  private onQuerySnapshotRegister = (q: Query<T>, fn: SubscriptionFn<CollectionList<T>>, errFn?: SubscriptionErrorFn) => {
    const k = q.key()
    if (!this.querySubs[k]) {
      this.querySubs[k] = new Subscription<CollectionList<T>>(q.request(), this.client, this.isReadPubliclyAccessible(), (res) => res.data)
    }
    return this.querySubs[k].subscribe(fn, errFn)
  }

  private onRecordSnapshotRegister = (d: CollectionRecord<T>, fn: SubscriptionFn<CollectionRecordResponse<T>>, errFn?: SubscriptionErrorFn) => {
    const k = d.key()
    if (!this.recordSubs[k]) {
      this.recordSubs[k] = new Subscription<CollectionRecordResponse<T>>(d.request(), this.client, this.isReadPubliclyAccessible(), (res) => res.data)
    }
    return this.recordSubs[k].subscribe(fn, errFn)
  }
}
