import { sign, BytesLike } from '@spacetimexyz/util'
import { hashEthereumSignedMessage } from './hash'

export function ethPersonalSign (privateKey: BytesLike, d: BytesLike): string {
  return sign(privateKey, hashEthereumSignedMessage(d))
}
