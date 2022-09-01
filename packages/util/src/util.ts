import { hexlify } from '@ethersproject/bytes'

export function stringifiableToHex (value: any) {
  return hexlify(Buffer.from(JSON.stringify(value)))
}

export function isNullish (value: any) {
  return value === null || value === undefined
}
