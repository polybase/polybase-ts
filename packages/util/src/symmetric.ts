
import { Crypto } from '@peculiar/webcrypto'
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

export async function decryptWithSymmetricKey (encryptedBlob: ArrayBuffer, symmKey: any): Promise<ArrayBuffer> {
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

export async function importSymmetricKey (symmKey: Uint8Array): Promise<CryptoKey> {
  const importedSymmKey = await crypto.subtle.importKey(
    'raw',
    symmKey,
    SYMM_KEY_ALGO_PARAMS,
    true,
    ['encrypt', 'decrypt'],
  )

  return importedSymmKey
}
