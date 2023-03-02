import { setupBrowser, testNodeAndBrowser } from '../../__tests__/util'

beforeAll(async () => {
  await setupBrowser()
})

describe('asymmetric', () => {
  test('decrypt/encrypt: 64 bit key', async function () {
    await testNodeAndBrowser(async ({ index }) => {
      const { asymmetricEncrypt, asymmetricDecrypt, generateKeyPair } = index.secp256k1
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

  test('decrypt/encrypt: 65 bit key', async function () {
    await testNodeAndBrowser(async ({ index }) => {
      const { asymmetricEncrypt, asymmetricDecrypt, generateKeyPair } = index.secp256k1
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

  test('decrypt/encrypt: 33 bit key', async function () {
    await testNodeAndBrowser(async ({ index }) => {
      const { asymmetricEncrypt, asymmetricDecrypt, generateKeyPair } = index.secp256k1
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

  test('decrypt/encrypt symmetric key', async function () {
    await testNodeAndBrowser(async ({ index }) => {
      const { asymmetricEncryptToEncoding, asymmetricDecryptFromEncoding, generateKeyPair } = index.secp256k1
      const { encodeToString, decodeFromString } = index
      const { symmetricEncryptToEncoding, symmetricDecryptFromEncoding, generateSecretKey } = index.aescbc

      const { publicKey, privateKey } = await generateKeyPair()

      const str = 'hello world'

      // Symmetric
      const symmetricKey = generateSecretKey()
      const encryptedResponse = await symmetricEncryptToEncoding(symmetricKey, str, 'base64')

      const encrypted = await asymmetricEncryptToEncoding(publicKey, encodeToString(symmetricKey, 'hex'), 'base64')

      // Decrypt
      const decryptedSymmetricKeyHex = await asymmetricDecryptFromEncoding(privateKey, encrypted)
      const decryptedSymmetricKey = decodeFromString(decryptedSymmetricKeyHex, 'hex')
      const decrypted = await symmetricDecryptFromEncoding(decryptedSymmetricKey, encryptedResponse, 'base64')

      return decrypted
    }, obj => obj as string, (str) => {
      expect(str).toEqual('hello world')
    })
  })
})
