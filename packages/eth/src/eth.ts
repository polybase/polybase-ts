
import * as util from '@spacetimexyz/util'

export const win: any = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) ||
  this

export async function getEncryptionKey (account: string): Promise<string> {
  requireEth('Eth get encryption public key')
  return await win.ethereum.request({
    method: 'eth_getEncryptionPublicKey',
    params: [account],
  })
}

export async function requestAccounts (): Promise<string[]> {
  requireEth('Eth request accounts')
  return await win.ethereum.request({
    method: 'eth_requestAccounts',
  })
}

export async function encrypt (cipherText: string, address: string) {
  const publicKey = await getEncryptionKey(address)
  const ev = util.encrypt({ publicKey, data: cipherText, version: 'x25519-xsalsa20-poly1305' })
  return util.stringifiableToHex(ev)
}

export async function decrypt (cipherText: string, account: string): Promise<string> {
  requireEth('Eth decrypt')
  return win.ethereum.request({
    method: 'eth_decrypt',
    params: [cipherText, account],
  })
}

export async function sign (msg: string, account: string): Promise<string> {
  requireEth('Eth personal sign')
  return win.ethereum.request({
    method: 'personal_sign',
    params: [msg, account],
  })
}

export function requireEth (feature: string) {
  if (!win?.ethereum) {
    throw new Error(`${feature} uses window.ethereum, but it is not present`)
  }
}
