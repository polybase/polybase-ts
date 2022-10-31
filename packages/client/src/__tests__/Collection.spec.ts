import { Collection } from '../Collection'
import { Doc } from '../Doc'
import { Query } from '../Query'
import { Client } from '../Client'
import { defaultRequest } from './util'

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
      contract col {}
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
      contract col {
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
      contract col {
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

test('.create() sends a create request', async () => {
  const meta = {
    code: `
      contract col {
        id: string;
        age?: number;

        function constructor(id: string, age: number) {
          this.id = id;
          this.age = age;
        }
      }
    `,
  }

  sender.mockResolvedValueOnce({
    status: 200,
    data: {
      data: meta,
    },
  })

  sender.mockResolvedValueOnce({
    status: 200,
    data: {
      data: {
        id: 'id1',
        age: 30,
      },
    },
  })

  sender.mockResolvedValueOnce({
    status: 200,
    data: {
      data: {
        block: {
          hash: '0x0',
        },
      },
    },
  })

  const c = new Collection('col', client)
  const result = await c.create(['id1', 20])

  expect(sender).toHaveBeenCalledWith({
    ...defaultRequest,
    url: '/contracts/col',
    method: 'POST',
    data: {
      args: [
        'id1',
        20,
      ],
    },
  })

  expect(result.data).toEqual({ id: 'id1', age: 30 })
})
