import { Polybase } from '../Polybase'
import { Contract } from '../Contract'
import { defaultRequest } from './util'

// const clock = FakeTimers.install()
const baseURL = 'https://base.com/'

let sender: jest.Mock

beforeEach(() => {
  sender = jest.fn()
})

test('polybase is instance of Polybase', () => {
  const s = new Polybase()
  expect(s).toBeInstanceOf(Polybase)
})

test('contract() returns contract', () => {
  const s = new Polybase({ sender })
  expect(s.contract('a')).toBeInstanceOf(Contract)
})

test('contract() returns contract using default namespace', () => {
  const s = new Polybase({ sender, defaultNamespace: 'hello-world' })
  expect(s.contract('a/path').id).toBe('hello-world/a/path')
})

test('contract() returns contract using absolute path', () => {
  const s = new Polybase({ sender, defaultNamespace: 'hello-world' })
  expect(s.contract('/a/path').id).toBe('a/path')
})

test('contract is reused', () => {
  const s = new Polybase({
    sender,
  })
  const a = s.contract('a')
  expect(s.contract('a')).toBe(a)
})

test('creates contracts from schema in namespace', async () => {
  const s = new Polybase({ sender, baseURL })
  const namespace = 'test'
  const schema = `
    contract Col {
      id: string;
      name?: string;
    }

    contract Col2 {
      id: string;
    }
  `
  const n = await s.applySchema(schema, namespace)

  expect(sender).toHaveBeenCalledWith({
    ...defaultRequest,
    baseURL,
    url: '/contracts/$Contract',
    method: 'POST',
    data: {
      args: ['test/Col', schema],
    },
    headers: {
      'X-Polybase-Client': 'polybase@ts/client:v0',
    },
  })

  expect(sender).toHaveBeenCalledWith({
    ...defaultRequest,
    baseURL,
    url: '/contracts/$Contract',
    method: 'POST',
    data: {
      args: ['test/Col2', schema],
    },
    headers: {
      'X-Polybase-Client': 'polybase@ts/client:v0',
    },
  })

  for (const item of n) {
    expect(item).toBeInstanceOf(Contract)
  }

  expect(n.map((c) => c.id)).toContainEqual('test/Col')
  expect(n.map((c) => c.id)).toContainEqual('test/Col2')
})

test('caches a contract', () => {
  const s = new Polybase({ sender, baseURL })

  const c1 = s.contract('hello')
  const c2 = s.contract('hello')

  expect(c1).toBe(c2)
})
