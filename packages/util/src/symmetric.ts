import { Crypto } from '@peculiar/webcrypto'
import { hexlify } from '@ethersproject/bytes'
import { makeDataSafe } from './util'

const crypto = new Crypto()

const SYMM_KEY_ALGO_PARAMS = {
  name: 'AES-CBC',
  length: 256,
}

export async function generateSymmetricKey (): Promise<CryptoKey> {
  const symmKey = await crypto.subtle.generateKey(SYMM_KEY_ALGO_PARAMS, true, [
    'encrypt',
    'decrypt',
  ])
  return symmKey
}

export async function symmetricEncryptToHex (symmKey: CryptoKey, data: any) {
  const encrypted = await encryptWithSymmetricKeySafely(symmKey, data)
  return hexlify(Buffer.from(encrypted))
}

export async function symmetricDecryptFromHex (symmKey: CryptoKey, hex: string) {
  let h = hex
  if (hex.startsWith('0x')) {
    h = hex.substring(2)
  }
  return decryptWithSymmetricKeySafely(symmKey, Buffer.from(h, 'hex'))
}

export async function encryptWithSymmetricKeySafely (symmKey: CryptoKey, data: any): Promise<ArrayBuffer> {
  return encryptWithSymmetricKey(symmKey, Buffer.from(makeDataSafe(data), 'utf8'))
}

export async function decryptWithSymmetricKeySafely (symmKey: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
  const decrypted = await decryptWithSymmetricKey(symmKey, data)
  return JSON.parse(Buffer.from(decrypted).toString()).data
}

export async function encryptWithSymmetricKey (symmKey: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
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

export async function decryptWithSymmetricKey (symmKey: CryptoKey, encryptedBlob: ArrayBuffer): Promise<ArrayBuffer> {
  const recoveredIv = await encryptedBlob.slice(0, 16)
  const encryptedZipArrayBuffer = await encryptedBlob.slice(16)
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

export async function importSymmetricKey (symmKey: ArrayBuffer): Promise<CryptoKey> {
  const importedSymmKey = await crypto.subtle.importKey(
    'raw',
    symmKey,
    SYMM_KEY_ALGO_PARAMS,
    true,
    ['encrypt', 'decrypt'],
  )

  return importedSymmKey
}
