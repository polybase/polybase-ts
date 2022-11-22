import { decodeFromString, encodeToString } from '../../util'
import {
  generateSecretKey,
  symmetricEncrypt,
  symmetricDecrypt,
  importKey,
} from '../aes-cbc'

test('generate key', async function () {
  const key = await generateSecretKey()
  expect(key.byteLength).toEqual(32)
})

test('can import key', async function () {
  const key = await generateSecretKey()
  const ckey = await importKey(key)
  expect(ckey.algorithm).toEqual({ length: 256, name: 'AES-CBC' })
})

describe('symmetric', () => {
  test('decrypt/encrypt', async function () {
    const key = await generateSecretKey()
    const str = 'hello world'
    const buffer = decodeFromString(str, 'utf8')
    const encrypted = await symmetricEncrypt(key, buffer)
    const decrypted = await symmetricDecrypt(key, encrypted)
    expect(encodeToString(decrypted, 'utf8')).toEqual(str)
  })
})
