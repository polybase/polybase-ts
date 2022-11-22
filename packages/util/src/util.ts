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
  throw new Error('Invalid encoding, must be either hex, utf8 or base64')
}

export function decodeFromString (data: string, encoding: 'hex'|'base64'|'utf8'): Uint8Array {
  if (encoding === 'hex') {
    if (!data.startsWith('0x')) {
      return arrayify(`0x${data}`)
    }
    return arrayify(data)
  }
  if (encoding === 'utf8') return decodeUTF8(data)
  if (encoding === 'base64') return decodeBase64(data)
  throw new Error('Invalid encoding, must be either hex, utf8 or base64')
}

export function stringifyEncryptedData (data: any, encoding: 'hex'|'base64' = 'hex'): string {
  const obj: any = {}
  Object.keys(data).forEach((key: any) => {
    obj[key] = typeof data[key] === 'string' ? data[key] : encodeToString(data[key] as Uint8Array, encoding)
  })
  const str = JSON.stringify(obj)
  const buf = decodeFromString(str, 'utf8')
  return encodeToString(buf, encoding)
}

export function parseEncrypedData (str: string, encoding: 'hex'|'base64' = 'hex'): any {
  const buf = decodeFromString(str, encoding)
  const data = JSON.parse(encodeToString(buf, 'utf8'))
  const obj: any = {}
  Object.keys(data).forEach((key: any) => {
    if (key === 'version') obj[key] = data[key]
    else obj[key] = decodeFromString(data[key] as string, encoding)
  })
  return obj
}

export function assert (condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed')
  }
}
