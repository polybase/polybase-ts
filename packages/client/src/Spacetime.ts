import axios from 'axios'
import merge from 'lodash.merge'
import { Client } from './Client'
import { Collection } from './Collection'
import { CollectionMeta, Sender, Signer } from './types'
import { defaultSigner } from './util'

export interface SpacetimeConfig {
  baseURL: string
  clientId: string
  sender: Sender
  signer: Signer
}

const defaultConfig = {
  baseURL: 'https://testnet.spacetime.xyz/v0/data',
  clientId: 'spacetime@ts/client:v0',
  sender: axios,
  signer: defaultSigner,
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
    const c = new Collection<T>(id, this.client)
    this.collections[id] = c
    return c
  }

  createCollection = async <T>(data: CollectionMeta): Promise<Collection<T>> => {
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

  signer = (fn: Signer) => {
    this.client.signer = fn
  }
}
