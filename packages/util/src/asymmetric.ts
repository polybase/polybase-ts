
import eccrypto from 'eccrypto'
import { stringifiableToHex } from './util'

export async function asymmetricEncryptToHex (publicKey: ArrayBuffer|Buffer, data: string): Promise<string> {
  const e = await asymmetricEncrypt(publicKey, Buffer.from(data))
  return stringifyEncrypedData(e, 'hex')
}

export async function asymmetricDecryptFromHex (privateKey: ArrayBuffer|Buffer, hex: string): Promise<string> {
  const e = parseEncrypedData(hex, 'hex')
  const res = await asymmetricDecrypt(privateKey, e)
  return Buffer.from(res).toString()
}

/**
 * @deprecated use asymmetricEncryptToHex()
 */
export const encryptToHex = asymmetricEncryptToHex

/**
 * @deprecated use asymmetricDecryptFromHex()
 */
export const decryptFromHex = asymmetricDecryptFromHex

export interface EncryptedData extends eccrypto.Ecies {
  version: string;
}

/**
 * Encrypt a message with a public key, asymmetric encryption
 *
 * @param {string} publicKey  - The public key of the message recipient.
 * @param {string} data - The message data.
 * @returns {EncryptedData} The encrypted data.
 */

export async function asymmetricEncrypt (publicKey: ArrayBuffer|Buffer, data: ArrayBuffer|Buffer): Promise<EncryptedData> {
  const res = await eccrypto.encrypt(normalizePublicKey(Buffer.from(publicKey)), Buffer.from(data))

  return {
    version: 'secp256k1',
    ...res,
  }
}

/**
 * Decrypt a message with a private key, asymmetric encryption
 *
 * @param {string} privateKey  - private key to decrypt with
 * @param {EncryptedData} encryptedData - data to decrypt
 * @returns {string} decrypted data
 */

export async function asymmetricDecrypt (privateKey: ArrayBuffer|Buffer, encryptedData: EncryptedData): Promise<Buffer> {
  if (encryptedData.version !== 'secp256k1') {
    throw new Error('Encryption type/version not supported')
  }

  return eccrypto.decrypt(Buffer.from(privateKey), encryptedData)
}

export function hexStringToBuffer (hex: string): Buffer {
  let h = hex
  if (hex.startsWith('0x')) {
    h = hex.substring(2)
  }
  return Buffer.from(h, 'hex')
}

export function normalizePublicKey (publicKey: Buffer) {
  if (publicKey.byteLength === 64) return Buffer.concat([Buffer.from([0x4]), publicKey])
  return publicKey
}

export function stringifyEncrypedData (data: EncryptedData, encoding: 'hex'|'base64' = 'hex') {
  const { version, iv, ephemPublicKey, ciphertext, mac } = data
  return stringifiableToHex({
    version,
    iv: iv.toString(encoding),
    ephemPublicKey: ephemPublicKey.toString(encoding),
    ciphertext: ciphertext.toString(encoding),
    mac: mac.toString(encoding),
  })
}

export function parseEncrypedData (str: string, encoding: 'hex'|'base64' = 'hex'): EncryptedData {
  const buf = encoding === 'hex' ? hexStringToBuffer(str) : Buffer.from(str, 'base64')
  const { version, iv, ephemPublicKey, ciphertext, mac } = JSON.parse(buf.toString('utf8'))
  return {
    version,
    iv: Buffer.from(iv, encoding),
    ephemPublicKey: Buffer.from(ephemPublicKey, encoding),
    ciphertext: Buffer.from(ciphertext, encoding),
    mac: Buffer.from(mac, encoding),
  }
}
