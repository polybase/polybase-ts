import axios, { AxiosInstance } from 'axios'
import { Collection } from './Collection'

export interface SpacetimeConfig {
  baseURL: string
}

export class Spacetime {
  id: string|null = null
  config: SpacetimeConfig = {
    baseURL: 'https://testnet.spacetime.is/v0',
  }

  private client: AxiosInstance
  collections: Record<string, Collection> = {}

  constructor (config: SpacetimeConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: `${this.config.baseURL}/data`,
    })
  }

  collection (id: string) {
    if (this.collections[id]) return this.collections[id]
    const c = new Collection(id, this, this.client)
    this.collections[id] = c
    return c
  }

  createCollection (name: string) {

  }

  // TODO
  auth () {

  }
}
