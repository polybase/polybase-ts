import React, { createContext, ReactNode } from 'react'
import { Spacetime } from '@spacetimexyz/client'

export const SpacetimeContext = createContext<Spacetime>(new Spacetime())

export interface SpacetimeProviderProps {
  spacetime: Spacetime
  children: ReactNode|ReactNode[]
}

export function SpacetimeProvider ({ children, spacetime }: SpacetimeProviderProps) {
  return (
    <SpacetimeContext.Provider value={spacetime}>
      {children}
    </SpacetimeContext.Provider>
  )
}
