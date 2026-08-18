// Auth store — PIN-based login with role-based access
// Staff list lives in localStorage, seeded with defaults on first load

export type StaffRole = 'admin' | 'registration' | 'meal'

export interface StaffMember {
  id: string
  name: string
  phone: string
  pin: string
  role: StaffRole
  active: boolean
}

export interface Session {
  staffId: string
  name: string
  role: StaffRole
  loginAt: number
  expiresAt: number
}

const STAFF_KEY = 'hkcc_staff'
const SESSION_KEY = 'hkcc_session'
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours

const DEFAULT_STAFF: StaffMember[] = [
  { id: '1', name: 'Admin', phone: '0000', pin: '1234', role: 'admin', active: true },
  { id: '2', name: 'Registration Desk', phone: '0001', pin: '1111', role: 'registration', active: true },
  { id: '3', name: 'Meal Staff', phone: '0002', pin: '2222', role: 'meal', active: true },
]

// ── Staff CRUD ──────────────────────────────────────────────

export function getStaffList(): StaffMember[] {
  const raw = localStorage.getItem(STAFF_KEY)
  if (!raw) {
    localStorage.setItem(STAFF_KEY, JSON.stringify(DEFAULT_STAFF))
    return DEFAULT_STAFF
  }
  return JSON.parse(raw)
}

export function saveStaffList(staff: StaffMember[]) {
  localStorage.setItem(STAFF_KEY, JSON.stringify(staff))
}

export function addStaff(member: Omit<StaffMember, 'id'>): StaffMember {
  const list = getStaffList()
  const newMember: StaffMember = {
    ...member,
    id: String(Date.now()),
  }
  list.push(newMember)
  saveStaffList(list)
  return newMember
}

export function updateStaff(id: string, updates: Partial<StaffMember>) {
  const list = getStaffList()
  const idx = list.findIndex((s) => s.id === id)
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...updates }
    saveStaffList(list)
  }
}

export function removeStaff(id: string) {
  const list = getStaffList().filter((s) => s.id !== id)
  saveStaffList(list)
}

// ── Login / Session ─────────────────────────────────────────

export function login(phone: string, pin: string): Session | null {
  const staff = getStaffList().find(
    (s) => s.active && s.phone === phone && s.pin === pin
  )
  if (!staff) return null

  const now = Date.now()
  const session: Session = {
    staffId: staff.id,
    name: staff.name,
    role: staff.role,
    loginAt: now,
    expiresAt: now + SESSION_DURATION,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  const session: Session = JSON.parse(raw)
  if (Date.now() > session.expiresAt) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
  return session
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

// ── Role helpers ────────────────────────────────────────────

export function hasRole(requiredRole: StaffRole): boolean {
  const session = getSession()
  if (!session) return false
  if (session.role === 'admin') return true // admin sees everything
  return session.role === requiredRole
}

export function canAccess(page: string): boolean {
  const session = getSession()
  if (!session) return false
  if (session.role === 'admin') return true

  const accessMap: Record<StaffRole, string[]> = {
    admin: ['/', '/register', '/scan', '/stats', '/participants', '/cards', '/staff'],
    registration: ['/', '/register', '/participants'],
    meal: ['/', '/scan'],
  }

  return accessMap[session.role]?.includes(page) ?? false
}

// ── Init ────────────────────────────────────────────────────

export function initAuth() {
  if (!localStorage.getItem(STAFF_KEY)) {
    localStorage.setItem(STAFF_KEY, JSON.stringify(DEFAULT_STAFF))
  }
}
