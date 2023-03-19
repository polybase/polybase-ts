import React from 'react'
import { renderHook, act } from '@testing-library/react-hooks'
import '@testing-library/jest-dom/extend-expect'
import { AuthProvider } from '../AuthProvider'
import { useAuth } from '../useAuth'
import { Signer } from '@polybase/client'
import { Auth, PolybaseBase } from '../types'
import { Auth as PolybaseAuth, AuthState } from '@polybase/auth'

let auth: Auth
let polybase: PolybaseBase
let fn: (state: AuthState | null) => void
let authState: AuthState

beforeEach(() => {
  auth = {
    ethPersonalSign: jest.fn(async () => 'ethPersonalSign'),
    onAuthUpdate: jest.fn((cb) => { fn = cb; return () => { } }),
    signIn: jest.fn(async () => authState),
    signOut: jest.fn(),
  }
  polybase = {
    signer: jest.fn((fn: Signer) => { }),
  }
})

test('should be set to loading on init', () => {
  const wrapper: React.FC = ({ children }: any) => (
    <AuthProvider auth={auth} polybase={polybase}>
      {children}
    </AuthProvider>
  )
  const { result } = renderHook(() => useAuth(), { wrapper })

  expect(result.current.loading).toBe(true)
})

test('should load signed in auth state', () => {
  const wrapper: React.FC = ({ children }: any) => (
    <AuthProvider auth={auth} polybase={polybase}>
      {children}
    </AuthProvider>
  )
  const { result } = renderHook(() => useAuth(), { wrapper })

  act(() => {
    fn({ userId: '0x123', type: 'metamask' })
  })

  expect(result.current.loading).toBe(false)
  expect(result.current.state).toEqual({ userId: '0x123', type: 'metamask' })
})

test('should load not signed in auth state', () => {
  const wrapper: React.FC = ({ children }: any) => (
    <AuthProvider auth={auth} polybase={polybase}>
      {children}
    </AuthProvider>
  )
  const { result } = renderHook(() => useAuth(), { wrapper })

  act(() => {
    fn(null)
  })

  expect(result.current.loading).toBe(false)
  expect(result.current.state).toEqual(null)
})

test('should work with @polybase/auth', () => {
  auth = new PolybaseAuth()
  const wrapper: React.FC = ({ children }: any) => (
    <AuthProvider auth={auth} polybase={polybase}>
      {children}
    </AuthProvider>
  )
  const { result } = renderHook(() => useAuth(), { wrapper })

  act(() => {
    fn(null)
  })

  expect(result.current.loading).toBe(true)
  expect(result.current.state).toEqual(null)
})
