import { parse } from '@polybase/polylang'
import axios from 'axios'
import merge from 'lodash.merge'
import { Client } from './Client'
import { Contract } from './Contract'
import { createError } from './errors'
import { ContractMeta, Sender, Signer } from './types'

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
  private contracts: Record<string, Contract<any>> = {}

  constructor (config?: Partial<PolybaseConfig>) {
    this.config = merge({}, defaultConfig, config)
    const { clientId, baseURL } = this.config
    this.client = new Client(
      this.config.sender,
      this.config.signer,
      { clientId, baseURL },
    )
  }

  contract<T=any> (path: string): Contract<T> {
    const rp = this.getResolvedPath(path)
    if (this.contracts[rp]) return this.contracts[rp]
    const c = new Contract<T>(rp, this.client)
    this.contracts[rp] = c
    return c
  }

  // Alias for contract
  collection<T=any> (path: string): Contract<T> {
    return this.contract(path)
  }

  private getResolvedPath = (path: string) => {
    if (path.startsWith('/')) return path.substring(1)
    return this.config.defaultNamespace ? `${this.config.defaultNamespace}/${path}` : path
  }

  private createContract = async <T>(data: ContractMeta): Promise<Contract<T>> => {
    const id = data.id
    await this.client.request({
      url: '/contracts/$Contract',
      method: 'POST',
      data: {
        args: [id, data.code],
      },
    }).send()
    return this.contract<T>(data.id)
  }

  applySchema = async (schema: string, namespace?: string): Promise<Contract<any>[]> => {
    const contracts = []
    const ast = await parse(schema)

    const ns = (namespace ?? this.config.defaultNamespace)
    if (!ns) {
      throw createError('missing-namespace')
    }

    for (const node of ast.nodes) {
      if (!node.Contract) continue

      contracts.push(this.createContract({
        id: ns + '/' + node.Contract.name,
        code: schema,
      }))
    }

    return await Promise.all(contracts)
  }

  signer = (fn: Signer) => {
    this.client.signer = fn
  }
}
