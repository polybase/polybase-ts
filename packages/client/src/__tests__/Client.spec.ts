import { Client } from '../Client'

test('sign request withAuth: optional', async () => {
  const sender = jest.fn()
  const signer = jest.fn()
  const client = new Client(sender, signer)
  const req = client.request({
    url: '/test',
    method: 'GET',
  })
  await req.send('optional')
  expect(signer).toHaveBeenCalled()
})

test('sign request withAuth: required', async () => {
  const sender = jest.fn()
  const signer = jest.fn()
  const client = new Client(sender, signer)
  const req = client.request({
    url: '/test',
    method: 'GET',
  })
  await req.send('required')
  expect(signer).toHaveBeenCalled()
})

test('errors if no signer withAuth: required', async () => {
  const sender = jest.fn()
  const client = new Client(sender)
  const req = client.request({
    url: '/test',
    method: 'GET',
  })
  await expect(req.send('required')).rejects.toThrowErrorMatchingSnapshot()
})

test('does not sign withAuth: none', async () => {
  const sender = jest.fn()
  const signer = jest.fn()
  const client = new Client(sender, signer)
  const req = client.request({
    url: '/test',
    method: 'GET',
  })
  await req.send('none')
  expect(signer).not.toHaveBeenCalled()
})
