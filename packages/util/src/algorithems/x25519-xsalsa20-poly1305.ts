import nacl from 'tweetnacl'
import { KeyPair, EncryptedDataX25519 } from '../types'
import { stripPublicKeyPrefix, encodeToString, decodeFromString } from '../util'

export function generateKeyPair (): KeyPair {
  const privateKey = nacl.randomBytes(32)
  return {
    version: 'x25519-xsalsa20-poly1305',
    privateKey,
    publicKey: nacl.box.keyPair.fromSecretKey(privateKey).publicKey,
  }
}

export async function asymmetricEncrypt (publicKey: Uint8Array, data: Uint8Array): Promise<EncryptedDataX25519> {
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
    version: 'x25519-xsalsa20-poly1305',
    nonce,
    ephemPublicKey: ephemeralKeyPair.publicKey,
    ciphertext,
  }
}

export async function asymmetricDecrypt (privateKey: Uint8Array, encryptedData: EncryptedDataX25519): Promise<Uint8Array> {
  const { version, nonce, ephemPublicKey, ciphertext } = encryptedData

  if (version !== 'x25519-xsalsa20-poly1305') {
    throw new Error('Invalid encrypt version')
  }

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

export async function symmetricEncrypt (privateKey: Uint8Array, data: Uint8Array) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const ciphertext = nacl.secretbox(data, nonce, privateKey)

  return {
    version: 'x25519-xsalsa20-poly1305',
    nonce,
    ciphertext,
  }
}

export async function symmetricDecrypt (privateKey: Uint8Array, encryptedData: EncryptedDataX25519) {
  const { ciphertext, nonce } = encryptedData
  return nacl.secretbox.open(ciphertext, nonce, privateKey)
}

export async function asymmetricEncryptToHex (publicKey: Uint8Array, data: string): Promise<string> {
  const e = await asymmetricEncrypt(publicKey, decodeFromString(data, 'utf8'))
  return stringifyEncrypedData(e, 'hex')
}

export async function asymmetricDecryptFromHex (privateKey: Uint8Array, hex: string): Promise<string> {
  const e = parseEncrypedData(hex, 'hex')
  const res = await asymmetricDecrypt(privateKey, e)
  return encodeToString(res, 'utf8')
}

export function stringifyEncrypedData (data: EncryptedDataX25519, encoding: 'hex'|'base64' = 'hex'): string {
  const { version, nonce, ephemPublicKey, ciphertext } = data
  const str = JSON.stringify({
    version,
    nonce: encodeToString(nonce, encoding),
    ephemPublicKey: encodeToString(ephemPublicKey, encoding),
    ciphertext: encodeToString(ciphertext, encoding),
  })
  const buf = decodeFromString(str, 'utf8')
  return encodeToString(buf, encoding)
}

export function parseEncrypedData (str: string, encoding: 'hex'|'base64' = 'hex'): EncryptedDataX25519 {
  const buf = decodeFromString(str, encoding)
  const { version, nonce, ephemPublicKey, ciphertext } = JSON.parse(encodeToString(buf, 'utf8'))
  return {
    version,
    nonce: decodeFromString(nonce, encoding),
    ephemPublicKey: decodeFromString(ephemPublicKey, encoding),
    ciphertext: decodeFromString(ciphertext, encoding),
  }
}
