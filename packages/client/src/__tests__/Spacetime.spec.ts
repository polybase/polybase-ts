import { Spacetime } from '../Spacetime'
import { Collection } from '../Collection'
import { defaultRequest } from './util'

// const clock = FakeTimers.install()
const baseURL = 'https://base.com/'

let sender: jest.Mock

beforeEach(() => {
  sender = jest.fn()
})

test('spacetime is instance of Spacetime', () => {
  const s = new Spacetime()
  expect(s).toBeInstanceOf(Spacetime)
})

test('collection() returns collection', () => {
  const s = new Spacetime({ sender })
  expect(s.collection('a')).toBeInstanceOf(Collection)
})

test('collection() returns collection using default namespace', () => {
  const s = new Spacetime({ sender, defaultNamespace: 'hello-world' })
  expect(s.collection('a/path').id).toBe('hello-world/a/path')
})

test('collection() returns collection using absolute path', () => {
  const s = new Spacetime({ sender, defaultNamespace: 'hello-world' })
  expect(s.collection('/a/path').id).toBe('a/path')
})

test('collection is reused', () => {
  const s = new Spacetime({
    sender,
  })
  const a = s.collection('a')
  expect(s.collection('a')).toBe(a)
})

test('creates collections from schema in namespace', async () => {
  const s = new Spacetime({ sender, baseURL })
  const namespace = 'test'
  const schema = `
    collection Col {
      id: string!;
      name: string;
    }

    collection Col2 {
      id: string!;
    }
  `
  const n = await s.applySchema(schema, namespace)

  expect(sender).toHaveBeenCalledWith({
    ...defaultRequest,
    baseURL,
    url: '/collections/$collections/records/test%2FCol',
    method: 'POST',
    data: {
      data: {
        id: 'test/Col',
        code: schema,
      },
    },
    headers: {
      'X-Spacetime-Client': 'spacetime@ts/client:v0',
    },
  })

  expect(sender).toHaveBeenCalledWith({
    ...defaultRequest,
    baseURL,
    url: '/collections/$collections/records/test%2FCol2',
    method: 'POST',
    data: {
      data: {
        id: 'test/Col2',
        code: schema,
      },
    },
    headers: {
      'X-Spacetime-Client': 'spacetime@ts/client:v0',
    },
  })

  for (const item of n) {
    expect(item).toBeInstanceOf(Collection)
  }

  expect(n.map((c) => c.id)).toContainEqual('test/Col')
  expect(n.map((c) => c.id)).toContainEqual('test/Col2')
})

test('caches a collection', () => {
  const s = new Spacetime({ sender, baseURL })

  const c1 = s.collection('hello')
  const c2 = s.collection('hello')

  expect(c1).toBe(c2)
})
