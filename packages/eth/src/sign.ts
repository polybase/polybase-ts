import { sign, BytesLike } from '@polybase/util'
import { hashEthereumSignedMessage } from './hash'

export function ethPersonalSign (privateKey: BytesLike, d: BytesLike): string {
  return sign(privateKey, hashEthereumSignedMessage(d))
}
