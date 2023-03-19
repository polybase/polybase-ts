import { Auth } from '../Auth'

test('onAuthUpdate listener is called with null', () => {
  const auth = new Auth()
  const listener = jest.fn()
  auth.loading = false
  auth.onAuthUpdate(listener)
  expect(listener).toHaveBeenCalledWith(null, auth)
})

test('onAuthUpdate listener is called with auth state', () => {
  const auth = new Auth()
  const listener = jest.fn()
  auth.loading = false
  auth.state = { type: 'metamask', userId: '0x123' }
  auth.onAuthUpdate(listener)
  expect(listener).toHaveBeenCalledWith(auth.state, auth)
})

test('onAuthUpdate listener is not called when loading', () => {
  const auth = new Auth()
  const listener = jest.fn()
  auth.loading = true
  auth.onAuthUpdate(listener)
  expect(listener).not.toHaveBeenCalled()
})
