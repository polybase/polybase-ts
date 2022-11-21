import { arrayify, hexlify } from '@ethersproject/bytes'
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util'

export function stringifiableToHex (value: any) {
  return hexlify(Buffer.from(JSON.stringify(value)))
}

export function isNullish (value: any) {
  return value === null || value === undefined
}

export function stripPublicKeyPrefix (publicKey: Uint8Array): Uint8Array {
  if (publicKey.byteLength % 32 === 0) return publicKey
  return publicKey.slice(1)
}

export function addPublicKeyPrefix (publicKey: Uint8Array): Uint8Array {
  if (publicKey.byteLength === 64) return Buffer.concat([Buffer.from([0x4]), publicKey])
  return publicKey
}

export function encodeToString (data: Uint8Array, encoding: 'hex'|'base64'|'utf8'): string {
  if (encoding === 'hex') return hexlify(data)
  if (encoding === 'utf8') return encodeUTF8(data)
  if (encoding === 'base64') return encodeBase64(data)
  throw new Error('Invalid encoding, must be either hex or base64')
}

export function decodeFromString (data: string, encoding: 'hex'|'base64'|'utf8'): Uint8Array {
  if (encoding === 'hex') return arrayify(data)
  if (encoding === 'utf8') return decodeUTF8(data)
  if (encoding === 'base64') return decodeBase64(data)
  throw new Error('Invalid encoding, must be either hex or base64')
}
