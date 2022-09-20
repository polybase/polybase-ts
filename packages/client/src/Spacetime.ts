import { parse } from '@spacetimexyz/parser'
import axios from 'axios'
import merge from 'lodash.merge'
import { Client } from './Client'
import { Collection } from './Collection'
import { createError } from './errors'
import { CollectionMeta, Sender, Signer } from './types'

export interface SpacetimeConfig {
  baseURL: string
  clientId: string
  defaultNamespace?: string
  sender: Sender
  signer?: Signer
}

const defaultConfig = {
  baseURL: 'https://testnet.spacetime.xyz/v0/data',
  clientId: 'spacetime@ts/client:v0',
  sender: axios,
}

export class Spacetime {
  private config: SpacetimeConfig
  private client: Client
  private collections: Record<string, Collection<any>> = {}

  constructor (config?: Partial<SpacetimeConfig>) {
    this.config = merge({}, defaultConfig, config)
    const { clientId, baseURL } = this.config
    this.client = new Client(
      this.config.sender,
      this.config.signer,
      { clientId, baseURL },
    )
  }

  collection<T=any> (id: string): Collection<T> {
    if (this.collections[id]) return this.collections[id]
    const path = this.config.defaultNamespace ? `${this.config.defaultNamespace}/${id}` : id
    const c = new Collection<T>(path, this.client)
    this.collections[path] = c
    return c
  }

  private createCollection = async <T>(data: CollectionMeta): Promise<Collection<T>> => {
    const id = data.id
    await this.client.request({
      url: `/$collections/${encodeURIComponent(id)}`,
      method: 'POST',
      data: {
        data,
      },
    }).send()
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

      collections.push(this.createCollection({
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
