import FakeTimers from '@sinonjs/fake-timers'
import { Subscription } from '../Subscription'
import { Client } from '../Client'

const clock = FakeTimers.install()

let sender: jest.Mock
let client: Client

beforeEach(() => {
  sender = jest.fn()
  client = new Client(sender)
})

test('sub is instance of Subscription', () => {
  const c = new Subscription({
    url: '/col/id',
    method: 'GET',
    params: {},
  }, client)
  expect(c).toBeInstanceOf(Subscription)
})

test('add subscriber', async () => {
  const spy = jest.fn()
  const rec = {
    id: '123',
  }
  const timestamp = '2011-10-05T14:48:00.000Z'

  sender.mockResolvedValue({
    status: 200,
    data: rec,
    headers: {
      'x-spacetime-timestamp': timestamp,
    },
  })

  const c = new Subscription({
    url: '/col/id',
    method: 'GET',
    params: {},
  }, client)

  c.subscribe(spy)

  expect(sender).toHaveBeenCalled()

  await clock.tickAsync(0)

  expect(spy).toHaveBeenCalledTimes(1)
  expect(spy).toHaveBeenCalledWith(rec)

  c.stop()

  // Stops on the next run
  await clock.tickAsync(200)
  expect(spy).toHaveBeenCalledTimes(2)

  // Has stopped
  await clock.tickAsync(200)
  expect(spy).toHaveBeenCalledTimes(2)
})
