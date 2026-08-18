import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ScanLine, Home, UserPlus, Users, CreditCard, LogOut, Shield } from 'lucide-react'
import { getSession, logout, type StaffRole } from '../auth'

const allNavItems = [
  { to: '/', icon: Home, label: 'Home', roles: ['admin', 'registration', 'meal'] as StaffRole[] },
  { to: '/cards', icon: CreditCard, label: 'Cards', roles: ['admin'] as StaffRole[] },
  { to: '/register', icon: UserPlus, label: 'Register', roles: ['admin', 'registration'] as StaffRole[] },
  { to: '/scan', icon: ScanLine, label: 'Scan', roles: ['admin', 'meal'] as StaffRole[] },
  { to: '/participants', icon: Users, label: 'Data', roles: ['admin', 'registration'] as StaffRole[] },
  { to: '/staff', icon: Shield, label: 'Staff', roles: ['admin'] as StaffRole[] },
]

const ROLE_BADGE: Record<StaffRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  registration: 'bg-blue-100 text-blue-700',
  meal: 'bg-amber-100 text-amber-700',
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const session = getSession()
  const role = session?.role ?? 'admin'

  const navItems = allNavItems.filter((item) => item.roles.includes(role))

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="page-container">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-gray-200">
              <img src="/card-hero.jpg" alt="HKC" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-bold text-gray-800">HKC</span>
          </div>

          <div className="flex items-center gap-2">
            {session && (
              <>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[role]}`}>
                  {role === 'admin' ? 'Admin' : role === 'registration' ? 'Reg' : 'Meal'}
                </span>
                <span className="text-[11px] text-gray-500 hidden sm:block">{session.name}</span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="px-4 pt-4 pb-24">
        <Outlet />
      </main>

      <nav className="nav-bar">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
