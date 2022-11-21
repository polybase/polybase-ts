import * as nacl from 'tweetnacl'
import {
  asymmetricEncryptToHex,
  asymmetricDecryptFromHex,
} from '../x25519-xsalsa20-poly1305'

test('decrypt/encrypt x25519-xsalsa20-poly1305', async () => {
  const { publicKey, secretKey } = nacl.box.keyPair()
  const str = 'hello world'
  const encrypted = await asymmetricEncryptToHex(publicKey, str)
  const decrypted = await asymmetricDecryptFromHex(secretKey, encrypted)
  expect(decrypted.toString()).toEqual('hello world')
})
