import { Query } from '../Query'
import { Client } from '../Client'
import { defaultRequest } from './util'
import { Collection } from '../Collection'
import { parse } from '@polybase/polylang'

let sender: jest.Mock
let signer: jest.Mock
let register: jest.Mock
let client: Client

beforeEach(() => {
  sender = jest.fn()
  signer = jest.fn()
  register = jest.fn()
  client = new Client(sender, signer)
})

test('query is instance of Query', () => {
  const q = new Query(null as any as Collection<any>, client, register)
  expect(q).toBeInstanceOf(Query)
})

test('query is sent to client', async () => {
  const collection = new Collection('col1', client)

  const meta = {
    code: `
      collection col1 {
        id: string;
        name: string;
        isActive: boolean;

        function constructor(id: string, name: string, isActive: boolean) {
          this.id = id;
          this.name = name;
          this.isActive = isActive;
        }
      }
    `,
    ast: JSON.stringify((await parse(`
      collection col1 {
        id: string;
        name: string;
        isActive: boolean;

        function constructor(id: string, name: string, isActive: boolean) {
          this.id = id;
          this.name = name;
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

  const data = [{
    id: 'id1',
  }]
  sender.mockResolvedValue({
    data: {
      data,
    },
  })
  const q = new Query(collection, client, register)
  await q
    .limit(100)
    .where('name', '==', 'Hannah')
    .where('isActive', '==', true)
    .get()

  expect(sender).toHaveBeenCalledTimes(2)
  expect(sender).toHaveBeenCalledWith({
    ...defaultRequest,
    url: '/collections/col1/records',
    method: 'GET',
    params: {
      limit: 100,
      where: JSON.stringify({ name: 'Hannah', isActive: true }),
    },
  })
})

test('registers snapshot', () => {
  const listener = jest.fn()

  const collection = new Collection('col1', client)

  let q = new Query<any>(collection, client, register)

  q = q.limit(100).where('name', '==', 'Hannah')
  q.onSnapshot(listener)

  expect(register).toHaveBeenCalledWith(q, listener, undefined)
})

test('query key is correct', () => {
  const collection = new Collection('col1', client)

  const q = new Query<any>(collection, client, register)
  const key = q.key()
  expect(key).toBe('query:col1?{}')
})

test('sort/where/limit... methods return a new instance', () => {
  const collection = new Collection('col1', client)

  const q = new Query<any>(collection, client, register)

  const q2 = q.sort('name')
  expect(q).not.toBe(q2)

  const q3 = q2.where('name', '==', 'Hannah')
  expect(q2).not.toBe(q3)

  const q4 = q3.limit(100)
  expect(q3).not.toBe(q4)
})

test('records are valid query values', async () => {
  const collection = new Collection('col1', client)
  const userCollection = new Collection('user', client)

  const q = collection.where('user', '==', userCollection.record('id1'))
  expect(q.key()).toBe('query:col1?{"where":{"user":{"collectionId":"user","id":"id1"}}}')
})
