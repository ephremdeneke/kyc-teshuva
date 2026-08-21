import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchSheetData, type SheetParticipant } from './sheetService'

const POLL_INTERVAL = 30 * 1000 // 30 seconds

export function useSheetData() {
  const [data, setData] = useState<SheetParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async (force = false) => {
    try {
      const result = await fetchSheetData(force)
      setData(result)
      setError(null)
      setLastUpdated(new Date())
    } catch (err: any) {
      const msg = err?.message || String(err)
      if (msg.includes('APP_CONFIG_MISSING')) {
        setError('APP_CONFIG_MISSING')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + auto-refresh
  useEffect(() => {
    load(true)
    timerRef.current = setInterval(() => load(true), POLL_INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [load])

  const refresh = useCallback(() => load(true), [load])

  return { data, loading, error, lastUpdated, refresh }
}
