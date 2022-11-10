import { useEffect, useState } from 'react'
import { CollectionRecord } from '@polybase/client'
import { UseRecordReturnValue } from './useRecord'

export function useRecordOnce<T=any> (record?: CollectionRecord<T>|null): UseRecordReturnValue<T> {
  const [res, setResult] = useState<UseRecordReturnValue<T>>({ error: null, data: null, loading: true })
  const key = record?.key()

  useEffect(() => {
    if (!record) return
    setResult({ ...res, loading: true })
    record.get().then((data) => {
      setResult({ error: null, data, loading: false })
    }).catch((e) => {
      setResult({ ...res, error: e, loading: false })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return res
}

export const useRecordONce = useRecordOnce
