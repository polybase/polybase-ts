import { useEffect, useState } from 'react'
import { Contract, Query } from '@polybase/client'
import { UseContractReturnValue } from './useContract'

export function useContractOnce<T=any> (contract?: Contract<T>|Query<T>|null): UseContractReturnValue<T> {
  const [res, setResult] = useState<UseContractReturnValue<T>>({ error: null, data: null, loading: true })
  const key = contract?.key()

  useEffect(() => {
    if (!contract) return
    setResult({ ...res, loading: true })
    contract.get().then((data) => {
      setResult({ error: null, data, loading: false })
    }).catch((e) => {
      setResult({ ...res, error: e, loading: false })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return res
}

export const useCollectionOnce = useContractOnce
