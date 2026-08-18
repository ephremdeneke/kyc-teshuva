import type { MealRecord } from '../types'

interface Props {
  meals: MealRecord[]
}

export default function MealStatus({ meals }: Props) {
  const days = Array.from({ length: 6 }, (_, i) => i + 1)
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">Meal Status</h3>
      <div className="grid grid-cols-2 gap-2">
        {days.map((day) => {
          const meal = meals.find((m) => m.dayNumber === day)
          return (
            <div
              key={day}
              className={`flex items-center gap-2 p-2 rounded-lg border ${
                meal
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  meal ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {meal ? '✓' : day}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-700">Day {day}</div>
                {meal && (
                  <div className="text-[10px] text-gray-500 truncate">
                    {meal.distributedAt}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
