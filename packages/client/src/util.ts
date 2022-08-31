import { Signer, SignerResponse } from './types'
import * as eth from '@spacetimexyz/eth'

export const defaultSigner: Signer = async (data: string): Promise<SignerResponse> => {
  const accounts = await eth.requestAccounts()
  const sig = await eth.sign(data, accounts[0])
  return { sig, h: 'eth-personal-sign' }
}

export function toHex (data: string) {
  return `0x${Buffer.from(data, 'utf8').toString('hex')}`
}
