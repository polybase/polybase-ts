import { mapNodes } from '../util'
import parse from '../parse'

const exp = (str: string) => `function Hello () {\nreturn ${str}\n}`

describe('util', () => {
  describe('Map Nodes', () => {
    test('Map number without mod', () => {
      const ast = parse(exp('10'))
      expect(mapNodes(ast, node => ({ ...node }))).toEqual(ast)
    })

    test('Map complex without mod', () => {
      const ast = parse(exp('(10 * 10) + "hello" / func(name)'))
      expect(mapNodes(ast, node => ({ ...node }))).toEqual(ast)
    })

    test('Map and change number value', () => {
      const ast = parse(exp('10'))
      expect(mapNodes(ast, (node) => {
        if (node.type === 'number') return { ...node, text: '11', value: '11' }
        return node
      })).toEqual(parse(exp('11')))
    })

    test('Map and change function name value', () => {
      const ast = parse(exp('10 / func(name)'))
      expect(mapNodes(ast, (node: any) => {
        if (node.type !== 'function') return node
        return { ...node, prefix: { ...node.prefix, value: 'altFunc', text: 'altFunc' } }
      })).toMatchSnapshot()
    })
  })
})
