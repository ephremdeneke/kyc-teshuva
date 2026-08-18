import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, QrCode, BarChart3, Users, CreditCard } from 'lucide-react'
import { fetchSheetData } from '../sheetService'

export default function HomePage() {
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSheetData().then((data) => {
      setTotalCount(data.length)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-5 pt-4">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg h-48">
        <img
          src="/event-photo.jpg"
          alt="HKC Event"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/80">
              <img src="/card-hero.jpg" alt="HKC" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">HKC Event 2026</h1>
              <p className="text-xs opacity-80"> • HOSSANA KALE HIWOT CHURCH </p>
            </div>
          </div>
          <p className="text-[11px] opacity-70 mt-1">Registration & Meal Verification System</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {loading ? '...' : totalCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">Registered</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {loading ? '...' : totalCount * 6}
          </div>
          <div className="text-xs text-gray-500 mt-1">Meals Possible</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {features.map(({ to, icon: Icon, title, desc, color }) => (
          <Link
            key={to}
            to={to}
            className="card p-4 flex flex-col items-center text-center gap-2 hover:shadow-xl transition-shadow active:scale-95"
          >
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">{title}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Info Card */}
      <div className="card p-4">
        <h2 className="text-sm font-bold text-gray-700 mb-3">Quick Info</h2>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Event Days</span>
            <span className="font-medium">6 Days</span>
          </div>
          <div className="flex justify-between">
            <span>Meals per Day</span>
            <span className="font-medium">1 per participant</span>
          </div>
          <div className="flex justify-between">
            <span>Data Source</span>
            <span className="font-medium text-emerald-600">Google Sheets</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const features = [
  {
    to: '/cards',
    icon: CreditCard,
    title: 'Generate Cards',
    desc: 'Bulk print cards',
    color: 'bg-rose-500',
  },
  {
    to: '/register',
    icon: UserPlus,
    title: 'Register',
    desc: 'New participant',
    color: 'bg-emerald-500',
  },
  {
    to: '/scan',
    icon: QrCode,
    title: 'Scan',
    desc: 'QR meal verify',
    color: 'bg-blue-500',
  },
  {
    to: '/participants',
    icon: Users,
    title: 'All Data',
    desc: 'Browse & search',
    color: 'bg-amber-500',
  },
  {
    to: '/stats',
    icon: BarChart3,
    title: 'Stats',
    desc: 'Meal statistics',
    color: 'bg-purple-500',
  },
]
