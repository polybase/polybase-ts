import { parse } from '@polybase/polylang'
import axios from 'axios'
import fetchAdapter from './axios-fetch-adapter'
import { Client } from './Client'
import { Collection } from './Collection'
import { PolybaseError, createError } from './errors'
import { CollectionMeta, Sender, Signer } from './types'

export interface PolybaseConfig {
  baseURL: string
  clientId: string
  defaultNamespace?: string
  sender: Sender
  signer?: Signer
}

const defaultConfig = {
  baseURL: 'https://testnet.polybase.xyz/v0',
  clientId: 'polybase@ts/client:v0',
  sender: 'fetch' in global
    ? axios.create({ adapter: fetchAdapter as any })
    : axios,
}

export class Polybase {
  private config: PolybaseConfig
  private client: Client
  private collections: Record<string, Collection<any>> = {}

  constructor(config?: Partial<PolybaseConfig>) {
    this.config = Object.assign({}, defaultConfig, config)
    const { clientId, baseURL } = this.config
    this.client = new Client(
      this.config.sender,
      this.config.signer,
      { clientId, baseURL },
    )
  }

  collection<T = any>(path: string): Collection<T> {
    const rp = this.getResolvedPath(path)
    if (this.collections[rp]) return this.collections[rp]
    const c = new Collection<T>(rp, this.client)
    this.collections[rp] = c
    return c
  }

  private getResolvedPath = (path: string) => {
    if (path.startsWith('/')) return path.substring(1)
    return this.config.defaultNamespace ? `${this.config.defaultNamespace}/${path}` : path
  }

  private setCollectionCode = async <T>(data: Pick<CollectionMeta, 'id' | 'code'>): Promise<Collection<T>> => {
    const id = data.id
    const col = this.collection('Collection')

    try {
      await this.collection(id).getMeta()
      await col.record(id).call('updateCode', [data.code])
    } catch (e: any) {
      if (e && typeof e === 'object' &&
        e instanceof PolybaseError &&
        (e.reason === 'collection/not-found' || e.reason === 'record/not-found')
      ) {
        await this.collection('Collection').create([id, data.code])
      } else {
        throw e
      }
    }

    return this.collection<T>(data.id)
  }

  /* Applies the given schema to the database, creating new collections and adding existing collections  */
  applySchema = async (schema: string, namespace?: string): Promise<Collection<any>[]> => {
    const collections = []
    const ns = (namespace ?? this.config.defaultNamespace)
    if (!ns) {
      throw createError('collection/invalid-id', { message: 'Namespace is missing' })
    }

    const [, root] = await parse(schema, ns)

    // We already manually prepend the namespace to the collection name,
    // so we need a client without a default namespace.
    const polybaseWithoutNamespace = new Polybase({
      ...this.config,
      defaultNamespace: undefined,
    })

    for (const node of root) {
      if (node.kind !== 'collection') continue

      collections.push(polybaseWithoutNamespace.setCollectionCode({
        id: ns + '/' + node.name,
        code: schema,
      }))
    }

    return await Promise.all(collections)
  }

  signer = (fn: Signer) => {
    this.client.signer = fn
    this.config.signer = fn
  }
}
