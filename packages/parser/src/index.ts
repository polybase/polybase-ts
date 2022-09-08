/* eslint-disable-next-line import/no-unresolved, import/extensions */
import grammer from './lexer'

export { default as parse } from './parse'
export { default as unparse } from './unparse'
export { filterNodes, mapNodes } from './util'

export type {
  Node,
  BaseNode,
  ArrayNode,
  ObjectNode,
  ObjectKeyValueNode,
  OperatorNode,
  OperatorOpNode,
  FunctionNode,
  NameNode,
  PrimitiveNode,
  NotNode,
  NegateNode,
} from './types'

export default grammer
