import { hexlify } from '@ethersproject/bytes'

const DEFAULT_PADDING_LENGTH = 2 ** 11
const NACL_EXTRA_BYTES = 16

export function stringifiableToHex (value: any) {
  return hexlify(Buffer.from(JSON.stringify(value)))
}

export function isNullish (value: any) {
  return value === null || value === undefined
}

export function makeDataSafe (data: any): string {
  if (isNullish(data)) {
    throw new Error('Missing data')
  }

  if (data && typeof data === 'object' && 'toJSON' in data) {
    // remove toJSON attack vector
    // TODO, check all possible children
    throw new Error(
      'Cannot encrypt with toJSON property.  Please remove toJSON property',
    )
  }

  // add padding
  const dataWithPadding = {
    data,
    padding: '',
  }

  const dataLength = Buffer.byteLength(
    JSON.stringify(dataWithPadding),
    'utf-8',
  )
  const modVal = dataLength % DEFAULT_PADDING_LENGTH
  let padLength = 0
  // Only pad if necessary
  if (modVal > 0) {
    padLength = DEFAULT_PADDING_LENGTH - modVal - NACL_EXTRA_BYTES // nacl extra bytes
  }
  dataWithPadding.padding = '0'.repeat(padLength)

  return JSON.stringify(dataWithPadding)
}
