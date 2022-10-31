import { Doc } from '../Doc'
import { Contract } from '../Contract'
import { Client } from '../Client'
import { defaultRequest } from './util'

let sender: jest.Mock
let signer: jest.Mock
let register: jest.Mock
let client: Client
let contract: Contract<any>

beforeEach(() => {
  sender = jest.fn()
  signer = jest.fn()
  register = jest.fn()
  client = new Client(sender, signer)
  contract = new Contract('col1', client)
})

test('doc is instance of Doc', () => {
  const d = new Doc('id1', contract, client, register)
  expect(d).toBeInstanceOf(Doc)
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
  const d = new Doc('id1', contract, client, register)
  await d.get()

  expect(sender).toHaveBeenCalledTimes(1)
  expect(sender).toHaveBeenCalledWith({
    ...defaultRequest,
    url: '/contracts/col1/id1',
    method: 'GET',
  })
})

test('registers snapshot', () => {
  const listener = jest.fn()
  const d = new Doc('id1', contract, client, register)

  d.onSnapshot(listener)

  expect(register).toHaveBeenCalledWith(d, listener, undefined)
})

test('doc key is correct', () => {
  const d = new Doc('id1', contract, client, register)
  const key = d.key()
  expect(key).toBe('doc:col1/id1')
})

test('.call() sends a call request', async () => {
  const meta = {
    code: `
      contract col {
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

  const c = new Contract('col', client)
  const result = await c.doc('id1').call('setAge', [20])

  expect(sender).toHaveBeenCalledWith({
    ...defaultRequest,
    url: '/contracts/col/id1/call/setAge',
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
