import { Program, Collection } from '@polybase/polylang'
import { CollectionRecord } from './Record'
import type { CallArgs } from './types'

export function validateCallParameters (collectionId: string, functionName: string, ast: Program, args: CallArgs) {
  const funcAST = getCollectionAST(collectionId, ast).items.find((f: any) => f?.Function?.name === functionName)?.Function
  if (!funcAST) throw new Error('Function not found')

  for (const param in funcAST.parameters) {
    const ourArg = args[param as any]
    const expectedType = funcAST.parameters[param as any].type_
    switch (expectedType) {
      case 'String':
        if (typeof ourArg !== 'string') throw new Error(`Argument ${param} must be a string`)
        break
      case 'Number':
        if (typeof ourArg !== 'number') throw new Error(`Argument ${param} must be a number`)
        break
      case 'Boolean':
        if (typeof ourArg !== 'boolean') throw new Error(`Argument ${param} must be a boolean`)
        break
      case 'Record':
        if (!(ourArg && typeof ourArg === 'object' && ourArg instanceof CollectionRecord)) throw new Error(`Argument ${param} must be a record`)
        break
    }
  }
}

export function getCollectionAST (id: string, ast: Program): Collection {
  const name = getCollectionShortNameFromId(id)
  return ast.nodes.find(c => c.Collection?.name === name)?.Collection
}

export function getCollectionShortNameFromId (id: string) {
  return id.split('/').pop()
}
