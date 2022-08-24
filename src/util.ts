import { Signer, Hasher } from './types'

const win: any = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) ||
  this

export const defaultSigner: Signer = async (address: string, data: string) => {
  if (!win?.ethereum) {
    throw new Error('Default signer uses window.ethereum, but it is not present')
  }

  const res: string = await win.ethereum.request({
    method: 'eth_signTypedData_v4',
    params: [address, data],
  })

  return res
}

export const defaultHasher: Hasher = async (data: string) => {
  return data
}
