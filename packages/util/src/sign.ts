
import { joinSignature, BytesLike } from '@ethersproject/bytes'
import { SigningKey } from '@ethersproject/signing-key'

export function sign (privateKey: BytesLike, d: BytesLike): string {
  const signingKey = new SigningKey(privateKey)
  const signature = signingKey.signDigest(d)
  const sig = joinSignature(signature)
  return sig
}