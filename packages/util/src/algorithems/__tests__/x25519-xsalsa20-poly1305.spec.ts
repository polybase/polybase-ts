import * as nacl from 'tweetnacl'
import { decodeFromString, encodeToString } from '../../util'
import {
  asymmetricEncryptToHex,
  asymmetricDecryptFromHex,
  symmetricEncrypt,
  symmetricDecrypt,
} from '../x25519-xsalsa20-poly1305'

describe('asymmetric', () => {
  test('decrypt/encrypt', async () => {
    const { publicKey, secretKey } = nacl.box.keyPair()
    const str = 'hello world'
    const encrypted = await asymmetricEncryptToHex(publicKey, str)
    const decrypted = await asymmetricDecryptFromHex(secretKey, encrypted)
    expect(decrypted).toEqual('hello world')
  })
})

describe('symmetric', () => {
  test('decrypt/encrypt', async () => {
    const { secretKey } = nacl.box.keyPair()
    const str = 'hello world'
    const encrypted = await symmetricEncrypt(secretKey, decodeFromString(str, 'utf8'))
    const decrypted = await symmetricDecrypt(secretKey, encrypted)
    expect(encodeToString(decrypted, 'utf8')).toEqual('hello world')
  })
})
