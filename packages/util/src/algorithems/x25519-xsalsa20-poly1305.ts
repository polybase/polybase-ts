import nacl from 'tweetnacl'
import { KeyPair, EncryptedAsymmetricX25519, EncryptedSymmetricX25519 } from '../types'
import { stripPublicKeyPrefix, encodeToString, decodeFromString, assert, stringifyEncryptedData, parseEncrypedData } from '../util'

/**
 * Generate public/private key pairs
 *
 * @returns public/private key pair
 */
export function generateKeyPair (): KeyPair {
  const privateKey = nacl.randomBytes(32)
  return {
    version: 'x25519-xsalsa20-poly1305/asymmetric',
    privateKey,
    publicKey: nacl.box.keyPair.fromSecretKey(privateKey).publicKey,
  }
}

/**
 * Asymmetric encrypt bytes
 *
 * @returns encrypted data
 */
export async function asymmetricEncrypt (publicKey: Uint8Array, data: Uint8Array): Promise<EncryptedAsymmetricX25519> {
  const ephemeralKeyPair = nacl.box.keyPair()
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const pk = stripPublicKeyPrefix(publicKey)
  const ciphertext = nacl.box(
    data,
    nonce,
    pk,
    ephemeralKeyPair.secretKey,
  )
  return {
    version: 'x25519-xsalsa20-poly1305/asymmetric',
    nonce,
    ephemPublicKey: ephemeralKeyPair.publicKey,
    ciphertext,
  }
}

/**
 * Asymmetric decrypt bytes
 *
 * @returns decrypted bytes
 */
export async function asymmetricDecrypt (privateKey: Uint8Array, encryptedData: EncryptedAsymmetricX25519): Promise<Uint8Array> {
  const { version, nonce, ephemPublicKey, ciphertext } = encryptedData

  // For backwards compatability, allow base version
  assert(version as string === 'x25519-xsalsa20-poly1305' ||
   version === 'x25519-xsalsa20-poly1305/asymmetric', 'Invalid encryption version')

  const recieverEncryptionPrivateKey = nacl.box.keyPair.fromSecretKey(
    new Uint8Array(privateKey),
  ).secretKey

  const decryptedMessage = nacl.box.open(
    ciphertext,
    nonce,
    ephemPublicKey,
    recieverEncryptionPrivateKey,
  )
  if (!decryptedMessage) throw new Error('Unable to decrypt')
  return decryptedMessage
}

/**
 * Symmetric encrypt bytes
 *
 * @returns encrypt data
 */
export async function symmetricEncrypt (privateKey: Uint8Array, data: Uint8Array): Promise<EncryptedSymmetricX25519> {
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const ciphertext = nacl.secretbox(data, nonce, privateKey)

  return {
    version: 'x25519-xsalsa20-poly1305/symmetric',
    nonce,
    ciphertext,
  }
}

/**
 * Symmetric decrypt bytes
 *
 * @returns decrypted bytes
 */
export async function symmetricDecrypt (privateKey: Uint8Array, encryptedData: EncryptedSymmetricX25519) {
  const { version, ciphertext, nonce } = encryptedData
  assert(version === 'x25519-xsalsa20-poly1305/symmetric', 'Invalid encryption version')

  const decryptedMessage = nacl.secretbox.open(ciphertext, nonce, privateKey)
  if (!decryptedMessage) throw new Error('Unable to decrypt')
  return decryptedMessage
}

/**
 * Asymmetric encrypt string data as a given encoding (hex/base64). Defaults to base64.
 *
 * @returns encrypted data as hex
 */
export async function asymmetricEncryptToEncoding (publicKey: Uint8Array, data: string, encoding: 'base64'|'hex' = 'base64'): Promise<string> {
  const e = await asymmetricEncrypt(publicKey, decodeFromString(data, 'utf8'))
  return stringifyEncryptedData(e, encoding)
}

/**
 * Asymmetric decrypt data from given encoding (hex/base64). Defaults to base64.
 *
 * @returns decrypted string
 */
export async function asymmetricDecryptFromEncoding (privateKey: Uint8Array, hex: string, encoding: 'base64'|'hex' = 'base64'): Promise<string> {
  const e = parseEncrypedData(hex, encoding)
  const res = await asymmetricDecrypt(privateKey, e)
  return encodeToString(res, 'utf8')
}

/**
 * Symmetric encrypt string data as a given encoding (hex/base64). Defaults to base64.
 *
 * @returns encrypted data as encoding
 */
export async function symmetricEncryptToEncoding (publicKey: Uint8Array, data: string, encoding: 'base64'|'hex' = 'base64'): Promise<string> {
  const e = await symmetricEncrypt(publicKey, decodeFromString(data, 'utf8'))
  return stringifyEncryptedData(e, encoding)
}

/**
 * Symmetric decrypt data from given encoding (hex/base64). Defaults to base64.
 *
 * @returns decrypted string
 */
export async function symmetricDecryptFromEncoding (privateKey: Uint8Array, hex: string, encoding: 'base64'|'hex' = 'base64'): Promise<string> {
  const e = parseEncrypedData(hex, encoding)
  const res = await symmetricDecrypt(privateKey, e)
  return encodeToString(res, 'utf8')
}
