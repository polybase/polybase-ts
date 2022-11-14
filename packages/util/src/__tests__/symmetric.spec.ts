import {
  generateSymmetricKey,
  encryptWithSymmetricKey,
  decryptWithSymmetricKey,
  symmetricEncryptToHex,
  symmetricDecryptFromHex,
} from '../symmetric'

test('generate key', async function () {
  const key = await generateSymmetricKey()
  expect(key.algorithm).toEqual({ length: 256, name: 'AES-CBC' })
})

test('decrypt/encrypt', async function () {
  const key = await generateSymmetricKey()
  const buffer = Buffer.from('hello world', 'utf8')
  const encrypted = await encryptWithSymmetricKey(key, buffer)
  const dval = await decryptWithSymmetricKey(key, encrypted)
  expect(Buffer.from(dval).toString('utf8')).toEqual('hello world')
})

test('decrypt/encrypt hex', async function () {
  const key = await generateSymmetricKey()
  const encrypted = await symmetricEncryptToHex(key, 'hello world')
  const dval = await symmetricDecryptFromHex(key, encrypted)
  expect(dval).toEqual('hello world')
})
