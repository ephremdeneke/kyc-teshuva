import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStaffList, addStaff, updateStaff, removeStaff, getSession, type StaffMember, type StaffRole } from '../auth'
import { Plus, Trash2, Edit3, X, Users } from 'lucide-react'

const ROLE_OPTIONS: { value: StaffRole; label: string; color: string }[] = [
  { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-700' },
  { value: 'registration', label: 'Registration', color: 'bg-blue-100 text-blue-700' },
  { value: 'meal', label: 'Meal Staff', color: 'bg-amber-100 text-amber-700' },
]

export default function StaffPage() {
  const navigate = useNavigate()
  const session = getSession()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', pin: '', role: 'meal' as StaffRole })

  useEffect(() => {
    if (!session || session.role !== 'admin') {
      navigate('/', { replace: true })
      return
    }
    setStaff(getStaffList())
  }, [])

  const reload = () => setStaff(getStaffList())

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.pin) return

    if (editing) {
      updateStaff(editing.id, form)
    } else {
      addStaff({ ...form, active: true })
    }
    setShowForm(false)
    setEditing(null)
    setForm({ name: '', phone: '', pin: '', role: 'meal' })
    reload()
  }

  const handleEdit = (s: StaffMember) => {
    setEditing(s)
    setForm({ name: s.name, phone: s.phone, pin: s.pin, role: s.role })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Remove this staff member?')) {
      removeStaff(id)
      reload()
    }
  }

  const toggleActive = (s: StaffMember) => {
    updateStaff(s.id, { active: !s.active })
    reload()
  }

  if (!session || session.role !== 'admin') return null

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Staff Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">{staff.length} staff members</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', phone: '', pin: '', role: 'meal' }); setShowForm(true) }}
          className="btn-primary !py-2 !px-3 flex items-center gap-1 text-sm"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Staff List */}
      <div className="card divide-y divide-gray-100">
        {staff.map((s) => {
          const roleInfo = ROLE_OPTIONS.find((r) => r.value === s.role)
          return (
            <div key={s.id} className="flex items-center gap-3 p-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${roleInfo?.color || 'bg-gray-100'}`}>
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{s.name}</span>
                  {!s.active && <span className="text-[10px] text-red-500 font-medium">inactive</span>}
                </div>
                <div className="text-[11px] text-gray-500">
                  {s.phone} • PIN: {s.pin} • <span className={`font-medium ${roleInfo?.color}`}>{roleInfo?.label}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(s)} className="text-[10px] text-gray-400 hover:text-amber-600 px-2 py-1">
                  {s.active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => handleEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="card p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">
                {editing ? 'Edit Staff' : 'Add Staff'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="label">Name</label>
                <input type="text" required className="input-field" placeholder="Full name"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone</label>
                  <input type="tel" required className="input-field" placeholder="09XX"
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
                </div>
                <div>
                  <label className="label">PIN</label>
                  <input type="password" required maxLength={6} className="input-field text-center font-mono" placeholder="••••"
                    value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })} />
                </div>
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input-field" value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary w-full">
                {editing ? 'Save Changes' : 'Add Staff'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
