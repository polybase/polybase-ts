import { crypto } from '../crypto'
import { randomBytes } from '../randombytes'
import { EncryptedDataAesCbc256 } from '../types'
import { stringifyEncryptedData, parseEncrypedData, decodeFromString, encodeToString } from '../util'

const SYMM_KEY_ALGO_PARAMS = {
  name: 'AES-CBC',
  length: 256,
}

/**
 * Generate a symmetric encryption key
 *
 * @returns secret key
 */

export function generateSecretKey (): Uint8Array {
  return randomBytes(32)
}

/**
 * Symetric encrypt data
 *
 * @returns encrypted data
 */

export async function symmetricEncrypt (symmKey: Uint8Array, data: Uint8Array): Promise<EncryptedDataAesCbc256> {
  const key = await importKey(symmKey)
  const iv = crypto.getRandomValues(new Uint8Array(16))

  const encrypted = await crypto.subtle.encrypt(
    { name: SYMM_KEY_ALGO_PARAMS.name, iv },
    key,
    data,
  )

  return {
    version: 'aes-cbc-256/symmetric',
    nonce: iv,
    ciphertext: new Uint8Array(encrypted),
  }
}

/**
 * Decrypt data, encrypted with symmetricEncrypt()
 *
 * @returns decrypted data
 */

export async function symmetricDecrypt (symmKey: Uint8Array, encryptedData: EncryptedDataAesCbc256): Promise<Uint8Array> {
  const key = await importKey(symmKey)
  const decryptedZip = await crypto.subtle.decrypt(
    {
      name: SYMM_KEY_ALGO_PARAMS.name,
      iv: encryptedData.nonce,
    },
    key,
    encryptedData.ciphertext,
  )
  return new Uint8Array(decryptedZip)
}

/**
 * Import a key
 *
 * @returns CryptoKey interface of the Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey
 */

export async function importKey (symmKey: Uint8Array): Promise<CryptoKey> {
  const importedSymmKey = await crypto.subtle.importKey(
    'raw',
    symmKey,
    SYMM_KEY_ALGO_PARAMS,
    true,
    ['encrypt', 'decrypt'],
  )

  return importedSymmKey
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
