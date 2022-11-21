import nacl from 'tweetnacl'
import { KeyPair } from './types'

export function generateKeyPair (): KeyPair {
  const privateKey = nacl.randomBytes(32)
  return {
    version: 'x25519-xsalsa20-poly1305',
    privateKey,
    publicKey: nacl.box.keyPair.fromSecretKey(privateKey).publicKey,
  }
}
