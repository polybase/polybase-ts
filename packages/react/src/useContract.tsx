import { useEffect, useState } from 'react'
import { Contract, ContractList, Query, PolybaseError } from '@polybase/client'

export interface UseContractReturnValue<T> {
  error: PolybaseError|null
  data: ContractList<T>|null
  loading: boolean
}

export function useContract<T=any> (contract?: Contract<T>|Query<T>|null): UseContractReturnValue<T> {
  const [res, setResult] = useState<UseContractReturnValue<T>>({ error: null, data: null, loading: true })
  const key = contract?.key()

  useEffect(() => {
    if (!contract) return
    setResult({ ...res, loading: true })
    const unsub = contract.onSnapshot((data) => {
      setResult({ data, error: null, loading: false })
    }, (err) => {
      setResult({ data: res.data, error: err, loading: false })
    })
    return unsub
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return res
}

export const useCollection = useContract
