import { ethPersonalSign, ethRequestAccounts } from './eth'
import { Signer, SignerResponse } from './types'

export const defaultSigner: Signer = async (data: string): Promise<SignerResponse> => {
  const accounts = await ethRequestAccounts()
  const sig = await ethPersonalSign(data, accounts[0])
  return { sig, h: 'eth-personal-sign' }
}

export function toHex (data: string) {
  return `0x${Buffer.from(data, 'utf8').toString('hex')}`
}
