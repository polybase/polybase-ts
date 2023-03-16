import React from 'react'
// import { render, screen, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react-hooks'
import '@testing-library/jest-dom/extend-expect'
import { AuthProvider } from '../AuthProvider'
import { useAuth } from '../useAuth'
// import type { AuthState } from '@polybase/auth'
import { Signer } from '@polybase/client'
import { AuthBase, PolybaseBase } from '../types'
import type { AuthState } from '@polybase/auth'
// import type { AuthState } from '@polybase/auth'

let auth: AuthBase
let polybase: PolybaseBase
let fn: (state: AuthState | null) => void

beforeEach(() => {
  auth = {
    ethPersonalSign: jest.fn(async () => 'ethPersonalSign'),
    onAuthUpdate: jest.fn((cb) => { fn = cb; return () => { } }),
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

test('should set loading false on cb', () => {
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
})
