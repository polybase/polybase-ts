import { parse } from '@polybase/polylang'
import { Contract } from './Contract'
import { SubscriptionErrorFn, SubscriptionFn } from './Subscription'
import { Client } from './Client'
import { Request, ContractDocument } from './types'
import { validateCallParameters } from './util'

export type DocSnapshotRegister<T> = (d: Doc<T>, fn: SubscriptionFn<ContractDocument<T>>, errFn?: SubscriptionErrorFn) => (() => void)

export class Doc<T> {
  id: string
  private contract: Contract<T>
  private client: Client
  private onSnapshotRegister: DocSnapshotRegister<T>

  constructor (id: string, contract: Contract<T>, client: Client, onSnapshotRegister: DocSnapshotRegister<T>) {
    this.id = id
    this.contract = contract
    this.client = client
    this.onSnapshotRegister = onSnapshotRegister
  }

  // delete = async (): Promise<ContractDocument<T>> => {
  //   const res = await this.client.request({
  //     ...this.request(),
  //     method: 'DELETE',
  //   }).send()
  //   return res.data
  // }

  call = async (functionName: string, args: (string | number | Doc<any>)[] = [], pk?: string): Promise<ContractDocument<T>> => {
    const meta = await this.contract.getMeta()
    const ast = await parse(meta.code)
    validateCallParameters(this.contract.id, functionName, ast, args)

    const res = await this.client.request({
      url: `/contracts/${encodeURIComponent(this.contract.id)}/${encodeURIComponent(this.id)}/call/${encodeURIComponent(functionName)}`,
      method: 'POST',
      data: {
        args: args.map(arg => {
          if (arg instanceof Doc) {
            return { id: arg.id }
          }

          return arg
        }),
      },
    }).send(pk ? true : undefined)

    return res.data
  }

  get = async (): Promise<ContractDocument<T>> => {
    const res = await this.client.request(this.request()).send()
    return res.data
  }

  key = () => {
    return `doc:${this.contract.id}/${this.id}`
  }

  onSnapshot = (fn: SubscriptionFn<ContractDocument<T>>, errFn?: SubscriptionErrorFn) => {
    return this.onSnapshotRegister(this, fn, errFn)
  }

  request = (): Request => ({
    url: `/contracts/${encodeURIComponent(this.contract.id)}/${encodeURIComponent(this.id)}`,
    method: 'GET',
  })
}
