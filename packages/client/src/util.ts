import { CollectionRecord } from './Record'
import type { CallArg, FieldTypes } from './types'

export function getCollectionAST (id: string, ast: any): any {
  const name = getCollectionShortNameFromId(id)
  return ast.filter((n: any) => n.kind === 'collection').find((n: any) => n.name === name)
}

export function getCollectionProperties (id: string, ast: any): any {
  return getCollectionAST(id, ast).attributes.filter((a: any) => a.kind === 'property')
}

export function getCollectionShortNameFromId (id: string) {
  return id.split('/').pop()
}

export function encodeBase64 (value: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, value as unknown as number[]))
}

export function decodeBase64 (value: string): Uint8Array {
  const binaryString = atob(value)

  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes
}

export function referenceArg (arg: CallArg): CallArg {
  if (arg instanceof CollectionRecord) return arg.reference()

  if (Array.isArray(arg)) {
    for (const i in arg) {
      arg[i] = referenceArg(arg[i]) as FieldTypes
    }
  }

  return arg
}

export function serializeValue (arg: CallArg): CallArg {
  if (arg instanceof Uint8Array) return encodeBase64(arg)

  arg = referenceArg(arg)

  return arg
}
