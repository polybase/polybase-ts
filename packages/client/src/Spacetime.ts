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
  private collections: Record<string, Collection> = {}

  constructor (config?: Partial<SpacetimeConfig>) {
    this.config = merge({}, defaultConfig, config)
    const { clientId, baseURL } = this.config
    this.client = new Client(
      this.config.sender,
      this.config.signer,
      { clientId, baseURL },
    )
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
      data: {
        data,
      },
    }).send()
    return this.collection(data.id)
  }
}
