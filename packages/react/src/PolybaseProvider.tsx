import React, { createContext, ReactNode } from 'react'
import { Polybase } from '@polybase/client'

export const PolybaseContext = createContext<Polybase>(new Polybase())

export interface PolybaseProviderProps {
  polybase: Polybase
  children: ReactNode|ReactNode[]
}

export function PolybaseProvider ({ children, polybase }: PolybaseProviderProps) {
  return (
    <PolybaseContext.Provider value={polybase}>
      {children}
    </PolybaseContext.Provider>
  )
}
