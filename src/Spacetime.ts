import axios from 'axios'
import merge from 'lodash.merge'
import { Client, Sender } from './Client'
import { Collection } from './Collection'
import { CollectionMeta } from './types'

export interface SpacetimeConfig {
  baseURL: string
  sender: Sender,
}

const defaultConfig = {
  baseURL: 'https://testnet.spacetime.is/v0/data`',
  sender: axios,
}

export class Spacetime {
  id: string|null = null
  config: SpacetimeConfig

  private client: Client
  collections: Record<string, Collection> = {}

  constructor (config?: Partial<SpacetimeConfig>) {
    this.config = merge({}, defaultConfig, config)
    this.client = new Client(this.config.sender, this.config.baseURL)
  }

  collection (id: string) {
    if (this.collections[id]) return this.collections[id]
    const c = new Collection(id, this.client)
    this.collections[id] = c
    return c
  }

  createCollection = async (data: CollectionMeta) => {
    const id = data.id
    await this.client.request({
      url: `/$collections/${id}`,
      method: 'POST',
      data,
    }).send()
    return this.collection(data.id)
  }

  // TODO
  auth () {
  }
}
