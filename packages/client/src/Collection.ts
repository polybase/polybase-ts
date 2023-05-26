import { CollectionRecord, CollectionRecordResponse } from './Record'
import { Query, QueryResponse } from './Query'
import { Subscription, SubscriptionFn, SubscriptionErrorFn, UnsubscribeFn } from './Subscription'
import { Client } from './Client'
import { QueryValue, CollectionMeta, CollectionList, QueryWhereOperator, CallArgs, SenderRawListResponse, SenderRawRecordResponse, SenderResponse } from './types'
import { validateSet } from '@polybase/polylang/dist/validator'
import { getCollectionASTFromId, serializeValue, getCollectionShortNameFromId } from './util'
import { createError, PolybaseError } from './errors'
import { Root as ASTRoot, Collection as ASTCollection, Method as ASTMethod, Directive as ASTDirective } from '@polybase/polylang/dist/ast'

export type QuerySnapshotRegister<T> = (q: Query<T>, fn: SubscriptionFn<CollectionList<T>>, errFn?: SubscriptionErrorFn) => (() => void)

export class Collection<T> {
  id: string
  private querySubs: Record<string, Subscription<CollectionList<T>>> = {}
  private recordSubs: Record<string, Subscription<CollectionRecordResponse<T>>> = {}
  private meta?: CollectionMeta
  private client: Client
  private astCache?: ASTCollection

  constructor(id: string, client: Client) {
    this.id = id
    this.client = client
  }

  /**
   * @deprecated You do not need to call load()
   */
  load = async () => {
  }

  getMeta = async (): Promise<CollectionMeta> => {
    if (this.meta) return this.meta
    // Manually get Collection meta, otherwise we would recursively call this function
    const col = new Collection<CollectionMeta>('Collection', this.client)
    const res = await this.client.request(col.record(this.id).request())
      .send<SenderRawRecordResponse<CollectionMeta>>('none')
    if (!res.data.data) {
      throw new PolybaseError('collection/not-found', {
        message: `Collection ${this.id} does not exist`,
      })
    }
    this.meta = res.data.data
    return this.meta
  }

  getAST = async (): Promise<ASTCollection> => {
    // Return cached value if it exists
    if (this.astCache) return this.astCache
    const meta = await this.getMeta()
    const ast = JSON.parse(meta.ast) as ASTRoot
    const collectionAST = getCollectionASTFromId(this.id, ast)
    if (!collectionAST) throw createError('collection/invalid-ast')
    this.astCache = collectionAST
    return collectionAST
  }

  name(): string {
    return getCollectionShortNameFromId(this.id)
  }

  validate = async (data: Partial<T>) => {
    const ast = await this.getAST()
    try {
      await validateSet(ast, data)
      return true
    } catch {
      return false
    }
  }

  isReadPubliclyAccessible = async (): Promise<boolean> => {
    // Without this, we would recursively call this function
    if (this.id === 'Collection') return true

    return this.isCollectionPubliclyAccessible('read')
  }

  isCallPubliclyAccessible = async (methodName: string) => {
    // Without this, we would recursively call this function
    if (this.id === 'Collection') return true

    const colAST = await this.getAST()

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
    const colAST = await this.getAST()
    const hasPublicDirective = colAST.attributes.some((attr) => attr.kind === 'directive' && attr.name === 'public')
    const hasTypeDirective = colAST.attributes.some((attr) => attr.kind === 'directive' && attr.name === type && attr.arguments?.length === 0)
    return hasPublicDirective || hasTypeDirective
  }

  create = async (args: CallArgs = []): Promise<CollectionRecordResponse<T>> => {
    const [res, ast] = await Promise.all([
      this.client.request({
        url: `/collections/${encodeURIComponent(this.id)}/records`,
        method: 'POST',
        data: {
          args: args.map(serializeValue),
        },
      }).send<SenderRawRecordResponse<T>>('optional'),
      await this.getAST(),
    ])

    return new CollectionRecordResponse(this.id, res.data, ast, this, this.client, this.onRecordSnapshotRegister)
  }

  get = async (): Promise<CollectionList<T>> => {
    return this.createQuery().get()
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

  private onQuerySnapshotRegister: QuerySnapshotRegister<T> = (q: Query<T>, fn: SubscriptionFn<CollectionList<T>>, errFn?: SubscriptionErrorFn): UnsubscribeFn => {
    const k = q.key()
    if (!this.querySubs[k]) {
      this.querySubs[k] = new Subscription<CollectionList<T>, SenderRawListResponse<T>>(q.request(), this.client, this.isReadPubliclyAccessible(), async (res) => {
        const ast = await this.getAST()
        return new QueryResponse(this, this.client, this.onQuerySnapshotRegister, this.onRecordSnapshotRegister, res.data, ast)
      })
    }
    return this.querySubs[k].subscribe(fn, errFn)
  }

  private onRecordSnapshotRegister = (d: CollectionRecord<T>, fn: SubscriptionFn<CollectionRecordResponse<T>>, errFn?: SubscriptionErrorFn): UnsubscribeFn => {
    const k = d.key()
    if (!this.recordSubs[k]) {
      this.recordSubs[k] = new Subscription<CollectionRecordResponse<T>>(
        d.request(),
        this.client,
        this.isReadPubliclyAccessible(),
        async (res: SenderResponse<SenderRawRecordResponse>) => {
          return new CollectionRecordResponse<T>(this.id, res.data, await this.getAST(), this, this.client, this.onRecordSnapshotRegister)
        },
      )
    }
    return this.recordSubs[k].subscribe(fn, errFn)
  }
}
