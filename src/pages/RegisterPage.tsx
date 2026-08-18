import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RegistrationCard from '../components/RegistrationCard'
import { fetchSheetData } from '../sheetService'
import type { Participant } from '../types'

const defaultForm = {
  fullName: '',
  phone: '',
  address: '',
  church: '',
  serviceDistrict: '',
  category: 'Participant',
  paymentAmount: 400,
  paymentMethod: 'Transfer',
  notes: '',
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(defaultForm)
  const [saved, setSaved] = useState<Participant | null>(null)
  const [showCard, setShowCard] = useState(false)
  const [sheetCount, setSheetCount] = useState(0)

  useEffect(() => {
    fetchSheetData().then((data) => setSheetCount(data.length))
  }, [])

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const year = new Date().getFullYear()
    const seqNum = sheetCount + 1 + Math.floor(Math.random() * 100)
    const registrationId = `HKC/${year}/${String(seqNum).padStart(5, '0')}`
    const qrToken = generateToken()

    const participant: Participant = {
      id: crypto.randomUUID(),
      registrationId,
      fullName: form.fullName,
      phone: form.phone,
      address: form.address,
      church: form.church,
      serviceDistrict: form.serviceDistrict,
      category: form.category,
      paymentAmount: form.paymentAmount,
      paymentMethod: form.paymentMethod,
      registrationDate: new Date().toISOString(),
      qrToken,
      notes: form.notes,
    }

    setSaved(participant)
    setShowCard(true)

    const existing = JSON.parse(localStorage.getItem('participants') || '[]')
    existing.push(participant)
    localStorage.setItem('participants', JSON.stringify(existing))
  }

  const handlePrint = () => window.print()

  const handleNewRegistration = () => {
    setForm(defaultForm)
    setSaved(null)
    setShowCard(false)
  }

  /* ==================== CARD RESULT VIEW ==================== */
  if (showCard && saved) {
    return (
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between no-print">
          <h1 className="text-lg font-bold text-gray-900">Registration Card</h1>
          <button onClick={handleNewRegistration} className="text-sm text-emerald-600 font-semibold">
            + New
          </button>
        </div>

        <div className="flex justify-center py-4">
          <RegistrationCard participant={saved} />
        </div>

        <div className="flex gap-3 no-print">
          <button onClick={handlePrint} className="btn-primary flex-1">
            Print Card
          </button>
          <button onClick={() => navigate('/scan')} className="btn-secondary flex-1">
            Test Scan
          </button>
        </div>

        <div className="card p-4 no-print">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Registration Details</h3>
          <div className="space-y-1.5 text-xs">
            <Row label="Name" value={saved.fullName} />
            <Row label="Reg ID" value={saved.registrationId} />
            <Row label="Phone" value={saved.phone || '—'} />
            <Row label="Church" value={saved.church || '—'} />
            <Row label="Category" value={saved.category} />
            <Row label="Payment" value={`${saved.paymentAmount} ETB (${saved.paymentMethod})`} />
          </div>
        </div>
      </div>
    )
  }

  /* ==================== REGISTRATION FORM ==================== */
  return (
    <div className="space-y-5 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">New Registration</h1>
          <p className="text-xs text-gray-500 mt-0.5">{sheetCount} existing participants</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Personal Info Section */}
        <div className="card p-4 mb-4">
          <SectionTitle icon="👤" title="Personal Information" />
          <div className="space-y-3">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="Enter full name"
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="09XX XXX XXX"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input-field" value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}>
                  <option>Participant</option>
                  <option>Speaker</option>
                  <option>VIP</option>
                  <option>Staff</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Church Info Section */}
        <div className="card p-4 mb-4">
          <SectionTitle icon="⛪" title="Church & Location" />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Church</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. HKC"
                  value={form.church}
                  onChange={(e) => updateField('church', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Service District</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="District"
                  value={form.serviceDistrict}
                  onChange={(e) => updateField('serviceDistrict', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Address</label>
              <input
                type="text"
                className="input-field"
                placeholder="City / Town"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="card p-4 mb-4">
          <SectionTitle icon="💳" title="Payment" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount</label>
              <select className="input-field" value={form.paymentAmount}
                onChange={(e) => updateField('paymentAmount', Number(e.target.value))}>
                <option value={400}>400 ETB</option>
                <option value={800}>800 ETB</option>
                <option value={1200}>1200 ETB</option>
                <option value={0}>Free</option>
              </select>
            </div>
            <div>
              <label className="label">Method</label>
              <select className="input-field" value={form.paymentMethod}
                onChange={(e) => updateField('paymentMethod', e.target.value)}>
                <option>Transfer</option>
                <option>Cash</option>
                <option>Free</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-4 mb-4">
          <SectionTitle icon="📝" title="Additional Notes" />
          <textarea
            className="input-field"
            rows={2}
            placeholder="Any notes (optional)"
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
          />
        </div>

        {/* Submit */}
        <button type="submit" className="btn-primary w-full text-base py-4">
          Register & Generate Card
        </button>
      </form>
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
      <span className="text-base">{icon}</span>
      <h2 className="text-sm font-bold text-gray-800">{title}</h2>
    </div>
  )
}

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let token = ''
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  )
}
