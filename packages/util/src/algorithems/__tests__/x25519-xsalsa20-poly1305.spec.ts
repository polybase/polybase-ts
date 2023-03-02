import { setupBrowser, testNodeAndBrowser } from '../../__tests__/util'

beforeAll(async () => {
  await setupBrowser()
})

describe('asymmetric', () => {
  test('decrypt/encrypt', async () => {
    await testNodeAndBrowser(async ({ index }) => {
      const { asymmetricEncrypt, asymmetricDecrypt, generateKeyPair } = index.x25519xsalsa20poly1305
      const { encodeToString } = index

      const { publicKey, privateKey } = await generateKeyPair()

      const str = 'hello world'
      const encrypted = await asymmetricEncrypt(publicKey, new TextEncoder().encode(str))
      const decrypted = await asymmetricDecrypt(privateKey, encrypted)
      return encodeToString(decrypted, 'utf8')
    }, obj => obj as string, (str) => {
      expect(str).toEqual('hello world')
    })
  })

  test('decrypt/encrypt with encoding', async () => {
    await testNodeAndBrowser(async ({ index }) => {
      const { asymmetricEncryptToEncoding, asymmetricDecryptFromEncoding, generateKeyPair } = index.x25519xsalsa20poly1305

      const { publicKey, privateKey } = await generateKeyPair()

      const str = 'hello world'
      const encrypted = await asymmetricEncryptToEncoding(publicKey, str)
      const decrypted = await asymmetricDecryptFromEncoding(privateKey, encrypted)
      return decrypted
    }, obj => obj as string, (str) => {
      expect(str).toEqual('hello world')
    })
  })
})

describe('symmetric', () => {
  test('decrypt/encrypt', async () => {
    await testNodeAndBrowser(async ({ index }) => {
      const { symmetricEncrypt, symmetricDecrypt, generateKeyPair } = index.x25519xsalsa20poly1305
      const { encodeToString, decodeFromString } = index

      const { privateKey } = await generateKeyPair()

      const str = 'hello world'
      const encrypted = await symmetricEncrypt(privateKey, decodeFromString(str, 'utf8'))
      const decrypted = await symmetricDecrypt(privateKey, encrypted)
      return encodeToString(decrypted, 'utf8')
    }, obj => obj as string, (str) => {
      expect(str).toEqual('hello world')
    })
  })
})
