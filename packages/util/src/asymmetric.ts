import eccrypto from 'eccrypto'
import secp256k1 from 'secp256k1'
import * as nacl from 'tweetnacl'
import { EncryptedData, EncryptedDataVersion } from './types'
import { stringifiableToHex } from './util'

export async function asymmetricEncryptToHex (publicKey: ArrayBuffer|Buffer, data: string, version: EncryptedDataVersion = 'secp256k1'): Promise<string> {
  const e = await asymmetricEncrypt(publicKey, Buffer.from(data), version)
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

/**
 * Encrypt a message with a public key, asymmetric encryption
 *
 * @param {string} publicKey  - The public key of the message recipient.
 * @param {string} data - The message data.
 * @param {string} version - Version either: x25519-xsalsa20-poly1305 or secp256k1
 * @returns {EncryptedData} The encrypted data.
 */

export async function asymmetricEncrypt (
  publicKey: ArrayBuffer|Buffer,
  data: ArrayBuffer|Buffer,
  version: EncryptedDataVersion = 'secp256k1',
): Promise<EncryptedData> {
  if (version === 'x25519-xsalsa20-poly1305') {
    const ephemeralKeyPair = nacl.box.keyPair()
    const nonce = nacl.randomBytes(nacl.box.nonceLength)
    const pk = stripPublicKeyPrefix(compressPublicKey(new Uint8Array(publicKey)))
    const encryptedMessage = nacl.box(
      new Uint8Array(data),
      nonce,
      pk,
      ephemeralKeyPair.secretKey,
    )
    return {
      version,
      nonce: Buffer.from(nonce),
      ephemPublicKey: Buffer.from(ephemeralKeyPair.publicKey),
      ciphertext: Buffer.from(encryptedMessage),
    }
  }

  if (version === 'secp256k1') {
    const res = await eccrypto.encrypt(Buffer.from(addPublicKeyPrefix(new Uint8Array(publicKey))), Buffer.from(data))
    return {
      version,
      nonce: res.iv,
      ephemPublicKey: res.ephemPublicKey,
      ciphertext: res.ciphertext,
      mac: res.mac,
    }
  }

  throw new Error('Encryption type/version not supported')
}

/**
 * Decrypt a message with a private key, asymmetric encryption
 *
 * @param {string} privateKey  - private key to decrypt with
 * @param {EncryptedData} encryptedData - data to decrypt
 * @returns {string} decrypted data
 */

export async function asymmetricDecrypt (privateKey: ArrayBuffer|Buffer, encryptedData: EncryptedData): Promise<Buffer> {
  const { version, nonce, ephemPublicKey, ciphertext } = encryptedData

  if (version === 'x25519-xsalsa20-poly1305') {
    const recieverEncryptionPrivateKey = nacl.box.keyPair.fromSecretKey(
      new Uint8Array(privateKey),
    ).secretKey

    const decryptedMessage = nacl.box.open(
      new Uint8Array(ciphertext),
      new Uint8Array(nonce),
      ephemPublicKey,
      recieverEncryptionPrivateKey,
    )
    if (!decryptedMessage) throw new Error('unable to decrypt')
    return Buffer.from(decryptedMessage)
  }

  if (encryptedData.version === 'secp256k1') {
    return eccrypto.decrypt(Buffer.from(privateKey), {
      iv: nonce,
      ephemPublicKey,
      ciphertext,
      mac: encryptedData.mac,
    })
  }

  throw new Error('Encryption version not supported')
}

export function hexStringToBuffer (hex: string): Buffer {
  let h = hex
  if (hex.startsWith('0x')) {
    h = hex.substring(2)
  }
  return Buffer.from(h, 'hex')
}

export function compressPublicKey (publicKey: Uint8Array): Uint8Array {
  if (publicKey.byteLength === 65) return secp256k1.publicKeyConvert(publicKey, true)
  if (publicKey.byteLength === 64) return secp256k1.publicKeyConvert(addPublicKeyPrefix(publicKey), true)
  return publicKey
}

export function stripPublicKeyPrefix (publicKey: Uint8Array): Uint8Array {
  if (publicKey.byteLength % 32 === 0) return publicKey
  return publicKey.slice(1)
}

export function addPublicKeyPrefix (publicKey: Uint8Array): Uint8Array {
  if (publicKey.byteLength === 64) return Buffer.concat([Buffer.from([0x4]), publicKey])
  return publicKey
}

export function stringifyEncrypedData (data: EncryptedData, encoding: 'hex'|'base64' = 'hex') {
  const { version, nonce, ephemPublicKey, ciphertext } = data
  return stringifiableToHex({
    version,
    nonce: nonce.toString(encoding),
    ephemPublicKey: ephemPublicKey.toString(encoding),
    ciphertext: ciphertext.toString(encoding),
    mac: data.version === 'secp256k1' ? data.mac.toString(encoding) : undefined,
  })
}

export function parseEncrypedData (str: string, encoding: 'hex'|'base64' = 'hex'): EncryptedData {
  const buf = encoding === 'hex' ? hexStringToBuffer(str) : Buffer.from(str, 'base64')
  const { version, nonce, ephemPublicKey, ciphertext, mac } = JSON.parse(buf.toString('utf8'))
  return {
    version,
    nonce: Buffer.from(nonce, encoding),
    ephemPublicKey: Buffer.from(ephemPublicKey, encoding),
    ciphertext: Buffer.from(ciphertext, encoding),
    mac: version === 'secp256k1' ? Buffer.from(mac, encoding) : undefined,
  }
}
