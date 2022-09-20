import { Collection } from '../Collection'
import { Doc } from '../Doc'
import { Query } from '../Query'
import { Client } from '../Client'

let sender: jest.Mock
let signer: jest.Mock
let client: Client

beforeEach(() => {
  sender = jest.fn()
  signer = jest.fn()
  client = new Client(sender, signer)
})

test('collection is instance of Collection', () => {
  const c = new Collection('id', client)
  expect(c).toBeInstanceOf(Collection)
})

test('.doc() creates doc instance', () => {
  const c = new Collection('id', client)
  expect(c.doc('id1')).toBeInstanceOf(Doc)
})

test('.where() creates query instance', () => {
  const c = new Collection('id', client)
  expect(c.where('id1', '==', 'abc')).toBeInstanceOf(Query)
})

test('.limit() creates query instance', () => {
  const c = new Collection('id', client)
  expect(c.limit(100)).toBeInstanceOf(Query)
})

test('get metadata - success', async () => {
  const meta = {
    code: `
      collection Col {}
    `,
  }

  sender.mockResolvedValue({
    status: 200,
    data: {
      data: meta,
    },
  })

  const c = new Collection('col', client)
  const res = await c.getMeta()
  expect(res).toEqual(meta)
})

test('validate valid doc', async () => {
  const meta = {
    code: `
      collection Col {
        name: string;
      }
    `,
  }

  sender.mockResolvedValue({
    status: 200,
    data: {
      data: meta,
    },
  })

  const c = new Collection('col', client)
  const res = await c.validate({ name: 'Calum' })
  expect(res).toEqual(true)
})

test('validate invalid doc', async () => {
  const meta = {
    code: `
      collection Col {
        age: number;
      }  
    `,
  }

  sender.mockResolvedValue({
    status: 200,
    data: {
      data: meta,
    },
  })

  const c = new Collection('col', client)
  const res = await c.validate({ name: 'Calum' })
  expect(res).toEqual(false)
})

test('get collection', async () => {
  const want = {
    id: 'id1',
    name: 'Calum',
  }

  sender.mockResolvedValue({
    status: 200,
    data: {
      data: want,
    },
  })

  const c = new Collection('col', client)
  const got = await c.get()
  expect(got).toEqual({
    data: want,
  })
})

test('collection key is correct', () => {
  const c = new Collection('col', client)
  const key = c.key()
  expect(key).toBe('collection:col')
})
