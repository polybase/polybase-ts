import {
  Node, ArrayNode, ObjectNode, OperatorNode, FunctionCallNode, FunctionNode, NameNode,
} from './types'

export default function unparse (node: Node|Node[]|null): string {
  if (node === null) return ''
  if (Array.isArray(node)) {
    return node.map((n) => unparse(n)).join('\n')
  }
  if (node.parenthesized) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { parenthesized, ...rest } = node
    return `(${unparse(rest)})`
  }
  if (node.bracket) {
    return unparseBracket(node)
  }
  switch (node.type) {
    case 'number':
    case 'string':
    case 'boolean':
      return node.text
    case 'return':
        return `return ${unparse(node.expression)}`
    case 'array':
      return unparseArray(node)
    case 'object':
      return unparseObject(node)
    case 'concat':
    case 'or':
    case 'and':
    case 'compare':
    case 'sum':
    case 'product':
    case 'power':
      return unparseOperator(node)
    case 'not':
      return `!${unparse(node.value)}`
    case 'negate':
      return `-${unparse(node.value)}`
    case 'function':
      return unparseFunction(node)
    case 'call':
      return unparseFunctionCall(node)
    case 'name':
      return unparseName(node)
    default: throw new Error(`Unknown type: ${(node as any)?.type}: ${JSON.stringify(node)}`)
  }
}

export function unparseBracket (node: Node) {
  const prefix = node.prefix ? unparse(node.prefix) : ''
  return `${prefix}[${unparse({ ...node, prefix: null, bracket: false })}]`
}

export function unparseArray (node: ArrayNode) {
  if (!node.value) return '[]'
  const items = node.value.map(n => unparse(n))
  return `[${items.join(', ')}]`
}

export function unparseObject (node: ObjectNode) {
  if (!node.value) return '{}'
  const pairs = node.value.map((n): string => `${n.key.text}: ${unparse(n.value)}`)
  return pairs.length ? `{ ${pairs.join(', ')} }` : '{}'
}

export function unparseOperator (node: OperatorNode): string {
  const { left, op, right } = node
  return `${unparse(left)} ${op.text} ${unparse(right)}`
}

export function unparseFunction (node: FunctionNode) {
  const { name, body, params = [] } = node
  const argItems = params.map(n => unparse(n))
  return `function ${name.text} (${argItems.join(', ')}) {\n${body.map((n) => unparse(n)).join('\n')}\n}`
}


export function unparseFunctionCall (node: FunctionCallNode) {
  const { prefix, args = [] } = node
  const argItems = args.map(n => unparse(n))
  return `${prefix ? unparse(prefix) : ''}(${argItems.join(', ')})`
}

export function unparseName (node: NameNode) {
  if (node.type !== 'name') return node.text
  if (!node.prefix) return node.text
  return `${unparse(node.prefix)}${'.'}${node.text}`
}

