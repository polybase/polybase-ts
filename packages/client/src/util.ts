import { CollectionRecord } from './Record'
import type { CallArg, FieldTypes } from './types'
import { Root as AST, Property as ASTProperty, Collection as ASTCollection, CollectionAttribute, ObjectField } from '@polybase/polylang/dist/ast'

export function getCollectionASTFromId(id: string, ast: AST): ASTCollection | undefined {
  return getCollectionASTFromName(getCollectionShortNameFromId(id), ast)
}

export function getCollectionASTFromName(name: string, ast: AST): ASTCollection | undefined {
  const collections = ast.filter((n) => n.kind === 'collection') as ASTCollection[]
  return collections.find((n: ASTCollection) => n.name === name)
}

export function getCollectionProperties(collection: ASTCollection): ASTProperty[] {
  return collection.attributes.filter((a: CollectionAttribute) => a.kind === 'property') as ASTProperty[]
}

export function getCollectionShortNameFromId(id: string): string {
  const name = id.split('/').pop()
  if (!name) throw new Error(`Invalid collection id: ${id}`)
  return name
}

export function encodeBase64(value: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, value as unknown as number[]))
}

export function decodeBase64(value: string): Uint8Array {
  const binaryString = atob(value)

  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes
}

export function referenceArg(arg: CallArg): CallArg {
  if (arg instanceof CollectionRecord) return arg.reference()

  if (Array.isArray(arg)) {
    for (const i in arg) {
      arg[i] = referenceArg(arg[i]) as FieldTypes
    }
  }

  return arg
}

export function serializeValue(arg: CallArg): CallArg {
  if (arg instanceof Uint8Array) return encodeBase64(arg)
  arg = referenceArg(arg)
  return arg
}

export function deserializeRecord(data: Record<string, any>, properties: (ASTProperty | ObjectField)[]) {
  if (!data) return

  for (const property of properties) {
    switch (property.type.kind) {
      case 'primitive':
        switch (property.type.value) {
          case 'bytes':
            if (property.name in data) {
              data[property.name] = decodeBase64(data[property.name])
            }
        }
        break
      case 'object':
        deserializeRecord(data[property.name], property.type.fields)
        break
    }
  }
}
