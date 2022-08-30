
import { encrypt } from './encrypt'

export const win: any = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) ||
  this

export async function ethPublicEncryptionKey (address: string): Promise<string> {
  requireEth('Eth get encryption public key')
  return await win.ethereum.request({
    method: 'eth_getEncryptionPublicKey',
    params: [address],
  })
}

export async function ethRequestAccounts (): Promise<string[]> {
  requireEth('Eth request accounts')
  return await win.ethereum.request({
    method: 'eth_requestAccounts',
  })
}

export async function ethEncrypt (cipherText: string, address: string) {
  const publicKey = await ethPublicEncryptionKey(address)
  return encrypt({ publicKey, data: cipherText, version: 'x25519-xsalsa20-poly1305' })
}

export async function ethDecrypt (cipherText: string, address: string): Promise<string> {
  requireEth('Eth decrypt')
  return win.ethereum.request({
    method: 'eth_decrypt',
    params: [cipherText, address],
  })
}

export async function ethPersonalSign (msg: string, address: string, name?: string): Promise<string> {
  requireEth('Eth personal sign')
  return win.ethereum.request({
    method: 'personal_sign',
    params: [msg, address, name ?? 'Spacetime'],
  })
}

export function requireEth (feature: string) {
  if (!win?.ethereum) {
    throw new Error(`${feature} uses window.ethereum, but it is not present`)
  }
}
