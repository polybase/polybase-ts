import { secp256k1, BytesLike } from '@polybase/util'
import { hashEthereumSignedMessage } from './hash'

export function ethPersonalSign(privateKey: BytesLike, d: BytesLike): string {
  return secp256k1.sign(privateKey, hashEthereumSignedMessage(d))
}

export function ethPersonalSignRecoverPublicKey(sig: BytesLike, d: BytesLike): string {
  return secp256k1.recoverPublicKey(hashEthereumSignedMessage(d), sig)
}
