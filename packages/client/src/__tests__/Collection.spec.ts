import { Collection } from '../Collection'
import { CollectionRecord } from '../Record'
import { Query } from '../Query'
import { Client } from '../Client'
import { defaultRequest } from './util'
import { parse } from '@polybase/polylang'

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

test('.record() creates record instance', () => {
  const c = new Collection('id', client)
  expect(c.record('id1')).toBeInstanceOf(CollectionRecord)
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
      collection col {}
    `,
    ast: JSON.stringify((await parse(`
      collection col {}
    `, ''))[1]),
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

test('validate valid record', async () => {
  const meta = {
    code: `
      collection col {
        name: string;
      }
    `,
    ast: JSON.stringify((await parse(`
      collection col {
        name: string;
      }
    `, ''))[1]),
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

test('validate invalid record', async () => {
  const meta = {
    code: `
      collection col {
        age: number;
      }  
    `,
    ast: JSON.stringify((await parse(`
      collection col {
        age: number;
      }
    `, ''))[1]),
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
  const meta = {
    code: `
      collection col {
        id: string;
        age?: number;

        function constructor(id: string, age: number) {
          this.id = id;
          this.age = age;
        }
      }
    `,
    ast: JSON.stringify((await parse(`
      collection col {
        id: string;
        age?: number;

        function constructor(id: string, age: number) {
          this.id = id;
          this.age = age;
        }
      }
    `, ''))[1]),
  }

  sender.mockResolvedValueOnce({
    status: 200,
    data: {
      data: meta,
    },
  })

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
      collection col {
        id: string;
        age?: number;

        function constructor(id: string, age: number) {
          this.id = id;
          this.age = age;
        }
      }
    `,
    ast: JSON.stringify((await parse(`
      collection col {
        id: string;
        age?: number;

        function constructor(id: string, age: number) {
          this.id = id;
          this.age = age;
        }
      }
    `, ''))[1]),
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
    url: '/collections/col/records',
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

test('.isReadPubliclyAccessible() returns true if collection is @public', async () => {
  const meta = {
    code: `
      @public
      collection col {}
    `,
    ast: JSON.stringify((await parse(`
      @public
      collection col {}
    `, ''))[1]),
  }

  sender.mockResolvedValue({
    status: 200,
    data: {
      data: meta,
    },
  })

  const c = new Collection('col', client)
  expect(await c.isReadPubliclyAccessible()).toBe(true)
  expect(sender).toHaveBeenCalledTimes(1)
})

test('.isReadPubliclyAccessible() returns true if collection is @read', async () => {
  const meta = {
    code: `
      @read
      collection col {}
    `,
    ast: JSON.stringify((await parse(`
      @read
      collection col {}
    `, ''))[1]),
  }

  sender.mockResolvedValue({
    status: 200,
    data: {
      data: meta,
    },
  })

  const c = new Collection('col', client)
  expect(await c.isReadPubliclyAccessible()).toBe(true)
  expect(sender).toHaveBeenCalledTimes(1)
})

test('.isReadPubliclyAccessible() returns false if collection is not @public or @read', async () => {
  const meta = {
    code: `
      collection col {}
    `,
    ast: JSON.stringify((await parse(`
      collection col {}
    `, ''))[1]),
  }

  sender.mockResolvedValue({
    status: 200,
    data: {
      data: meta,
    },
  })

  const c = new Collection('col', client)
  expect(await c.isReadPubliclyAccessible()).toBe(false)
  expect(sender).toHaveBeenCalledTimes(1)
})

test('.isCallPubliclyAccessible() returns true if collection is @public', async () => {
  const meta = {
    code: `
      @public
      collection col {
        foo () {}
      }
    `,
    ast: JSON.stringify((await parse(`
      @public
      collection col {
        foo () {}
      }
    `, ''))[1]),
  }

  sender.mockResolvedValue({
    status: 200,
    data: {
      data: meta,
    },
  })

  const c = new Collection('col', client)
  expect(await c.isCallPubliclyAccessible('foo')).toBe(true)
  expect(sender).toHaveBeenCalledTimes(1)
})

test('.isCallPubliclyAccessible() returns true if collection is @call', async () => {
  const meta = {
    code: `
      @call
      collection col {
        foo () {}
      }
    `,
    ast: JSON.stringify((await parse(`
      @call
      collection col {
        foo () {}
      }
    `, ''))[1]),
  }

  sender.mockResolvedValue({
    status: 200,
    data: {
      data: meta,
    },
  })

  const c = new Collection('col', client)
  expect(await c.isCallPubliclyAccessible('foo')).toBe(true)
  expect(sender).toHaveBeenCalledTimes(1)
})

test('.isCallPubliclyAccessible() returns true if method is @call', async () => {
  const meta = {
    code: `
      collection col {
        @call
        foo () {}
      }
    `,
    ast: JSON.stringify((await parse(`
      collection col {
        @call
        foo () {}
      }
    `, ''))[1]),
  }

  sender.mockResolvedValue({
    status: 200,
    data: {
      data: meta,
    },
  })

  const c = new Collection('col', client)
  expect(await c.isCallPubliclyAccessible('foo')).toBe(true)
  expect(sender).toHaveBeenCalledTimes(1)
})

test('.isCallPubliclyAccessible() returns false if method has @call args', async () => {
  const meta = {
    code: `
      @public
      collection col {
        @call(id1)
        foo () {}
      }
    `,
    ast: JSON.stringify((await parse(`
      @public
      collection col {
        @call(id1)
        foo () {}
      }
    `, ''))[1]),
  }

  sender.mockResolvedValue({
    status: 200,
    data: {
      data: meta,
    },
  })

  const c = new Collection('col', client)
  expect(await c.isCallPubliclyAccessible('foo')).toBe(false)
  expect(sender).toHaveBeenCalledTimes(1)
})
