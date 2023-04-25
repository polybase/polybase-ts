import { useEffect, useState } from 'react'
import { CollectionRecord, PolybaseError, CollectionRecordResponse } from '@polybase/client'

export interface UseRecordReturnValue<T, NT extends T | null = T> {
  error: PolybaseError | null
  data: CollectionRecordResponse<T, NT> | null
  loading: boolean
}

export function useRecord<T = any>(record?: CollectionRecord<T> | null): UseRecordReturnValue<T> {
  const [res, setResult] = useState<UseRecordReturnValue<T>>({ error: null, data: null, loading: true })
  const key = record?.key()

  useEffect(() => {
    if (!record) return
    setResult({ ...res, loading: true })
    const unsub = record.onSnapshot((data) => {
      setResult({ data, error: null, loading: false })
    }, (err) => {
      setResult({ data: res.data, error: err, loading: false })
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return res
}

export const useDocument = useRecord
