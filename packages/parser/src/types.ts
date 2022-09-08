export type Node = ArrayNode|ObjectNode|OperatorNode|
PrimitiveNode|NotNode|NegateNode|FunctionNode|FunctionCallNode|NameNode|
ReturnNode

export type StatementNode = ReturnNode

export interface BaseNode {
  col: number
  line: number
  lineBreaks: number
  offset: number
  text: string
  parenthesized?: boolean
  bracket?: boolean
  prefix?: Node|null
}

export interface FieldNode extends BaseNode {
  type: 'field'
  name: NameNode
  kind: NameNode
  required: true
}

export interface IndexNode extends BaseNode {
  type: 'index'
  fields: IndexFieldNode[]
}

export interface IndexFieldNode extends BaseNode {
  type: 'index.fields'
  field: NameNode
  direction?: 'asc'|'desc'
}

export interface ArrayNode extends BaseNode {
  type: 'array'
  value: Node[]
}

export interface ObjectNode extends BaseNode {
  type: 'object'
  value: ObjectKeyValueNode[]
}

export interface ObjectKeyValueNode extends BaseNode {
  key: PrimitiveNode
  value: Node
}

export interface OperatorNode extends BaseNode {
  type: 'concat'|'or'|'and'|'compare'|'sum'|'product'|'power'
  left: Node
  op: OperatorOpNode
  right: Node
}

export interface OperatorOpNode extends BaseNode {
  type: 'concat'|'or'|'and'|'gte'|'lte'|'gt'|'lt'|'gt'|'lt'|'eq'|'neq'|'plus'|'minus'|'times'|'divide'|'percent'|'power'
}

export interface FunctionNode extends BaseNode {
  type: 'function'
  name: NameNode
  params: Node[]
  body: StatementNode[]
}

export interface FunctionCallNode extends BaseNode {
  type: 'call'
  args: Node[]
  // prefix: Node
}

export interface ReturnNode extends BaseNode {
  type: 'return'
  expression: Node
}

export interface NameNode extends BaseNode {
  type: 'name'
  value: string
}

export interface PrimitiveNode extends BaseNode {
  type: 'number'|'string'|'boolean'
  value: string
}

export interface NotNode extends BaseNode {
  type: 'not'
  value: Node
}

export interface NegateNode extends BaseNode {
  type: 'negate'
  value: Node
}
