import { Query } from '../Query'
import { Client } from '../Client'
import { defaultRequest } from './util'

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
  const q = new Query('col1', client, register)
  expect(q).toBeInstanceOf(Query)
})

test('query is sent to client', async () => {
  const data = [{
    id: 'id1',
  }]
  sender.mockResolvedValue({
    data: {
      data,
    },
  })
  const q = new Query('col1', client, register)
  await q.limit(100).where('name', '==', 'Hannah').get()

  expect(sender).toHaveBeenCalledTimes(1)
  expect(sender).toHaveBeenCalledWith({
    ...defaultRequest,
    url: '/collections/col1',
    method: 'GET',
    params: {
      limit: 100,
      where: JSON.stringify({ name: 'Hannah' }),
    },
  })
})

test('registers snapshot', () => {
  const listener = jest.fn()
  let q = new Query<any>('col1', client, register)

  q = q.limit(100).where('name', '==', 'Hannah')
  q.onSnapshot(listener)

  expect(register).toHaveBeenCalledWith(q, listener, undefined)
})

test('query key is correct', () => {
  const q = new Query<any>('col1', client, register)
  const key = q.key()
  expect(key).toBe('query:col1?{}')
})

test('sort/where/limit... methods return a new instance', () => {
  const q = new Query<any>('col1', client, register)

  const q2 = q.sort('name')
  expect(q).not.toBe(q2)

  const q3 = q2.where('name', '==', 'Hannah')
  expect(q2).not.toBe(q3)

  const q4 = q3.limit(100)
  expect(q3).not.toBe(q4)
})
