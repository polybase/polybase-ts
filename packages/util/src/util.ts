import { hexlify } from '@ethersproject/bytes'
import * as nacl from 'tweetnacl'
import secp256k1 from 'secp256k1'
import { EncryptedDataVersion } from './types'

export function stringifiableToHex (value: any) {
  return hexlify(Buffer.from(JSON.stringify(value)))
}

export function isNullish (value: any) {
  return value === null || value === undefined
}

export async function generateKeyPair (version: EncryptedDataVersion) {
  const privateKey = nacl.randomBytes(32)

  if (version === 'secp256k1') {
    return { privateKey, publicKey: secp256k1.publicKeyCreate(privateKey) }
  }

  if (version === 'x25519-xsalsa20-poly1305') {
    return { privateKey, publicKey: nacl.box.keyPair.fromSecretKey(privateKey).publicKey }
  }

  throw new Error('Encryption version not supported')
}
