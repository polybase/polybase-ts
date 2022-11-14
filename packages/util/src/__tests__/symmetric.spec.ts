import { generateSymmetricKey, encryptWithSymmetricKey, decryptWithSymmetricKey } from '../symmetric'

test('generate key', async function () {
  const key = await generateSymmetricKey()
  expect(key.algorithm).toEqual({ length: 256, name: 'AES-CBC' })
})

test('decrypt/encrypt', async function () {
  const key = await generateSymmetricKey()
  const buffer = Buffer.from('hello world', 'utf8')
  const encrypted = await encryptWithSymmetricKey(key, buffer)
  const dval = await decryptWithSymmetricKey(encrypted, key)
  expect(Buffer.from(dval).toString('utf8')).toEqual('hello world')
})
