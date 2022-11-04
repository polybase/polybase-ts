import { parse } from '@polybase/polylang'
import axios from 'axios'
import merge from 'lodash.merge'
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
  sender: axios,
}

export class Polybase {
  private config: PolybaseConfig
  private client: Client
  private collections: Record<string, Collection<any>> = {}

  constructor (config?: Partial<PolybaseConfig>) {
    this.config = merge({}, defaultConfig, config)
    const { clientId, baseURL } = this.config
    this.client = new Client(
      this.config.sender,
      this.config.signer,
      { clientId, baseURL },
    )
  }

  collection<T=any> (path: string): Collection<T> {
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

  private setCollectionCode = async <T>(data: CollectionMeta): Promise<Collection<T>> => {
    const id = data.id
    const col = this.collection('Collection')

    // Does ID already exist?
    try {
      const res = await col.doc(id).get()
      if (!res) {
        throw new Error('Unable to fetch metadata')
      }
      await col.doc(id).call('updateCode', [data.code])
    } catch (e: any) {
      if (e instanceof PolybaseError && e.reason === 'record-not-found') {
        await this.collection('Collection').create([id, data.code])
      }
    }

    return this.collection<T>(data.id)
  }

  applySchema = async (schema: string, namespace?: string): Promise<Collection<any>[]> => {
    const collections = []
    const ast = await parse(schema)

    const ns = (namespace ?? this.config.defaultNamespace)
    if (!ns) {
      throw createError('missing-namespace')
    }

    for (const node of ast.nodes) {
      if (!node.Collection) continue

      collections.push(this.setCollectionCode({
        id: ns + '/' + node.Collection.name,
        code: schema,
      }))
    }

    return await Promise.all(collections)
  }

  signer = (fn: Signer) => {
    this.client.signer = fn
  }
}
