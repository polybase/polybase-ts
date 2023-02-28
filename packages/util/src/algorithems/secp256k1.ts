import secp256k1 from 'secp256k1'
import elliptic from 'elliptic'
import { concat, joinSignature, BytesLike } from '@ethersproject/bytes'
import { SigningKey } from '@ethersproject/signing-key'
import { randomBytes } from '../randombytes'
import { addPublicKeyPrefix, assert, encodeToString, decodeFromString, stringifyEncryptedData, parseEncrypedData } from '../util'
import { crypto } from '../crypto'
import { EncryptedDataSecp256k1 } from '../types'

const EC = elliptic.ec
const ec = new EC('secp256k1')

/**
 * Generate private key
 *
 * @returns public/private key pair
 */
export function generatePrivateKey (): Uint8Array {
  return randomBytes(32)
}

/**
 * Generate public/private key pairs
 *
 * @returns public/private key pair
 */
export async function generateKeyPair () {
  const privateKey = generatePrivateKey()
  return {
    version: 'x25519-xsalsa20-poly1305/asymmetric',
    privateKey,
    publicKey: secp256k1.publicKeyCreate(privateKey),
  }
}

/**
 * Generate 65-byte uncompressed public key from private key
 *
 * @returns public key
 */
export function getPublicKey (privateKey: Uint8Array): Uint8Array {
  return secp256k1.publicKeyCreate(privateKey, false)
}

/**
 * Generate 65-byte uncompressed public key from private key
 *
 * @returns public key
 */
export function getPublicCompressed (privateKey: Uint8Array): Uint8Array {
  return secp256k1.publicKeyCreate(privateKey, true)
}

export function compressPublicKey (publicKey: Uint8Array): Uint8Array {
  if (publicKey.byteLength === 65) return secp256k1.publicKeyConvert(publicKey, true)
  if (publicKey.byteLength === 64) return secp256k1.publicKeyConvert(addPublicKeyPrefix(publicKey), true)
  return publicKey
}

/**
 * Derive shared key
 *
 * @returns shared key
 */
export async function derive (privateKeyA: Uint8Array, publicKeyB: Uint8Array) {
  assert(privateKeyA.length === 32, 'Bad private key length, expected 32 got ' + privateKeyA.length)
  assert(
    publicKeyB.length === 65 || publicKeyB.length === 33,
    'Bad public key length, expected either 33 or 65 got ' + publicKeyB.length,
  )
  if (publicKeyB.length === 65) assert(publicKeyB[0] === 4, 'Bad public key prefix')
  if (publicKeyB.length === 33) assert(publicKeyB[0] === 2 || publicKeyB[0] === 3, 'Bad public key prefix')

  const keyA = ec.keyFromPrivate(privateKeyA)
  const keyB = ec.keyFromPublic(publicKeyB)
  const Px = keyA.derive(keyB.getPublic()) // BN instance
  return new Uint8Array(Px.toArray())
}

/**
 * Asymmetric encrypt bytes
 *
 * @returns encrypted data
 */
export async function asymmetricEncrypt (publicKey: Uint8Array, data: Uint8Array): Promise<EncryptedDataSecp256k1> {
  const publicKeyTo = addPublicKeyPrefix(publicKey)
  const ephemPrivateKey = generatePrivateKey()
  const ephemPublicKey = new Uint8Array(ec.keyFromPrivate(ephemPrivateKey).getPublic('array'))

  const px = await derive(ephemPrivateKey, publicKeyTo)
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-512', px))

  const iv = randomBytes(16)
  const macKey = hash.slice(32)

  const encryptionKey = await importAesCbcKey(hash.slice(0, 32))
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    encryptionKey,
    data,
  ))
  const dataToMac = concat([iv, ephemPublicKey, ciphertext])
  const mac = await signHmac(macKey, dataToMac)

  return {
    version: 'secp256k1/asymmetric/v2',
    nonce: iv,
    ciphertext,
    ephemPublicKey,
    mac,
  }
}

/**
 * Asymmetric decrypt bytes
 *
 * @returns decrypted bytes
 */
export async function asymmetricDecrypt (privateKey: Uint8Array, data: EncryptedDataSecp256k1): Promise<Uint8Array> {
  const { version, ephemPublicKey, mac, nonce, ciphertext } = data
  const px = await derive(privateKey, ephemPublicKey)

  let hash: Uint8Array
  let macKey: Uint8Array
  switch (version) {
    case 'secp256k1/asymmetric/v2':
      hash = new Uint8Array(await crypto.subtle.digest('SHA-512', px))
      macKey = hash.slice(32)
      break
      // In v1, the hash is SHA256, macKey is a 32-byte array of all zeros.
    case 'secp256k1/asymmetric':
      hash = new Uint8Array(await crypto.subtle.digest('SHA-256', px))
      macKey = new Uint8Array(32)
      break
  }

  // This is not in `default` case so that we get a Typescript error
  // if we add a new version.
  if (!hash) throw new Error('Unsupported version: ' + version)

  const dataToMac = concat([nonce, ephemPublicKey, ciphertext])

  const valid = await verifyHmac(macKey, mac, dataToMac)
  if (!valid) {
    throw new Error('Bad MAC')
  }

  const encryptionKey = await importAesCbcKey(hash.slice(0, 32))
  return new Uint8Array(await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: nonce },
    encryptionKey,
    ciphertext,
  ))
}

/**
 * Sign bytes
 */
export function sign (privateKey: BytesLike, d: BytesLike): string {
  const signingKey = new SigningKey(privateKey)
  const signature = signingKey.signDigest(d)
  const sig = joinSignature(signature)
  return sig
}

async function signHmac (key: Uint8Array, data: Uint8Array) {
  const hmacKey = await importHmacKey(key)
  const sig = await crypto.subtle.sign(
    'HMAC',
    hmacKey,
    data,
  )

  return new Uint8Array(sig)
}

async function verifyHmac (key: Uint8Array, sig: Uint8Array, data: Uint8Array) {
  const hmacKey = await importHmacKey(key)
  return crypto.subtle.verify(
    'HMAC',
    hmacKey,
    sig,
    data,
  )
}

async function importHmacKey (key: Uint8Array) {
  return crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )
}

async function importAesCbcKey (key: Uint8Array) {
  return crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt'],
  )
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
