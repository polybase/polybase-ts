import { isNullish } from '../encrypt'

test('nullish should return true', () => {
  expect(isNullish(null)).toBe(true)
  expect(isNullish(undefined)).toBe(true)
})

test('nullish should return false', () => {
  expect(isNullish(0)).toBe(false)
  expect(isNullish(false)).toBe(false)
  expect(isNullish('string')).toBe(false)
  expect(isNullish([])).toBe(false)
  expect(isNullish({})).toBe(false)
})
