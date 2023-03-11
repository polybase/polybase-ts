import { ethPersonalSign, ethPersonalSignRecoverPublicKey } from '../sign'
import { secp256k1, encodeToString } from '@polybase/util'

test('recovers public key', () => {
  const privateKey = secp256k1.generatePrivateKey()
  const publicKey = secp256k1.getPublicKey(privateKey)
  const msg = 'Hello World'
  const sign = ethPersonalSign(privateKey, msg)

  expect(ethPersonalSignRecoverPublicKey(sign, msg)).toEqual(encodeToString(publicKey, 'hex'))
})
