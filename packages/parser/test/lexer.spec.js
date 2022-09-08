import nearley from 'nearley'
import grammar from '../dist/lexer'
import '../dist/parse'

describe('root', () => {
  let parse
  beforeEach(() => {
    parse = (str) => {
      const res = new nearley.Parser(nearley.Grammar.fromCompiled(grammar)).feed(str).results
      expect(res).toHaveLength(1)
      return res[0]
    }
  })

  test('complex example', () => {
    const res = parse(`
      collection Account {
        name: string
        age: number
        balance: number
        publicKey: string
      
      
        function transfer (a, b, amount) {
          if a.publicKey == auth.publicKey {
            return error('invalid user')
          }

          a.balance = amount
          a.balance += amount
          a.balance -= amount

          return a
        }
      }
    `)

    expect(res).toMatchSnapshot()
  })

  describe('collections', () => {
    test('single field', () => {
      const res = parse(`
        collection HelloWorld {
          hello string
        }
      `)
  
      expect(res).toMatchObject([{
        type: 'collection',
        name: {
          value: 'HelloWorld',
        },
        fields: [{
          type: 'field',
          name: {
            value: 'hello'
          },
          type: {
            value: 'string'
          }
        }]
      }])
      expect(res).toMatchSnapshot()
    })
  
    test('multiple field types', () => {
      const res = parse(`
        collection HelloWorld {
          hello string;
          world number
          flag: boolean
        }
      `)
  
      expect(res).toMatchObject([{
        type: 'collection',
        name: {
          value: 'HelloWorld',
        },
        fields: [{
          type: 'field',
          name: {
            value: 'hello'
          },
          type: {
            value: 'string'
          }
        }, {
          type: 'field',
          name: {
            value: 'world'
          },
          type: {
            value: 'number'
          }
        }, {
          type: 'field',
          name: {
            value: 'flag'
          },
          type: {
            value: 'boolean'
          }
        }]
      }])
      expect(res).toMatchSnapshot()
    })

    test('multiple collections', () => {
      const res = parse(`
        collection Hello {
          hello string
        }

        collection World {
          world string
        }
      `)
  
      expect(res).toMatchObject([{
        type: 'collection',
        name: {
          value: 'Hello',
        },
        fields: [{
          type: 'field',
          name: {
            value: 'hello'
          },
          type: {
            value: 'string'
          }
        }]
      }, {
        type: 'collection',
        name: {
          value: 'World',
        },
        fields: [{
          type: 'field',
          name: {
            value: 'world'
          },
          type: {
            value: 'string'
          }
        }]
      }])
      expect(res).toMatchSnapshot()
    })

    test('function in collection', () => {
      const res = parse(`
        collection Hello {
          hello string

          function HelloWorld () {
            return a
          }
        }
      `)
  
      expect(res).toMatchObject([{
        type: 'collection',
        name: {
          value: 'Hello',
        },
        fields: [{
          type: 'field',
          name: {
            value: 'hello'
          },
          type: {
            value: 'string'
          }
        }, {
          type: 'function',
          name: {
            value: 'HelloWorld',
          },
          params: [],
          body: [{
            type: 'return',
            expression: {
              type: 'name',
              value: 'a',
            }
          }]
        }]
      }])
    })
  })

  describe('functions', () => {
    test('parses function block', () => {
      const res = parse(`
        function HelloWorld () {
          return a
        }
      `)
  
      expect(res).toMatchObject([{
        type: 'function',
        name: {
          value: 'HelloWorld',
        },
        params: [],
        body: [{
          type: 'return',
          expression: {
            type: 'name',
            value: 'a',
          }
        }]
      }])
      expect(res).toMatchSnapshot()
    })

    test('parses function with multiple blocks', () => {
      const res = parse(`
        function HelloWorld () {
          const a = 1
          return a
        }
      `)
  
      expect(res).toMatchObject([{
        type: 'function',
        name: {
          value: 'HelloWorld',
        },
        params: [],
        body: [{
          type: 'const', 
          name: {
            type: 'name',
            value: 'a',
          }, 
          expression: {
            value: '1',
          }
        }, {
          type: 'return',
          expression: {
            type: 'name',
            value: 'a',
          }
        }]
      }])
      expect(res).toMatchSnapshot()
    })
  })
})

describe('statements', () => {
  let parse
  beforeEach(() => {
    parse = (str) => {
      const res = new nearley.Parser(nearley.Grammar.fromCompiled(grammar)).feed(`
       function TestExp () {
          ${str}
        }
      `).results
      expect(res).toHaveLength(1)
      return res[0][0].body
    }
  })

  test('if', () => {
    const res = parse(`
      if a > 1 {
        return a
      }
    `)
    expect(res).toMatchObject([{
      type: 'if',
      expression: {
        left: {
          type: 'name',
          value: 'a',
        },
        op: {
          type: 'gt'
        },
        right: {
          type: 'number',
          value: '1'
        }
      },
      elses: [],
      block: [{
        type: 'return',
        expression: {
          type: 'name',
          value: 'a',
        }
      }]
    }])
    expect(res).toMatchSnapshot()
  })
  
  test('if / else', () => {
    const res = parse(`
      if a > 1 {
        return a
      } else {
        return b
      }
    `)
    expect(res).toMatchObject([{
      type: 'if',
      elses: [{
        type: 'else',
        expression: null,
        block: [{
          type: 'return',
          expression: {
            type: 'name',
            value: 'b',
          }
        }]
      }]
    }])
    expect(res).toMatchSnapshot()
  })

  test('if / elseif / else', () => {
    const res = parse(`
      if a > 1 {
        return a
      } else if a < 1  {
        return b
      }
      else {
        return c
      }
    `)
    expect(res).toMatchObject([{
      type: 'if',
      elses: [{
        type: 'elseif',
        expression: {
          left: {
            type: 'name',
            value: 'a',
          },
          op: {
            type: 'lt'
          },
          right: {
            type: 'number',
            value: '1'
          }
        },
        block: [{
          type: 'return',
          expression: {
            type: 'name',
            value: 'b',
          }
        }]
      }, {
        type: 'else',
        expression: null,
        block: [{
          type: 'return',
          expression: {
            type: 'name',
            value: 'c',
          }
        }]
      }]
    }])
    expect(res).toMatchSnapshot()
  })

  test('const', () => {
    const res = parse(`
      const a = 1
    `)
    expect(res).toMatchObject([{
      type: 'const',
      name: {
        type: 'name',
        value: 'a',
      },
      expression: {
        type: 'number',
        value: '1'
      },
    }])
    expect(res).toMatchSnapshot()
  })

  test('let', () => {
    const res = parse(`
      let a = 1
    `)
    expect(res).toMatchObject([{
      type: 'let',
      name: {
        type: 'name',
        value: 'a',
      },
      expression: {
        type: 'number',
        value: '1'
      },
    }])
    expect(res).toMatchSnapshot()
  })

  test('assign =', () => {
    const res = parse(`
      a.b = 1
    `)
    expect(res).toMatchObject([{
      type: 'assign',
      name: {
        type: 'name',
        value: 'b',
        prefix: {
          type: 'name',
          value: 'a',
        }
      },
      expression: {
        type: 'number',
        value: '1',
      },
      op: {
        type: 'assign'
      }
    }])
    expect(res).toMatchSnapshot()
  })

  test('assign +=', () => {
    const res = parse(`
      a.b += 1
    `)
    expect(res).toMatchObject([{
      type: 'assign',
      name: {
        type: 'name',
        value: 'b',
        prefix: {
          type: 'name',
          value: 'a',
        }
      },
      expression: {
        type: 'number',
        value: '1',
      },
      op: {
        type: 'assignplus'
      }
    }])
    expect(res).toMatchSnapshot()
  })

  test('assign -=', () => {
    const res = parse(`
      a.b -= 1
    `)
    expect(res).toMatchObject([{
      type: 'assign',
      name: {
        type: 'name',
        value: 'b',
        prefix: {
          type: 'name',
          value: 'a',
        }
      },
      expression: {
        type: 'number',
        value: '1',
      },
      op: {
        type: 'assignminus'
      }
    }])
    expect(res).toMatchSnapshot()
  })
})

describe('exp', () => {
  let parse
  beforeEach(() => {
    parse = (str) => {
      const res = new nearley.Parser(nearley.Grammar.fromCompiled(grammar)).feed(`
       function TestExp () {
          return ${str}
        }
      `).results
      expect(res).toHaveLength(1)
      return res[0][0].body[0].expression
    }
  })

  describe('atomic', () => {
    test('parses basic number', () => {
      const res = parse('10')
      expect(res.type).toBe('number')
      expect(res.value).toBe('10')
      expect(res).toMatchSnapshot()
    })

    test('parses number with decimals', () => {
      const res = parse('10.234234')
      
      expect(res.type).toBe('number')
      expect(res.value).toBe('10.234234')
      expect(res).toMatchSnapshot()
    })

    test('parses number 0 with decimals', () => {
      const res = parse('0.234234')
      
      expect(res.type).toBe('number')
      expect(res.value).toBe('0.234234')
      expect(res).toMatchSnapshot()
    })

    test('parses double quote text string', () => {
      const res = parse('"hello"')
      expect(res.type).toBe('string')
      expect(res.value).toBe('hello')
      expect(res).toMatchSnapshot()
    })

    test('parses single quote text string', () => {
      const res = parse('\'hello\'')
      
      expect(res.type).toBe('string')
      expect(res.value).toBe('hello')
      expect(res).toMatchSnapshot()
    })

    test('parses true boolean', () => {
      const res = parse('true')
      
      expect(res.type).toBe('boolean')
      expect(res.value).toBe('true')
      expect(res).toMatchSnapshot()
    })

    test('parses false boolean', () => {
      const res = parse('false')
      
      expect(res.type).toBe('boolean')
      expect(res.value).toBe('false')
      expect(res).toMatchSnapshot()
    })

    test('parses name', () => {
      const res = parse('name')
      
      expect(res.type).toBe('name')
      expect(res.value).toBe('name')
      expect(res).toMatchSnapshot()
    })

    test('parses multi-depth name', () => {
      const res = parse('name.abc.xyz')
      
      expect(res.type).toBe('name')
      expect(res.value).toBe('xyz')
      expect(res.prefix.value).toBe('abc')
      expect(res.prefix.prefix.value).toBe('name')
      expect(res).toMatchSnapshot()
    })

    test('parses name with number', () => {
      const res = parse('5abc')
      
      expect(res.type).toBe('name')
      expect(res.value).toBe('5abc')
      expect(res).toMatchSnapshot()
    })

    test('parses name with square brackets number', () => {
      const res = parse('abc[0]')
      
      expect(res.type).toBe('number')
      expect(res.value).toBe('0')
      // expect(res.bracket).toBe(true)
      expect(res.prefix.type).toBe('name')
      expect(res.prefix.value).toBe('abc')
      expect(res).toMatchSnapshot()
    })

    test('parses name with square brackets string', () => {
      const res = parse('abc[name]')
      
      expect(res.type).toBe('name')
      expect(res.value).toBe('name')
      expect(res.prefix.type).toBe('name')
      expect(res.prefix.value).toBe('abc')
      expect(res).toMatchSnapshot()
    })

    test('parses name with square brackets sum', () => {
      const res = parse('abc[1 + 1]')
      
      expect(res.type).toBe('sum')
      expect(res.left.type).toBe('number')
      expect(res.right.type).toBe('number')
      expect(res).toMatchSnapshot()
    })

    test('parses name with square brackets as part of prefix', () => {
      const res = parse('abc[1].xyz')
      
      expect(res.type).toBe('name')
      expect(res.value).toBe('xyz')
      expect(res.prefix.bracket).toBe(true)
      expect(res.prefix.type).toBe('number')
      expect(res.prefix.value).toBe('1')
      expect(res.prefix.prefix.type).toBe('name')
      expect(res.prefix.prefix.value).toBe('abc')
      expect(res).toMatchSnapshot()
    })
  })

  describe('operators', () => {
    test('compare name OR number using ||', () => {
      const res = parse('a || 10')
      
      expect(res).toMatchObject({
        left: { value: 'a', type: 'name' },
        op: { type: 'or', value: '||' },
        right: { type: 'number', value: '10' },
      })
      expect(res).toMatchSnapshot()
    })

    test('compare name OR number using or', () => {
      const res = parse('a or 10')
      
      expect(res).toMatchObject({
        left: { value: 'a', type: 'name' },
        op: { type: 'or', value: 'or' },
        right: { type: 'number', value: '10' },
      })
      expect(res).toMatchSnapshot()
    })
  })

  describe('comparison', () => {
    test('Compare variable with number', () => {
      const res = parse('a == 10')
      
      expect(res).toMatchObject({
        left: { value: 'a', type: 'name' },
        op: { type: 'eq', value: '==' },
        right: { type: 'number', value: '10' },
      })
      expect(res).toMatchSnapshot()
    })
  })

  describe('concat', () => {
    test('Concat two names', () => {
      const res = parse('a & b')
      
      expect(res).toMatchObject({
        type: 'concat',
        left: { value: 'a', type: 'name' },
        right: { value: 'b', type: 'name' },
      })
      expect(res).toMatchSnapshot()
    })
  })

  describe('sum', () => {
    test('Sum two names', () => {
      const res = parse('a + b')
      
      expect(res).toMatchObject({
        type: 'sum',
        op: { type: 'plus' },
        left: { value: 'a', type: 'name' },
        right: { value: 'b', type: 'name' },
      })
      expect(res).toMatchSnapshot()
    })

    test('Subtract two names', () => {
      const res = parse('a - b')
      
      expect(res).toMatchObject({
        type: 'sum',
        op: { type: 'minus' },
        left: { value: 'a', type: 'name' },
        right: { value: 'b', type: 'name' },
      })
      expect(res).toMatchSnapshot()
    })

    test('Subtract two names together', () => {
      const res = parse('a-b')
      
      expect(res).toMatchObject({
        type: 'sum',
        op: { type: 'minus' },
        left: { value: 'a', type: 'name' },
        right: { value: 'b', type: 'name' },
      })
      expect(res).toMatchSnapshot()
    })

    test('Subtract two numbers together', () => {
      const res = parse('1-2')
      
      expect(res).toMatchObject({
        type: 'sum',
        op: { type: 'minus' },
        left: { value: '1', type: 'number' },
        right: { value: '2', type: 'number' },
      })
      expect(res).toMatchSnapshot()
    })

    test('Subtract two numbers', () => {
      const res = parse('10 - 20')
      
      expect(res).toMatchObject({
        type: 'sum',
        op: { type: 'minus' },
        left: { value: '10', type: 'number' },
        right: { value: '20', type: 'number' },
      })
      expect(res).toMatchSnapshot()
    })
  })

  describe('product', () => {
    test('Product two names', () => {
      const res = parse('a * b')
      
      expect(res).toMatchObject({
        type: 'product',
        op: { type: 'times' },
        left: { value: 'a', type: 'name' },
        right: { value: 'b', type: 'name' },
      })
      expect(res).toMatchSnapshot()
    })
  })

  describe('unary', () => {
    test('Unary name', () => {
      const res = parse('!b')
      
      expect(res).toMatchObject({
        type: 'not',
        value: { value: 'b', type: 'name' },
      })
      expect(res).toMatchSnapshot()
    })
  })

  describe('function calls', () => {
    test('function call with no params', () => {
      const res = parse('b()')
      
      expect(res).toMatchObject({
        type: 'call',
        prefix: { value: 'b', type: 'name' },
        args: [],
      })
      expect(res).toMatchSnapshot()
    })

    test('function call with 1 named param', () => {
      const res = parse('b(a)')
      
      expect(res).toMatchObject({
        type: 'call',
        prefix: { value: 'b', type: 'name' },
        args: [{
          value: 'a',
          type: 'name',
        }],
      })
      expect(res).toMatchSnapshot()
    })

    test('function call with 2 named param', () => {
      const res = parse('b(a, c)')
      
      expect(res).toMatchObject({
        type: 'call',
        prefix: { value: 'b', type: 'name' },
        args: [{
          value: 'a',
          type: 'name',
        }, {
          value: 'c',
          type: 'name',
        }],
      })
      expect(res).toMatchSnapshot()
    })

    test('function call with multi-depth prop', () => {
      const res = parse('a.b(c)')
      
      expect(res).toMatchObject({
        type: 'call',
        prefix: {
          value: 'b',
          type: 'name',
          prefix: {
            type: 'name',
            value: 'a',
          },
        },
        args: [{
          value: 'c',
          type: 'name',
        }],
      })
      expect(res).toMatchSnapshot()
    })

    test('function call with multiple depth calls', () => {
      const res = parse('a().b(c)')
      
      expect(res).toMatchObject({
        type: 'call',
        args: [{
          value: 'c',
          type: 'name',
        }],
        prefix: {
          type: 'name',
          value: 'b',
          prefix: {
            type: 'call',
            prefix: {
              value: 'a',
            },
          },
        },
      })
      expect(res).toMatchSnapshot()
    })

    test('function call with multiple depth calls', () => {
      const res = parse('a().b')
      
      expect(res).toMatchObject({
        type: 'name',
        value: 'b',
        prefix: {
          type: 'call',
          prefix: {
            value: 'a',
          },
        },
      })
      expect(res).toMatchSnapshot()
    })
  })

  describe('array', () => {
    test('empty array', () => {
      const res = parse('[]')
      
      expect(res).toMatchObject({
        type: 'array',
        value: [],
      })
    })

    test('number array', () => {
      const res = parse('[10]')
      
      expect(res).toMatchObject({
        type: 'array',
        value: [{
          type: 'number',
          value: '10',
        }],
      })
    })

    test('Multi-number array', () => {
      const res = parse('[10, 11]')
      
      expect(res).toMatchObject({
        type: 'array',
        value: [{
          type: 'number',
          value: '10',
        }, {
          type: 'number',
          value: '11',
        }],
      })
    })
  })

  describe('object', () => {
    test('empty object', () => {
      const res = parse('{}')
      
      expect(res).toMatchObject({
        type: 'object',
        value: [],
      })
    })

    test('single key-value object', () => {
      const res = parse('{ a: 10 }')
      
      expect(res).toMatchObject({
        type: 'object',
        value: [{
          key: {
            type: 'name',
            value: 'a',
          },
          value: {
            type: 'number',
            value: '10',
          },
        }],
      })
    })

    test('quoted key name object', () => {
      const res = parse('{ "hello": 10 }')
      
      expect(res).toMatchObject({
        type: 'object',
        value: [{
          key: {
            type: 'name',
            value: 'hello',
          },
          value: {
            type: 'number',
            value: '10',
          },
        }],
      })
    })

    test('quoted key name starting with number object', () => {
      const res = parse('{ "2019-20-10": 10 }')
      
      expect(res).toMatchObject({
        type: 'object',
        value: [{
          key: {
            type: 'name',
            value: '2019-20-10',
          },
          value: {
            type: 'number',
            value: '10',
          },
        }],
      })
    })

    test('single key object', () => {
      const res = parse('{ a }')
      
      expect(res).toMatchObject({
        type: 'object',
        value: [{
          key: {
            type: 'name',
            value: 'a',
          },
          value: {
            type: 'name',
            value: 'a',
          },
        }],
      })
    })
  })
})

  // These produce 2 results, but result is equal... 
describe('parenthesis', () => {
  let parse
  beforeEach(() => {
    parse = (str) => {
      const res = new nearley.Parser(nearley.Grammar.fromCompiled(grammar)).feed(`
       function TestExp () {
          return ${str}
        }
      `).results
      return res[0][0].body[0].expression
    }
  })

  test('no parenthesis', () => {
    const res = parse('a > 10 || b == 12 && c == 10')
    expect(res).toMatchSnapshot()
  })

  test('AND and OR parenthesis', () => {
    const res = parse('(a > 10 || b == 12) && c == 10')
    expect(res).toMatchSnapshot()
  })

  test('AND and OR reversed parenthesis', () => {
    const res = parse('(a > 10 && b == 12) || c == 10')
    expect(res).toMatchSnapshot()
  })
})