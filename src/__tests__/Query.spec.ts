import { Query } from '../Query'
import { Client } from '../Client'
import { defaultRequest } from './util'

let sender: jest.Mock
let register: jest.Mock
let client: Client

beforeEach(() => {
  sender = jest.fn()
  register = jest.fn()
  client = new Client(sender)
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
    data,
  })
  const q = new Query('col1', client, register)
  await q.limit(100).where('name', '==', 'Hannah').get()

  expect(sender).toBeCalledTimes(1)
  expect(sender).toBeCalledWith({
    ...defaultRequest,
    url: '/col1',
    method: 'GET',
    params: {
      limit: 100,
      where: JSON.stringify({ name: 'Hannah' }),
    },
  })
})

test('registers snapshot', () => {
  const listener = jest.fn()
  const q = new Query<any>('col1', client, register)

  q.limit(100).where('name', '==', 'Hannah').onSnapshot(listener)

  expect(register).toHaveBeenCalledWith(q, listener, undefined)
})
