import { useState, useEffect, useCallback } from 'react'
import {
  fetchSheetData,
  searchParticipants,
  getSheetStats,
  type SheetParticipant,
} from '../sheetService'
import type { MealRecord } from '../types'

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<SheetParticipant[]>([])
  const [filtered, setFiltered] = useState<SheetParticipant[]>([])
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SheetParticipant | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<ReturnType<typeof getSheetStats> | null>(null)
  const [view, setView] = useState<'list' | 'stats'>('list')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 50

  const loadData = useCallback(async (force = false) => {
    if (force) setRefreshing(true)
    else setLoading(true)

    try {
      const data = await fetchSheetData(force)
      setParticipants(data)
      setFiltered(data)
      setStats(getSheetStats(data))

      const storedMeals: MealRecord[] = JSON.parse(
        localStorage.getItem('meals') || '[]'
      )
      setMeals(storedMeals)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(participants)
      setPage(1)
      return
    }
    searchParticipants(search).then((res) => {
      setFiltered(res)
      setPage(1)
    })
  }, [search, participants])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const getMeals = (regId: string) =>
    meals.filter((m) => m.registrationId === regId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm text-gray-500">Loading participants...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Participants</h1>
          <p className="text-xs text-gray-500">
            {filtered.length} of {participants.length} loaded
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
          >
            {refreshing ? '...' : '↻ Refresh'}
          </button>
          <button
            onClick={() => setView(view === 'list' ? 'stats' : 'list')}
            className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg font-medium"
          >
            {view === 'list' ? 'Stats' : 'List'}
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        className="input-field"
        placeholder="Search name, ID, phone, church, address..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Stats View */}
      {view === 'stats' && stats && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.total}</div>
              <div className="text-xs text-gray-500">Total Registered</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalPayment.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Total ETB</div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">By Church</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {stats.churches.map(([name, count]) => (
                <div key={name} className="flex justify-between text-xs py-1 border-b border-gray-50">
                  <span className="text-gray-600">{name || 'Unknown'}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">By District</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {stats.districts.map(([name, count]) => (
                <div key={name} className="flex justify-between text-xs py-1 border-b border-gray-50">
                  <span className="text-gray-600">{name}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Payment Methods</h3>
            <div className="space-y-1.5">
              {stats.paymentMethods.map(([method, count]) => (
                <div key={method} className="flex justify-between text-xs py-1 border-b border-gray-50">
                  <span className="text-gray-600">{method || 'Unknown'}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detail View */}
      {selected && view === 'list' && (
        <div className="space-y-3">
          <button
            onClick={() => setSelected(null)}
            className="text-sm text-emerald-600 font-medium"
          >
            ← Back to list
          </button>
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-emerald-700">
                  {selected.fullName.charAt(0)}
                </span>
              </div>
              <div>
                <div className="font-bold">{selected.fullName}</div>
                <div className="text-xs font-mono text-gray-500">
                  {selected.registrationId}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Info label="Phone" value={selected.phone} />
              <Info label="Church" value={selected.church} />
              <Info label="Address" value={selected.address} />
              <Info label="District" value={selected.serviceDistrict} />
              <Info label="Payment" value={`${selected.paymentAmount || 0} ETB`} />
              <Info label="Method" value={selected.paymentMethod} />
              <Info label="Date" value={selected.date} />
            </div>

            <div className="border-t pt-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Meal Status (Event)</h4>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((day) => {
                  const meal = getMeals(selected.registrationId).find(
                    (m) => m.dayNumber === day
                  )
                  return (
                    <div
                      key={day}
                      className={`text-center p-2 rounded-lg text-xs ${
                        meal
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      Day {day}
                      <div className="text-[10px]">
                        {meal ? '✓ Claimed' : '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && !selected && (
        <div className="space-y-2">
          {paged.length === 0 ? (
            <div className="card p-8 text-center text-gray-400 text-sm">
              {participants.length === 0
                ? 'No data loaded. Tap Refresh.'
                : 'No results found.'}
            </div>
          ) : (
            <>
              {paged.map((p, idx) => {
                const pMeals = getMeals(p.registrationId)
                return (
                  <div
                    key={`${p.registrationId}-${idx}`}
                    className="card p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => setSelected(p)}
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-emerald-700">
                        {p.fullName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {p.fullName}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {p.registrationId}
                      </div>
                      <div className="text-[10px] text-gray-400 flex gap-2">
                        <span>{p.church}</span>
                        {p.phone && <span>📱 {p.phone}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-medium text-emerald-600">
                        {p.paymentAmount || 0} ETB
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {pMeals.length}/6 meals
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 py-3">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-gray-500">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="font-medium text-gray-800">{value || '—'}</div>
    </div>
  )
}
