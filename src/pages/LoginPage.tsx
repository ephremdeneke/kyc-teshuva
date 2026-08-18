import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getSession } from '../auth'

const ROLE_LABELS = {
  admin: { label: 'Admin', icon: '👨‍💼', color: 'bg-purple-100 text-purple-700' },
  registration: { label: 'Registration', icon: '📋', color: 'bg-blue-100 text-blue-700' },
  meal: { label: 'Meal Staff', icon: '🍽️', color: 'bg-amber-100 text-amber-700' },
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Check if already logged in
  const existing = getSession()
  if (existing) {
    navigate('/', { replace: true })
    return null
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !pin) {
      setError('Enter phone and PIN')
      return
    }

    setLoading(true)
    // Simulate slight delay for UX
    setTimeout(() => {
      const session = login(phone, pin)
      if (session) {
        navigate('/', { replace: true })
      } else {
        setError('Invalid phone or PIN')
        setLoading(false)
      }
    }, 300)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto shadow-lg border-2 border-white">
            <img src="/card-hero.jpg" alt="HKC" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Staff Login</h1>
            <p className="text-xs text-gray-500 mt-1">HKC Event 2026</p>
          </div>
        </div>

        {/* Role badges */}
        <div className="flex justify-center gap-2">
          {(Object.entries(ROLE_LABELS) as [string, typeof ROLE_LABELS.admin][]).map(
            ([role, info]) => (
              <div key={role} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${info.color}`}>
                <span>{info.icon}</span>
                <span>{info.label}</span>
              </div>
            )
          )}
        </div>

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                inputMode="numeric"
                className="input-field text-center text-lg tracking-wider"
                placeholder="09XX XXX XXX"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ''))
                  setError('')
                }}
                autoFocus
              />
            </div>

            <div>
              <label className="label">PIN Code</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="••••"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''))
                  setError('')
                }}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs text-center py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !phone || !pin}
              className="btn-primary w-full"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Default credentials hint */}
        <div className="card p-4">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Default Logins</div>
          <div className="space-y-1.5">
            <HintRow role="Admin" phone="0000" pin="1234" />
            <HintRow role="Registration" phone="0001" pin="1111" />
            <HintRow role="Meal Staff" phone="0002" pin="2222" />
          </div>
        </div>

        {/* Skip (demo only) */}
        <button
          onClick={() => navigate('/')}
          className="text-xs text-gray-400 text-center w-full block hover:text-gray-600"
        >
          Skip for demo
        </button>
      </div>
    </div>
  )
}

function HintRow({ role, phone, pin }: { role: string; phone: string; pin: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-gray-600 font-medium">{role}</span>
      <span className="text-gray-400 font-mono">
        {phone} / {pin}
      </span>
    </div>
  )
}
