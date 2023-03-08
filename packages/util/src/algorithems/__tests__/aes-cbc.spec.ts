import { setupBrowser, testNodeAndBrowser, jsonObjectToUint8Array } from '../../__tests__/util'

beforeAll(async () => {
  await setupBrowser()
})

test('generate key', async function () {
  await testNodeAndBrowser(({ index }) => {
    const { generateSecretKey } = index.aescbc

    return generateSecretKey()
  }, jsonObjectToUint8Array, (key) => {
    expect(key.byteLength).toEqual(32)
  })
})

test('can import key', async function () {
  await testNodeAndBrowser(async ({ index }) => {
    const { generateSecretKey, importKey } = index.aescbc
    const key = await generateSecretKey()
    const ckey = await importKey(key)
    return ckey.algorithm
  }, obj => obj as KeyAlgorithm, (key) => {
    expect(key).toEqual({ length: 256, name: 'AES-CBC' })
  })
})

describe('symmetric', () => {
  test('decrypt/encrypt', async function () {
    await testNodeAndBrowser(async ({ index }) => {
      const { generateSecretKey, symmetricEncrypt, symmetricDecrypt } = index.aescbc
      const { decodeFromString, encodeToString } = index

      const key = await generateSecretKey()
      const str = 'hello world'
      const buffer = decodeFromString(str, 'utf8')
      const encrypted = await symmetricEncrypt(key, buffer)
      const decrypted = await symmetricDecrypt(key, encrypted)
      return encodeToString(decrypted, 'utf8')
    }, obj => obj as string, (str) => {
      expect(str).toEqual('hello world')
    })
  })

  test('decrypt/encrypt from hex encoding', async function () {
    await testNodeAndBrowser(async ({ index }) => {
      const { generateSecretKey, symmetricEncryptToEncoding, symmetricDecryptFromEncoding } = index.aescbc

      const key = await generateSecretKey()
      const str = 'hello world'
      const encrypted = await symmetricEncryptToEncoding(key, str, 'hex')
      const decrypted = await symmetricDecryptFromEncoding(key, encrypted, 'hex')
      return decrypted
    }, obj => obj as string, (str) => {
      expect(str).toEqual('hello world')
    })
  })

  test('decrypt/encrypt from hex with buffer', async function () {
    await testNodeAndBrowser(async ({ index }) => {
      const { generateSecretKey, symmetricEncryptToEncoding, symmetricDecryptFromEncoding } = index.aescbc
      const { encodeToString } = index

      const key = await generateSecretKey()
      const str = encodeToString(await generateSecretKey(), 'hex')
      const encrypted = await symmetricEncryptToEncoding(key, str, 'hex')
      const decrypted = await symmetricDecryptFromEncoding(key, encrypted, 'hex')

      return [str, decrypted]
    }, (obj) => [obj as any[0], obj as any[1]], ([str, decrypted]) => {
      expect(decrypted).toEqual(str)
    })
  })
})
