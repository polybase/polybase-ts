import { useContext } from 'react'
import { PolybaseContext } from './PolybaseProvider'

export function usePolybase () {
  return useContext(PolybaseContext)
}
