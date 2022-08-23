import axios from 'axios'
import merge from 'lodash.merge'
import { Client } from './Client'
import { Collection } from './Collection'
import { CollectionMeta } from './types'

export interface SpacetimeConfig {
  baseURL: string
}

const defaultConfig = {
  baseURL: 'https://testnet.spacetime.is/v0',
}
export class Spacetime {
  id: string|null = null
  config: SpacetimeConfig

  private client: Client
  collections: Record<string, Collection> = {}

  constructor (config: SpacetimeConfig) {
    this.config = merge({}, defaultConfig, config)
    this.client = new Client(axios.create({
      baseURL: `${this.config.baseURL}/data`,
    }))
  }

  collection (id: string) {
    if (this.collections[id]) return this.collections[id]
    const c = new Collection(id, this.client)
    c.load()
    this.collections[id] = c
    return c
  }

  createCollection = async (id: string, data: CollectionMeta) => {
    const res = await this.client.request({
      url: `/$collections/${id}`,
      method: 'POST',
      data,
    }).send()
    return res
  }

  // TODO
  auth () {
  }
}
