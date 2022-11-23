import Wallet from 'ethereumjs-wallet'
import {
  asymmetricEncrypt,
  asymmetricDecrypt,
  asymmetricEncryptToEncoding,
  asymmetricDecryptFromEncoding,
  getPublicKey,
  getPublicCompressed,
} from '../secp256k1'
import * as aescbc from '../aes-cbc'
import { encodeToString, decodeFromString } from '../../util'

describe('asymmetric', () => {
  test('decrypt/encrypt: 64 bit key', async function () {
    // Generate private key
    const wallet = Wallet.generate()
    const publicKey = wallet.getPublicKey()
    const privateKey = wallet.getPrivateKey()

    const str = 'hello world'
    const encrypted = await asymmetricEncrypt(publicKey, Buffer.from(str))
    const decrypted = await asymmetricDecrypt(privateKey, encrypted)
    expect(encodeToString(decrypted, 'utf8')).toEqual('hello world')
  })

  test('decrypt/encrypt: 65 bit key', async function () {
    // Generate private key
    const wallet = Wallet.generate()
    const privateKey = wallet.getPrivateKey()
    const publicKey = getPublicKey(privateKey)

    const str = 'hello world'
    const encrypted = await asymmetricEncrypt(publicKey, Buffer.from(str))
    const decrypted = await asymmetricDecrypt(privateKey, encrypted)
    expect(encodeToString(decrypted, 'utf8')).toEqual('hello world')
  })

  test('decrypt/encrypt: 33 bit key', async function () {
    // Generate private key
    const wallet = Wallet.generate()
    const privateKey = wallet.getPrivateKey()
    const publicKey = getPublicCompressed(privateKey)

    const str = 'hello world'
    const encrypted = await asymmetricEncrypt(publicKey, Buffer.from(str))
    const decrypted = await asymmetricDecrypt(privateKey, encrypted)
    expect(encodeToString(decrypted, 'utf8')).toEqual('hello world')
  })

  test('decrypt/encrypt symmetric key', async function () {
    // Generate private key
    const wallet = Wallet.generate()
    const publicKey = wallet.getPublicKey()
    const privateKey = wallet.getPrivateKey()
    const publicKeyStr = encodeToString(publicKey, 'hex')

    const str = 'hello world'

    // Symmetric
    const symmetricKey = aescbc.generateSecretKey()
    const encryptedResponse = await aescbc.symmetricEncryptToEncoding(symmetricKey, str, 'base64')

    const decodedPublicKeyStr = decodeFromString(publicKeyStr, 'hex')
    const encrypted = await asymmetricEncryptToEncoding(decodedPublicKeyStr, encodeToString(symmetricKey, 'hex'), 'base64')

    // Decrypt
    const decryptedSymmetricKeyHex = await asymmetricDecryptFromEncoding(privateKey, encrypted)
    const decryptedSymmetricKey = decodeFromString(decryptedSymmetricKeyHex, 'hex')
    const decrypted = await aescbc.symmetricDecryptFromEncoding(decryptedSymmetricKey, encryptedResponse, 'base64')

    expect(decrypted).toEqual('hello world')
  })
})
