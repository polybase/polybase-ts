
import map from 'lodash/map'
import flatMap from 'lodash/flatMap'
import filter from 'lodash/filter'
import isArray from 'lodash/isArray'
import isObject from 'lodash/isObject'
import mapValues from 'lodash/mapValues'
import { Node } from './types'

export function filterNodes (node: Node, filterFn: (n: Node) => boolean): Node[] {
  if (!node) return []
  if (isArray(node)) return flatMap(node, n => filterNodes(n, filterFn))
  const {
    left, op, right, value, args, prefix,
  } = node as any
  const nodes: Node[] = flatMap(
    filter([left, op, right, value, args, prefix], val => val !== undefined),
    n => filterNodes(n, filterFn),
  )
  if (filterFn(node)) nodes.push(node)
  return nodes
}

const nodeProps = ['left', 'op', 'right', 'value', 'args', 'prefix', 'body', 'params', 'expression']
export function mapNodes (node: Node|Node[], mapFn: (n: Node) => Node): Node|Node[] {
  if (isArray(node)) return map(node, n => mapNodes(n, mapFn)) as Node[]
  const mapped = mapFn(node)
  return mapValues(mapped, (val, key) => {
    if (nodeProps.indexOf(key) > -1) {
      if (isArray(val)) return map(val, n => mapNodes(n, mapFn))
      if (isObject(val)) return mapNodes(val, mapFn)
    }
    return val
  }) as Node
}
