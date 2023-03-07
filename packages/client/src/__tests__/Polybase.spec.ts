import { Polybase } from '../Polybase'
import { Collection } from '../Collection'
import { defaultRequest } from './util'
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { parse } from '@polybase/polylang'

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

test('collection() returns collection', () => {
  const s = new Polybase({ sender })
  expect(s.collection('a')).toBeInstanceOf(Collection)
})

test('collection() returns collection using default namespace', () => {
  const s = new Polybase({ sender, defaultNamespace: 'hello-world' })
  expect(s.collection('a/path').id).toBe('hello-world/a/path')
})

test('collection() returns collection using absolute path', () => {
  const s = new Polybase({ sender, defaultNamespace: 'hello-world' })
  expect(s.collection('/a/path').id).toBe('a/path')
})

test('collection is reused', () => {
  const s = new Polybase({
    sender,
  })
  const a = s.collection('a')
  expect(s.collection('a')).toBe(a)
})

test('creates collections from schema in namespace', async () => {
  const s = new Polybase({ sender, baseURL })
  s.signer(() => ({
    h: 'eth-personal-sign',
    sig: 'string',
  }))
  const namespace = 'test'
  const schema = `
    collection Col {
      id: string;
      name?: string;
    }

    collection Col2 {
      id: string;
    }
  `

  sender.mockRejectedValueOnce(new AxiosError(
    'bad request',
    'bad request',
    {} as AxiosRequestConfig,
    {},
    {
      status: 400,
      data: {
        error: {
          reason: 'record/not-found',
          code: 'not-found',
          message: 'Collection@Col not found: collection record not found: key not found: pebble: not found',
        },
      },
    } as AxiosResponse,
  ))

  sender.mockResolvedValueOnce({
    status: 200,
    data: {},
  })

  sender.mockResolvedValueOnce({
    status: 200,
    data: {
      data: {
        id: 'Collection',
        code: 'collection Collection { id: string; name?: string; lastRecordUpdated?: string; code?: string; publicKey?: string; constructor (id: string, code: string) { this.id = id; this.code = code; this.publicKey = ctx.publicKey; } updateCode (code: string) { if (this.publicKey != ctx.publicKey) { throw error(\'invalid owner\'); } this.code = code; } }',
        ast: JSON.stringify((await parse('collection Collection { id: string; name?: string; lastRecordUpdated?: string; code?: string; publicKey?: string; constructor (id: string, code: string) { this.id = id; this.code = code; this.publicKey = ctx.publicKey; } updateCode (code: string) { if (this.publicKey != ctx.publicKey) { throw error(\'invalid owner\'); } this.code = code; } }', ''))[1]),
      },
    },
  })

  sender.mockResolvedValueOnce({
    status: 200,
    data: {
      data: {
        id: 'Collection',
        code: 'collection Collection { id: string; name?: string; lastRecordUpdated?: string; code?: string; publicKey?: string; constructor (id: string, code: string) { this.id = id; this.code = code; this.publicKey = ctx.publicKey; } updateCode (code: string) { if (this.publicKey != ctx.publicKey) { throw error(\'invalid owner\'); } this.code = code; } }',
        ast: JSON.stringify((await parse('collection Collection { id: string; name?: string; lastRecordUpdated?: string; code?: string; publicKey?: string; constructor (id: string, code: string) { this.id = id; this.code = code; this.publicKey = ctx.publicKey; } updateCode (code: string) { if (this.publicKey != ctx.publicKey) { throw error(\'invalid owner\'); } this.code = code; } }', ''))[1]),
      },
    },
  })

  sender.mockResolvedValueOnce({
    status: 200,
    data: {
      data: {
        id: 'Collection',
        code: 'collection Collection { id: string; name?: string; lastRecordUpdated?: string; code?: string; publicKey?: string; constructor (id: string, code: string) { this.id = id; this.code = code; this.publicKey = ctx.publicKey; } updateCode (code: string) { if (this.publicKey != ctx.publicKey) { throw error(\'invalid owner\'); } this.code = code; } }',
        ast: JSON.stringify((await parse('collection Collection { id: string; name?: string; lastRecordUpdated?: string; code?: string; publicKey?: string; constructor (id: string, code: string) { this.id = id; this.code = code; this.publicKey = ctx.publicKey; } updateCode (code: string) { if (this.publicKey != ctx.publicKey) { throw error(\'invalid owner\'); } this.code = code; } }', ''))[1]),
      },
    },
  })

  sender.mockResolvedValueOnce({
    status: 200,
    data: {},
  })

  const n = await s.applySchema(schema, namespace)

  expect(sender).toHaveBeenCalledTimes(6)

  expect(sender.mock.calls[0][0]).toMatchObject({
    ...defaultRequest,
    baseURL,
    url: '/collections/Collection/records/test%2FCol',
    method: 'GET',
    headers: {
      'X-Polybase-Client': 'polybase@ts/client:v0',
    },
  })

  expect(sender.mock.calls[1][0]).toMatchObject({
    ...defaultRequest,
    baseURL,
    url: '/collections/Collection/records/test%2FCol2',
    method: 'GET',
    headers: {
      'X-Polybase-Client': 'polybase@ts/client:v0',
    },
  })

  expect(sender.mock.calls[2][0]).toMatchObject({
    ...defaultRequest,
    baseURL,
    url: '/collections/Collection/records/Collection',
    method: 'GET',
    headers: {
      'X-Polybase-Client': 'polybase@ts/client:v0',
    },
  })

  expect(sender.mock.calls[3][0]).toMatchObject({
    ...defaultRequest,
    baseURL,
    url: '/collections/Collection/records/Collection',
    method: 'GET',
    headers: {
      'X-Polybase-Client': 'polybase@ts/client:v0',
    },
  })

  expect(sender.mock.calls[4][0]).toMatchObject({
    ...defaultRequest,
    baseURL,
    url: '/collections/Collection/records',
    method: 'POST',
    data: {
      args: ['test/Col', schema],
    },
    headers: {
      'X-Polybase-Client': 'polybase@ts/client:v0',
      'X-Polybase-Signature': expect.any(String),
    },
  })

  expect(sender.mock.calls[5][0]).toMatchObject({
    ...defaultRequest,
    baseURL,
    url: '/collections/Collection/records/test%2FCol2/call/updateCode',
    method: 'POST',
    data: {
      args: [schema],
    },
    headers: {
      'X-Polybase-Client': 'polybase@ts/client:v0',
      'X-Polybase-Signature': expect.any(String),
    },
  })

  for (const item of n) {
    expect(item).toBeInstanceOf(Collection)
  }

  expect(n.map((c) => c.id)).toContainEqual('test/Col')
  expect(n.map((c) => c.id)).toContainEqual('test/Col2')
})

test('creates collections from schema in defaultNamespace', async () => {
  const s = new Polybase({ sender, baseURL, defaultNamespace: 'test' })
  const schema = `
    collection Col {
      id: string;
      name?: string;
    }

    collection Col2 {
      id: string;
    }
  `

  sender.mockRejectedValueOnce(new AxiosError(
    'bad request',
    'bad request',
    {} as AxiosRequestConfig,
    {},
    {
      status: 400,
      data: {
        error: {
          reason: 'record/not-found',
          code: 'not-found',
          message: 'Collection@Col not found: collection record not found: key not found: pebble: not found',
        },
      },
    } as AxiosResponse,
  ))

  sender.mockResolvedValueOnce({
    status: 200,
    data: {},
  })

  sender.mockResolvedValueOnce({
    status: 200,
    data: {
      data: {
        id: 'Collection',
        code: 'collection Collection { id: string; name?: string; lastRecordUpdated?: string; code?: string; publicKey?: string; constructor (id: string, code: string) { this.id = id; this.code = code; this.publicKey = ctx.publicKey; } updateCode (code: string) { if (this.publicKey != ctx.publicKey) { throw error(\'invalid owner\'); } this.code = code; } }',
        ast: JSON.stringify((await parse('collection Collection { id: string; name?: string; lastRecordUpdated?: string; code?: string; publicKey?: string; constructor (id: string, code: string) { this.id = id; this.code = code; this.publicKey = ctx.publicKey; } updateCode (code: string) { if (this.publicKey != ctx.publicKey) { throw error(\'invalid owner\'); } this.code = code; } }', ''))[1]),
      },
    },
  })

  sender.mockResolvedValueOnce({
    status: 200,
    data: {
      data: {
        id: 'Collection',
        code: 'collection Collection { id: string; name?: string; lastRecordUpdated?: string; code?: string; publicKey?: string; constructor (id: string, code: string) { this.id = id; this.code = code; this.publicKey = ctx.publicKey; } updateCode (code: string) { if (this.publicKey != ctx.publicKey) { throw error(\'invalid owner\'); } this.code = code; } }',
        ast: JSON.stringify((await parse('collection Collection { id: string; name?: string; lastRecordUpdated?: string; code?: string; publicKey?: string; constructor (id: string, code: string) { this.id = id; this.code = code; this.publicKey = ctx.publicKey; } updateCode (code: string) { if (this.publicKey != ctx.publicKey) { throw error(\'invalid owner\'); } this.code = code; } }', ''))[1]),
      },
    },
  })

  sender.mockResolvedValueOnce({
    status: 200,
    data: {
      data: {
        id: 'Collection',
        code: 'collection Collection { id: string; name?: string; lastRecordUpdated?: string; code?: string; publicKey?: string; constructor (id: string, code: string) { this.id = id; this.code = code; this.publicKey = ctx.publicKey; } updateCode (code: string) { if (this.publicKey != ctx.publicKey) { throw error(\'invalid owner\'); } this.code = code; } }',
        ast: JSON.stringify((await parse('collection Collection { id: string; name?: string; lastRecordUpdated?: string; code?: string; publicKey?: string; constructor (id: string, code: string) { this.id = id; this.code = code; this.publicKey = ctx.publicKey; } updateCode (code: string) { if (this.publicKey != ctx.publicKey) { throw error(\'invalid owner\'); } this.code = code; } }', ''))[1]),
      },
    },
  })

  sender.mockResolvedValueOnce({
    status: 200,
    data: {},
  })

  const n = await s.applySchema(schema)

  expect(sender).toHaveBeenCalledTimes(6)

  expect(sender.mock.calls[0][0]).toMatchObject({
    ...defaultRequest,
    baseURL,
    url: '/collections/Collection/records/test%2FCol',
    method: 'GET',
    headers: {
      'X-Polybase-Client': 'polybase@ts/client:v0',
    },
  })

  expect(sender.mock.calls[1][0]).toMatchObject({
    ...defaultRequest,
    baseURL,
    url: '/collections/Collection/records/test%2FCol2',
    method: 'GET',
    headers: {
      'X-Polybase-Client': 'polybase@ts/client:v0',
    },
  })

  expect(sender.mock.calls[2][0]).toMatchObject({
    ...defaultRequest,
    baseURL,
    url: '/collections/Collection/records/Collection',
    method: 'GET',
    headers: {
      'X-Polybase-Client': 'polybase@ts/client:v0',
    },
  })

  expect(sender.mock.calls[3][0]).toMatchObject({
    ...defaultRequest,
    baseURL,
    url: '/collections/Collection/records/Collection',
    method: 'GET',
    headers: {
      'X-Polybase-Client': 'polybase@ts/client:v0',
    },
  })

  expect(sender.mock.calls[4][0]).toMatchObject({
    ...defaultRequest,
    baseURL,
    url: '/collections/Collection/records',
    method: 'POST',
    data: {
      args: ['test/Col', schema],
    },
    headers: {
      'X-Polybase-Client': 'polybase@ts/client:v0',
    },
  })

  expect(sender.mock.calls[5][0]).toMatchObject({
    ...defaultRequest,
    baseURL,
    url: '/collections/Collection/records/test%2FCol2/call/updateCode',
    method: 'POST',
    data: {
      args: [schema],
    },
    headers: {
      'X-Polybase-Client': 'polybase@ts/client:v0',
    },
  })

  for (const item of n) {
    expect(item).toBeInstanceOf(Collection)
  }

  expect(n.map((c) => c.id)).toContainEqual('test/Col')
  expect(n.map((c) => c.id)).toContainEqual('test/Col2')
})

test('caches a collection', () => {
  const s = new Polybase({ sender, baseURL })

  const c1 = s.collection('hello')
  const c2 = s.collection('hello')

  expect(c1).toBe(c2)
})

test('applySchema re-throws a non-not-found error', async () => {
  const s = new Polybase({ sender, baseURL })
  const namespace = 'test'
  const schema = `
    collection Col {
      name?: string;
    }
  `

  sender.mockRejectedValueOnce(new AxiosError(
    'bad request',
    'bad request',
    {} as AxiosRequestConfig,
    {},
    {
      status: 400,
      data: {
        error: {
          reason: 'collection/invalid-id',
          code: 'invalid-argument',
          message: 'Collection@Col invalid id',
        },
      },
    } as AxiosResponse,
  ))

  await expect(s.applySchema(schema, namespace)).rejects.toThrow('Collection@Col invalid id')
})

test('config merges with default config', () => {
  const config = {
    baseURL: 'http://test.test',
    sender,
  }

  const s = new Polybase(config)

  expect(s).toHaveProperty('config', {
    baseURL: 'http://test.test',
    clientId: 'polybase@ts/client:v0',
    sender,
  })
})
