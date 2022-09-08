import unparse from '../dist/unparse'
import parse from '../dist/parse'

const parseUnparse = str => unparse(parse(str))
const exp = str => `function Hello () {\nreturn ${str}\n}`


describe.only('unparse', () => {
  describe('exp', () => {
    describe('values', () => {
      test('returns primitive number', () => {
        const formula = exp('2')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns primitive negative number', () => {
        const formula = exp('-22')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns primitive string', () => {
        const formula = exp('"hello"')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns primitive number string', () => {
        const formula = exp('"2"')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns primitive true boolean', () => {
        const formula = exp('true')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns primitive false boolean', () => {
        const formula = exp('false')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns empty array', () => {
        const formula = exp('[]')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns numbered array', () => {
        const formula = exp('[1, 2, 3]')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns string array', () => {
        const formula = exp('["hello1", "hello2", "hello3"]')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns mixed array', () => {
        const formula = exp('["hello1", true, false, 10]')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns empty object', () => {
        const formula = exp('{}')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns key/value object', () => {
        const formula = exp('{ a: 10 }')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns multi key/value object', () => {
        const formula = exp('{ a: 10, b: 2 }')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('concats two values', () => {
        const formula = exp('"abc" & "def"')
        expect(parseUnparse(formula)).toBe(formula)
      })
    })
  
    describe('math', () => {
      test('add 2 numbers', () => {
        const formula = exp('10 + 10')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('subtract 2 numbers', async () => {
        const formula = exp('20 - 10')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('times 2 numbers', async () => {
        const formula = exp('10 * 10')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('divide 2 numbers', async () => {
        const formula = exp('35 / 7')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('remainder 2 numbers', async () => {
        const formula = exp('35 % 8')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('not true boolean', async () => {
        const formula = exp('!true')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('not false boolean', async () => {
        const formula = exp('!false')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('negate number expression', async () => {
        const formula = exp('-(35)')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('power of number using ^', async () => {
        const formula = exp('2 ^ 2')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('power of number using **', async () => {
        const formula = exp('2 ** 2')
        expect(parseUnparse(formula)).toBe(formula)
      })
    })
  
    describe('comaprisons', () => {
      test('numbers are equal 2=2', async () => {
        const formula = exp('2 == 2')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('numbers are equal 2==2', async () => {
        const formula = exp('2 == 2')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('numbers are not equal 2==3', async () => {
        const formula = exp('2 == 3')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('numbers are not equal 2!=3', async () => {
        const formula = exp('2 != 3')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('numbers are not equal 3!=3', async () => {
        const formula = exp('3 != 3')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('numbers are greater than 2>1', async () => {
        const formula = exp('2 > 1')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('numbers are not greater than 1>2', async () => {
        const formula = exp('1 > 2')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('numbers are greater than or equal 2>=2', async () => {
        const formula = exp('2 >= 2')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('numbers are not greater than 1>2', async () => {
        const formula = exp('1 > 2')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('numbers are less than 1<2', async () => {
        const formula = exp('1 < 2')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('numbers are not less than 2<1', async () => {
        const formula = exp('2 < 1')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('numbers are less than or equal 2<=2', async () => {
        const formula = exp('2 <= 2')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('numbers are not less than 2<=1', async () => {
        const formula = exp('2 <= 1')
        expect(parseUnparse(formula)).toBe(formula)
      })
    })
  
    describe('AND/OR', () => {
      test('val OR val is true', async () => {
        const formula = exp('false || true')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('val OR val is not true', async () => {
        const formula = exp('false || false')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('val AND val is true', async () => {
        const formula = exp('true && true')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('val AND val is false', async () => {
        const formula = exp('true && false')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('val AND val OR val is true', async () => {
        const formula = exp('true && false || true')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('val AND val OR val is false', async () => {
        const formula = exp('false && true || true')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('(val AND val) OR val is false', async () => {
        const formula = exp('(false && true) || true')
        expect(parseUnparse(formula)).toBe(formula)
      })
    })
  
    describe('variables', () => {
      test('returns variable value', async () => {
        const formula = exp('var1')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns 2-depth variable value', async () => {
        const formula = exp('var1.var2')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns bracket with number name path', async () => {
        const formula = exp('var1[0]')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns 2-depth bracket with number name path', async () => {
        const formula = exp('var1.var2[0]')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns 3-depth bracket with number name path', async () => {
        const formula = exp('var1.var2[0].var3')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns 2-depth bracket with name name path', async () => {
        const formula = exp('var1.var2[name]')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns 2-depth bracket with string name path', async () => {
        const formula = exp('var1.var2["name"]')
        expect(parseUnparse(formula)).toBe(formula)
      })
  
      test('returns 3-depth variable value', async () => {
        const formula = exp('var1.var2.var3')
        expect(parseUnparse(formula)).toBe(formula)
      })
    })
  
    describe('Functions', () => {
      test('sum(1, 2, 3) numbers', async () => {
        const formula = exp('sum(1, 2, 3)')
        expect(parseUnparse(formula)).toBe(formula)
      })
    })
  })
})
