import {
  generateKey,
  symmetricEncrypt,
  symmetricDecrypt,
  // symmetricEncryptToHex,
  // symmetricDecryptFromHex,
} from '../aes-cbc'

test('generate key', async function () {
  const key = await generateKey()
  expect(key.algorithm).toEqual({ length: 256, name: 'AES-CBC' })
})

test('decrypt/encrypt', async function () {
  const key = await generateKey()
  const buffer = Buffer.from('hello world', 'utf8')
  const encrypted = await symmetricEncrypt(key, buffer)
  const dval = await symmetricDecrypt(key, encrypted)
  expect(Buffer.from(dval).toString('utf8')).toEqual('hello world')
})

// test('decrypt/encrypt hex', async function () {
//   const key = await generateKey()
//   const encrypted = await symmetricEncryptToHex(key, 'hello world')
//   const dval = await symmetricDecryptFromHex(key, encrypted)
//   expect(dval).toEqual('hello world')
// })
