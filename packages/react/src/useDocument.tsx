import { useEffect, useState } from 'react'
import { Doc, SpacetimeError, CollectionDocument } from '@spacetimexyz/client'

export interface UseDocumentReturnValue<T> {
  error: SpacetimeError|null
  data: CollectionDocument<T>|null
  loading: boolean
}

export function useDocument<T=any> (doc?: Doc<T>|null): UseDocumentReturnValue<T> {
  const [res, setResult] = useState<UseDocumentReturnValue<T>>({ error: null, data: null, loading: true })
  const key = doc?.key()

  useEffect(() => {
    if (!doc) return
    setResult({ ...res, loading: true })
    const unsub = doc.onSnapshot((data) => {
      setResult({ data, error: null, loading: false })
    }, (err) => {
      setResult({ data: res.data, error: err, loading: false })
    })
    return unsub
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return res
}