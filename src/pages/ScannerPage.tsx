import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import MealStatus from '../components/MealStatus'
import { fetchSheetData, type SheetParticipant } from '../sheetService'
import type { MealRecord } from '../types'

type Status = 'idle' | 'scanning' | 'found' | 'not-found' | 'error' | 'already-claimed' | 'success'

export default function ScannerPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [participant, setParticipant] = useState<SheetParticipant | null>(null)
  const [localParticipant, setLocalParticipant] = useState<any>(null)
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [currentDay, setCurrentDay] = useState<number>(1)
  const [message, setMessage] = useState('')
  const [manualId, setManualId] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = 'qr-reader'

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        if (state === 2) {
          await scannerRef.current.stop()
        }
        scannerRef.current.clear()
      } catch {}
      scannerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => { stopScanner() }
  }, [stopScanner])

  const startScan = async () => {
    await stopScanner()
    setStatus('scanning')
    setMessage('Point camera at QR code...')

    try {
      const scanner = new Html5Qrcode(containerId)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanResult(decodedText)
          stopScanner()
        },
        () => {}
      )
    } catch (err) {
      console.error('Camera error:', err)
      setStatus('error')
      setMessage('Camera access denied. Use manual entry below.')
    }
  }

  const handleScanResult = async (scannedId: string) => {
    const id = scannedId.trim()

    // First search in Google Sheet
    const sheetData = await fetchSheetData()
    const sheetMatch = sheetData.find(
      (p) => p.registrationId === id
    )

    if (sheetMatch) {
      setParticipant(sheetMatch)
      setLocalParticipant(null)

      // Check meals for this ID
      const allMeals: MealRecord[] = JSON.parse(
        localStorage.getItem('meals') || '[]'
      )
      const participantMeals = allMeals.filter(
        (m) => m.registrationId === sheetMatch.registrationId
      )
      setMeals(participantMeals)

      const alreadyClaimed = participantMeals.some(
        (m) => m.dayNumber === currentDay
      )

      if (alreadyClaimed) {
        setStatus('already-claimed')
        setMessage(`Day ${currentDay} meal already claimed for ${sheetMatch.fullName}`)
      } else {
        setStatus('found')
        setMessage(`${sheetMatch.fullName} — Day ${currentDay} meal ready`)
      }
      return
    }

    // Fallback: search in localStorage
    const localParticipants: any[] = JSON.parse(
      localStorage.getItem('participants') || '[]'
    )
    const localMatch = localParticipants.find(
      (p: any) => p.registrationId === id || p.qrToken === id
    )

    if (localMatch) {
      setLocalParticipant(localMatch)
      setParticipant(null)

      const allMeals: MealRecord[] = JSON.parse(
        localStorage.getItem('meals') || '[]'
      )
      const participantMeals = allMeals.filter(
        (m) => m.registrationId === localMatch.registrationId
      )
      setMeals(participantMeals)

      const alreadyClaimed = participantMeals.some(
        (m) => m.dayNumber === currentDay
      )

      if (alreadyClaimed) {
        setStatus('already-claimed')
        setMessage(`Day ${currentDay} meal already claimed for ${localMatch.fullName}`)
      } else {
        setStatus('found')
        setMessage(`${localMatch.fullName} — Day ${currentDay} meal ready`)
      }
      return
    }

    // Not found anywhere
    setStatus('not-found')
    setMessage(`Participant not found: ${id}`)
    setParticipant(null)
    setLocalParticipant(null)
  }

  const handleManualLookup = () => {
    if (manualId.trim()) {
      handleScanResult(manualId.trim())
      setManualId('')
    }
  }

  const confirmMeal = () => {
    const regId = participant?.registrationId || localParticipant?.registrationId
    const name = participant?.fullName || localParticipant?.fullName
    if (!regId) return

    const mealRecord: MealRecord = {
      id: crypto.randomUUID(),
      registrationId: regId,
      dayNumber: currentDay,
      date: new Date().toISOString().split('T')[0],
      distributedBy: 'Staff',
      distributedAt: new Date().toLocaleString(),
    }

    const allMeals: MealRecord[] = JSON.parse(
      localStorage.getItem('meals') || '[]'
    )
    allMeals.push(mealRecord)
    localStorage.setItem('meals', JSON.stringify(allMeals))
    setMeals((prev) => [...prev, mealRecord])

    setStatus('success')
    setMessage(`Day ${currentDay} meal confirmed for ${name}`)
  }

  const reset = () => {
    setStatus('idle')
    setParticipant(null)
    setLocalParticipant(null)
    setMeals([])
    setMessage('')
  }

  const displayName = participant?.fullName || localParticipant?.fullName || ''
  const displayRegId = participant?.registrationId || localParticipant?.registrationId || ''
  const displayPhone = participant?.phone || localParticipant?.phone || ''
  const displayChurch = participant?.church || localParticipant?.church || ''
  const displayAddress = participant?.address || localParticipant?.address || ''
  const displayCategory = localParticipant?.category || 'Participant'

  const statusColors: Record<Status, string> = {
    idle: 'bg-gray-100 text-gray-600',
    scanning: 'bg-blue-100 text-blue-700',
    found: 'bg-emerald-100 text-emerald-700',
    'not-found': 'bg-red-100 text-red-700',
    error: 'bg-amber-100 text-amber-700',
    'already-claimed': 'bg-orange-100 text-orange-700',
    success: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">QR Scanner</h1>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Day:</label>
          <select
            className="input-field !w-20 !py-1.5 text-sm"
            value={currentDay}
            onChange={(e) => setCurrentDay(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6].map((d) => (
              <option key={d} value={d}>Day {d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scanner viewport */}
      <div className="card overflow-hidden">
        <div id={containerId} className="w-full min-h-[280px] bg-black" />
      </div>

      {/* Status */}
      <div className={`px-4 py-2 rounded-xl text-sm font-medium ${statusColors[status]}`}>
        {message || 'Tap scan to start'}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {status === 'idle' || status === 'scanning' ? (
          <button onClick={startScan} className="btn-primary flex-1">
            📷 Start Scan
          </button>
        ) : (
          <button onClick={reset} className="btn-secondary flex-1">
            Scan Again
          </button>
        )}
      </div>

      {/* Manual Entry */}
      <div className="card p-4">
        <label className="label">Manual Entry</label>
        <div className="flex gap-2">
          <input
            type="text"
            className="input-field"
            placeholder="Enter Reg ID (e.g. KYC/T/18/001)"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
          />
          <button onClick={handleManualLookup} className="btn-primary !px-4">
            Look Up
          </button>
        </div>
      </div>

      {/* Participant Info */}
      {(participant || localParticipant) && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-emerald-700">
                {displayName.charAt(0)}
              </span>
            </div>
            <div>
              <div className="font-bold text-gray-900">{displayName}</div>
              <div className="text-xs text-gray-500 font-mono">
                {displayRegId}
              </div>
              {participant && (
                <div className="text-[10px] text-emerald-600 font-medium">
                  From Google Sheet
                </div>
              )}
              {localParticipant && (
                <div className="text-[10px] text-blue-600 font-medium">
                  From Local Registration
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <InfoRow label="Phone" value={displayPhone} />
            <InfoRow label="Church" value={displayChurch} />
            <InfoRow label="Address" value={displayAddress} />
            <InfoRow label="Category" value={displayCategory} />
          </div>

          <MealStatus meals={meals} />

          {(status === 'found' || status === 'success') && (
            <button
              onClick={confirmMeal}
              disabled={status === 'success'}
              className="btn-primary w-full"
            >
              {status === 'success'
                ? '✓ Meal Confirmed'
                : `Confirm Day ${currentDay} Meal`}
            </button>
          )}

          {status === 'already-claimed' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700 text-center font-medium">
              This participant already received today's meal.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="font-medium text-gray-800">{value || '—'}</div>
    </div>
  )
}
