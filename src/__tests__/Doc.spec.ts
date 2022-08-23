import { Doc } from '../Doc'
import { Collection } from '../Collection'
import { Client } from '../Client'
import { defaultRequest } from './util'

let sender: jest.Mock
let register: jest.Mock
let client: Client
let collection: Collection

beforeEach(() => {
  sender = jest.fn()
  register = jest.fn()
  client = new Client(sender)
  collection = new Collection('col1', client)
})

test('doc is instance of Doc', () => {
  const d = new Doc('id1', collection, client, register)
  expect(d).toBeInstanceOf(Doc)
})

test('get request is sent to client', async () => {
  const data = {
    id: 'id1',
  }
  sender.mockResolvedValue({
    data,
  })
  const d = new Doc('id1', collection, client, register)
  await d.get()

  expect(sender).toBeCalledTimes(1)
  expect(sender).toBeCalledWith({
    ...defaultRequest,
    url: '/col1/id1',
    method: 'GET',
  })
})

test('delete request is sent to client', async () => {
  const data = {
    id: 'id1',
  }
  sender.mockResolvedValue({
    data,
  })
  const d = new Doc('id1', collection, client, register)
  await d.delete()

  expect(sender).toBeCalledTimes(1)
  expect(sender).toBeCalledWith({
    ...defaultRequest,
    url: '/col1/id1',
    method: 'DELETE',
  })
})

test('set request is sent to client', async () => {
  const meta = {
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
    },
  }

  const data = [{
    id: 'id1',
  }]
  sender.mockResolvedValueOnce({
    data: meta,
  })
  sender.mockResolvedValueOnce({
    data,
  })
  const d = new Doc('id1', collection, client, register)
  const set = { name: 'Jenna' }
  await d.set(set)

  expect(sender).toBeCalledTimes(2)
  expect(sender).toBeCalledWith({
    ...defaultRequest,
    url: '/col1/id1',
    method: 'PUT',
    data: set,
  })
})

test('registers snapshot', () => {
  const listener = jest.fn()
  const d = new Doc('id1', collection, client, register)

  d.onSnapshot(listener)

  expect(register).toHaveBeenCalledWith(d, listener, undefined)
})
