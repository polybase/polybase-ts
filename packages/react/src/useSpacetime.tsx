import { useContext } from 'react'
import { SpacetimeContext } from './SpacetimeProvider'

export function useSpacetime () {
  return useContext(SpacetimeContext)
}