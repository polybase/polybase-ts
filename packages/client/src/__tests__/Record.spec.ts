import { CollectionRecord, deserializeRecord } from '../Record'
import { Collection } from '../Collection'
import { Client } from '../Client'
import { defaultRequest } from './util'
import { parse } from '@polybase/polylang'
import { encodeBase64, getCollectionProperties } from '../util'

let sender: jest.Mock
let signer: jest.Mock
let register: jest.Mock
let client: Client
let collection: Collection<any>

beforeEach(() => {
  sender = jest.fn()
  signer = jest.fn()
  register = jest.fn()
  client = new Client(sender, signer)
  collection = new Collection('col1', client)
})

test('record is instance of CollectionRecord', () => {
  const d = new CollectionRecord('id1', collection, client, register)
  expect(d).toBeInstanceOf(CollectionRecord)
})

test('get request is sent to client', async () => {
  const meta = {
    code: `
      @public
      collection col1 {}
    `,
    ast: JSON.stringify((await parse(`
      @public
      collection col1 {}
    `, ''))[1]),
  }

  sender.mockResolvedValueOnce({
    status: 200,
    data: {
      data: meta,
    },
  })

  const data = {
    id: 'id1',
  }

  sender.mockResolvedValueOnce({
    data: {
      data,
    },
  })
  sender.mockResolvedValueOnce({
    data: {
      data: {
        code: `
          collection col1 {
            id: string;
          }
        `,
        ast: JSON.stringify((await parse(`
          collection col1 {
            id: string;
          }
        `, ''))[1]),
      },
    },
  })

  const d = new CollectionRecord('id1', collection, client, register)
  expect(await d.get()).toEqual({ data })

  expect(sender).toHaveBeenCalledTimes(2)
  expect(sender).toHaveBeenCalledWith({
    ...defaultRequest,
    url: '/collections/col1/records/id1',
    method: 'GET',
  })
  expect(sender).toHaveBeenCalledWith({
    ...defaultRequest,
    url: '/collections/Collection/records/col1',
    method: 'GET',
  })
})

test('registers snapshot', () => {
  const listener = jest.fn()
  const d = new CollectionRecord('id1', collection, client, register)

  d.onSnapshot(listener)

  expect(register).toHaveBeenCalledWith(d, listener, undefined)
})

test('record key is correct', () => {
  const d = new CollectionRecord('id1', collection, client, register)
  const key = d.key()
  expect(key).toBe('record:col1/id1')
})

test('.call() sends a call request', async () => {
  const meta = {
    code: `
      collection col {
        age: number;

        function setAge(age: number) {
          this.age = age;
        }
      }
    `,
    ast: JSON.stringify((await parse(`
      collection col {
        age: number;

        function setAge(age: number) {
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
        age: 20,
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
  const result = await c.record('id1').call('setAge', [20])

  expect(sender).toHaveBeenCalledWith({
    ...defaultRequest,
    url: '/collections/col/records/id1/call/setAge',
    method: 'POST',
    data: {
      args: [
        20,
      ],
    },
  })

  expect(result).toEqual({
    data: {
      id: 'id1',
      age: 20,
    },
  })
})

test('.call() works with boolean arguments', async () => {
  const meta = {
    code: `
      collection col {
        isActive: boolean;

        function setIsActive(isActive: boolean) {
          this.isActive = isActive;
        }
      }
    `,
    ast: JSON.stringify((await parse(`
      collection col {
        isActive: boolean;

        function setIsActive(isActive: boolean) {
          this.isActive = isActive;
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
        isActive: true,
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
  const result = await c.record('id1').call('setIsActive', [true])

  expect(sender).toHaveBeenCalledWith({
    ...defaultRequest,
    url: '/collections/col/records/id1/call/setIsActive',
    method: 'POST',
    data: {
      args: [
        true,
      ],
    },
  })

  expect(result).toEqual({
    data: {
      id: 'id1',
      isActive: true,
    },
  })
})

test('deserializeRecord', async () => {
  const code = `
    collection col {
      id: string;
      age: number;
      data: bytes;
      extra: {
        extraData: bytes;
      };
    }
  `

  const data = {
    id: 'id1',
    age: 20,
    data: encodeBase64(new Uint8Array([0, 1, 2])),
    extra: {
      extraData: encodeBase64(new Uint8Array([3, 4, 5])),
    },
  }

  deserializeRecord(data, getCollectionProperties('col', (await parse(code, ''))[1]))
  expect(data).toEqual({
    id: 'id1',
    age: 20,
    data: new Uint8Array([0, 1, 2]),
    extra: {
      extraData: new Uint8Array([3, 4, 5]),
    },
  })
})
