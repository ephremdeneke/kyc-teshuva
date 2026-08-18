import { useState, useEffect } from 'react'
import { fetchSheetData, getSheetStats, type SheetParticipant } from '../sheetService'
import type { MealRecord } from '../types'

interface DayStat {
  day: number
  count: number
}

export default function StatsPage() {
  const [participants, setParticipants] = useState<SheetParticipant[]>([])
  const [dayStats, setDayStats] = useState<DayStat[]>([])
  const [totalMeals, setTotalMeals] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchSheetData()
      setParticipants(data)

      const meals: MealRecord[] = JSON.parse(
        localStorage.getItem('meals') || '[]'
      )
      setTotalMeals(meals.length)

      const stats: DayStat[] = Array.from({ length: 6 }, (_, i) => ({
        day: i + 1,
        count: meals.filter((m) => m.dayNumber === i + 1).length,
      }))
      setDayStats(stats)
      setLoading(false)
    }
    loadData()
  }, [])

  const maxMeals = Math.max(...dayStats.map((d) => d.count), 1)
  const sheetStats = getSheetStats(participants)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4">
      <h1 className="text-lg font-bold">Statistics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-emerald-600">{participants.length}</div>
          <div className="text-xs text-gray-500 mt-1">Registered</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{totalMeals}</div>
          <div className="text-xs text-gray-500 mt-1">Meals Given</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {sheetStats.totalPayment.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">Total ETB Collected</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">
            {sheetStats.churches.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Churches</div>
        </div>
      </div>

      {/* Meal Distribution Chart */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Meals by Day</h3>
        <div className="space-y-3">
          {dayStats.map(({ day, count }) => (
            <div key={day} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-700">Day {day}</span>
                <span className="text-gray-500">{count} meals</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(count / maxMeals) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Churches */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Top Churches</h3>
        <div className="space-y-1.5">
          {sheetStats.churches.slice(0, 10).map(([name, count]) => (
            <div key={name} className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
              <span className="text-gray-600">{name || 'Unknown'}</span>
              <span className="font-medium text-gray-800">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Payment Methods</h3>
        <div className="space-y-1.5">
          {sheetStats.paymentMethods.map(([method, count]) => (
            <div key={method} className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
              <span className="text-gray-600">{method || 'Unknown'}</span>
              <span className="font-medium text-gray-800">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Capacity */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Capacity</h3>
        <div className="space-y-2 text-xs">
          <Row label="Total Registered" value={`${participants.length}`} />
          <Row label="Total Possible Meals" value={`${participants.length * 6}`} />
          <Row label="Meals Distributed" value={`${totalMeals}`} />
          <Row
            label="Remaining"
            value={`${participants.length * 6 - totalMeals}`}
          />
          <Row
            label="Utilization"
            value={
              participants.length > 0
                ? `${Math.round((totalMeals / (participants.length * 6)) * 100)}%`
                : '0%'
            }
          />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}
