import { CollectionRecord } from '../Record'
import { Collection } from '../Collection'
import { Client } from '../Client'
import { defaultRequest } from './util'

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
  const data = {
    id: 'id1',
  }
  sender.mockResolvedValue({
    data: {
      data,
    },
  })
  const d = new CollectionRecord('id1', collection, client, register)
  await d.get()

  expect(sender).toHaveBeenCalledTimes(1)
  expect(sender).toHaveBeenCalledWith({
    baseUrl: undefined,
    clientId: 'Polybase',
    params: {},
    url: '/collections/col1/records/id1',
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
    baseUrl: undefined,
    clientId: 'Polybase',
    params: {},
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
    baseUrl: undefined,
    clientId: 'Polybase',
    params: {},
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
