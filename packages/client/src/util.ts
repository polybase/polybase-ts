import { Program, Contract } from '@polybase/polylang'
import { Doc } from './Doc'
import type { CallArgs } from './types'

export function validateCallParameters (contractId: string, functionName: string, ast: Program, args: CallArgs) {
  const funcAST = getContractAST(contractId, ast).items.find((f: any) => f?.Function?.name === functionName)?.Function
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
      case 'Record':
        if (!(ourArg instanceof Doc)) throw new Error(`Argument ${param} must be a record`)
        break
    }
  }
}

export function getContractAST (id: string, ast: Program): Contract {
  const name = getContractShortNameFromId(id)
  return ast.nodes.find(c => c.Contract?.name === name)?.Contract
}

export function getContractShortNameFromId (id: string) {
  return id.split('/').pop()
}
