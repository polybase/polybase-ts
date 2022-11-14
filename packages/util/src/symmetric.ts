import { Crypto } from '@peculiar/webcrypto'
import { hexlify } from '@ethersproject/bytes'

const crypto = new Crypto()

const SYMM_KEY_ALGO_PARAMS = {
  name: 'AES-CBC',
  length: 256,
}

/**
 * Generate a symmetric encryption key
 *
 * @returns {Promise<CryptoKey>} The CryptoKey interface of the Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey
 */

export async function symmetricGenerateKey (): Promise<CryptoKey> {
  const symmKey = await crypto.subtle.generateKey(SYMM_KEY_ALGO_PARAMS, true, [
    'encrypt',
    'decrypt',
  ])
  return symmKey
}

/**
 * Encrypt a string, and encrypted string in hex format
 *
 * @param {CryptoKey} symmKey  - CryptoKey interface of the Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey
 * @param {string} data - The message data
 * @returns {Promise<string>} Encrypted string as hex
 */

export async function symmetricEncryptToHex (symmKey: CryptoKey, data: string): Promise<string> {
  const encrypted = await symmetricEncrypt(symmKey, Buffer.from(data, 'utf8'))
  return hexlify(Buffer.from(encrypted))
}

/**
 * Decrypt a string encrypted with symmetricEncryptToHex()
 *
 * @param {CryptoKey} symmKey  - CryptoKey interface of the Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey
 * @param {string} hex - Encrypted string in hex format
 * @returns {Promise<string>} Encrypted string as hex
 */

export async function symmetricDecryptFromHex (symmKey: CryptoKey, hex: string): Promise<string> {
  let h = hex
  if (hex.startsWith('0x')) {
    h = hex.substring(2)
  }
  const res = await symmetricDecrypt(symmKey, Buffer.from(h, 'hex'))
  return Buffer.from(res).toString('utf8')
}

/**
 * Encrypt data
 *
 * @param {CryptoKey} symmKey  - CryptoKey interface of the Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey
 * @param {ArrayBuffer} data - The message data
 * @returns {Promise<ArrayBuffer>} - Encrypted data
 */

export async function symmetricEncrypt (symmKey: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(16))

  const encrypted = await crypto.subtle.encrypt(
    { name: SYMM_KEY_ALGO_PARAMS.name, iv },
    symmKey,
    data,
  )

  const buff = new Uint8Array(iv.byteLength + encrypted.byteLength)
  buff.set(iv, 0)
  buff.set(new Uint8Array(encrypted), iv.byteLength)

  return buff
}

/**
 * Decrypt data, encrypted with symmetricEncrypt()
 *
 * @param {CryptoKey} symmKey  - CryptoKey interface of the Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey
 * @param {ArrayBuffer} encryptedData - Encrypted data
 * @returns {Promise<ArrayBuffer>} - Decrypted data
 */

export async function symmetricDecrypt (symmKey: CryptoKey, encryptedData: ArrayBuffer): Promise<ArrayBuffer> {
  const recoveredIv = await encryptedData.slice(0, 16)
  const encryptedZipArrayBuffer = await encryptedData.slice(16)
  const decryptedZip = await crypto.subtle.decrypt(
    {
      name: SYMM_KEY_ALGO_PARAMS.name,
      iv: recoveredIv,
    },
    symmKey,
    encryptedZipArrayBuffer,
  )
  return decryptedZip
}

/**
 * Import a key (if using own key implementation)
 *
 * @param {ArrayBuffer} symmKey  - key to import
 * @returns {Promise<CryptoKey>} - CryptoKey interface of the Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey
 */

export async function symmetricImportKey (symmKey: ArrayBuffer): Promise<CryptoKey> {
  const importedSymmKey = await crypto.subtle.importKey(
    'raw',
    symmKey,
    SYMM_KEY_ALGO_PARAMS,
    true,
    ['encrypt', 'decrypt'],
  )

  return importedSymmKey
}
