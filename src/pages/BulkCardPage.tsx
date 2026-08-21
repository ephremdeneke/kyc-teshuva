import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { type SheetParticipant } from '../sheetService'
import { useSheetData } from '../useSheetData'
import ConfigBanner from '../components/ConfigBanner'
import { Printer, Download, Loader2, ArrowLeft, RefreshCw } from 'lucide-react'
import '../components/RegistrationCard.css'

function getCardColor(index: number): 'red' | 'yellow' {
  return index % 2 === 0 ? 'red' : 'yellow'
}

function getBgImage(color: 'red' | 'yellow') {
  return color === 'red' ? '/red-bg.jpg' : '/yellow-bg.jpg'
}

function PrintCard({ participant, index }: { participant: SheetParticipant; index: number }) {
  const color = getCardColor(index)
  const bg = getBgImage(color)
  const accentColor = color === 'red' ? '#DC2626' : '#D97706'

  return (
    <div className="card-cut-gutter print-card">
      {/* FRONT */}
      <div className="card-front-wrap">
        <img src={bg} alt="" className="card-bg-img" />
        <div className="card-bg-blur" />
        <div className="card-bg-overlay" />

        <div className="card-front-content">
          <div className="card-top">
            <div className="card-hero-row">
              <div className="card-hero-ring" style={{ borderColor: accentColor }}>
                <img src="/card-hero.jpg" alt="HKC" />
              </div>
              <div className="card-hero-center">
                <div className="card-event-title">TESHUVA 2018</div>
                <div className="card-event-sub">Hossana Kalehiwot Church</div>
                <div className="card-event-year">Registration Card 2026</div>
              </div>
              <div className="card-hero-ring" style={{ borderColor: accentColor }}>
                <img src="/church.jpg" alt="Church" />
              </div>
            </div>
          </div>

          <div className="card-center">
            <div className="card-participant-name">{participant.fullName}</div>
            <div className="card-participant-id">{participant.registrationId}</div>
            <div className="card-participant-role">Participant</div>
          </div>

          <div className="card-qr-wrap">
            <QRCodeSVG value={participant.registrationId} size={68} level="H" />
          </div>
        </div>
      </div>

      {/* BACK */}
      <div className="card-back-wrap">
        <img src={bg} alt="" className="card-bg-img" />
        <div className="card-bg-blur" />
        <div className="card-bg-overlay card-bg-overlay-dark" />

        <div className="card-back-content">
          <div className="card-back-header">
            <div className="card-back-title">MEAL CARD</div>
            <div className="card-back-sub">6-Day Meal Verification</div>
          </div>

          <div className="card-meal-list">
            {[1, 2, 3, 4, 5, 6].map((day) => (
              <div key={day} className="card-meal-item">
                <div className="card-meal-left">
                  <span className="card-meal-day-num">{day}</span>
                  <span className="card-meal-day-label">Day {day}</span>
                </div>
                <div className="card-meal-check" />
              </div>
            ))}
          </div>

          <div className="card-back-footer">
            <span>One meal per day</span>
            <span className="card-back-dot">•</span>
            <span>Non-transferable</span>
          </div>

          <div className="card-back-regid">{participant.registrationId}</div>
        </div>
      </div>
    </div>
  )
}

export default function BulkCardPage() {
  const { data: participants, loading, error, refresh } = useSheetData()
  const [generating, setGenerating] = useState(false)
  const [showCards, setShowCards] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (participants.length > 0 && selected.size === 0) {
      setSelected(new Set(participants.map((p) => p.registrationId)))
    }
  }, [participants])

  const toggleAll = () => {
    if (selected.size === participants.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(participants.map((p) => p.registrationId)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setShowCards(true)
      setGenerating(false)
    }, 300)
  }

  const handlePrint = () => window.print()

  const handleExportHTML = () => {
    if (!printRef.current) return

    const cardCSS = `
      .card-cut-gutter { display: flex; flex-direction: column; align-items: center; gap: 2mm; padding: 4mm 2mm; margin: 4mm 0; border-bottom: 0.3pt dashed #ccc; }
      .print-card { display: inline-block; margin: 2mm; vertical-align: top; }
      .card-front-wrap, .card-back-wrap { position: relative; width: 85.6mm; height: 53.98mm; border-radius: 3mm; overflow: hidden; page-break-inside: avoid; break-inside: avoid; }
      .card-bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
      .card-bg-blur { position: absolute; inset: 0; z-index: 1; backdrop-filter: none; -webkit-backdrop-filter: none; }
      .card-bg-overlay { position: absolute; inset: 0; z-index: 2; background: linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.55) 100%); }
      .card-bg-overlay-dark { background: linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.50) 50%, rgba(0,0,0,0.65) 100%); }
      .card-front-content { position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 3mm 4mm 2mm; color: white; }
      .card-top { display: flex; flex-direction: column; align-items: center; gap: 0.8mm; }
      .card-hero-row { display: flex; align-items: center; gap: 5mm; width: 100%; }
      .card-hero-center { flex: 1; text-align: center; min-width: 0; }
      .card-hero-ring { width: 11mm; height: 11mm; border-radius: 50%; border: 0.7mm solid; padding: 0.5mm; background: rgba(255,255,255,0.1); backdrop-filter: blur(4px); overflow: hidden; flex-shrink: 0; }
      .card-hero-ring img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
      .card-event-text { text-align: center; }
      .card-event-title { font-size: 3pt; font-weight: 800; letter-spacing: 0.6pt; text-transform: uppercase; text-shadow: 0 0.3mm 1mm rgba(0,0,0,0.4); }
      .card-event-sub { font-size: 2.2pt; opacity: 0.75; letter-spacing: 0.1pt; margin-top: 0.2mm; }
      .card-event-year { font-size: 1.8pt; opacity: 0.55; letter-spacing: 0.1pt; margin-top: 0.2mm; }
      .card-center { text-align: center; }
      .card-participant-name { font-size: 5pt; font-weight: 700; letter-spacing: 0.1pt; text-shadow: 0 0.3mm 1mm rgba(0,0,0,0.4); line-height: 1.2; max-width: 65mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .card-participant-id { font-size: 2.8pt; font-weight: 800; font-family: 'Courier New', monospace; letter-spacing: 0.3pt; opacity: 0.85; margin-top: 0.5mm; text-shadow: 0 0.3mm 0.5mm rgba(0,0,0,0.3); }
      .card-participant-role { font-size: 2.5pt; font-weight: 500; opacity: 0.7; letter-spacing: 0.5pt; text-transform: uppercase; margin-top: 0.5mm; }
      .card-qr-wrap { background: rgba(255,255,255,0.95); border-radius: 2mm; padding: 1.5mm; box-shadow: 0 0.5mm 2mm rgba(0,0,0,0.2); }
      .card-qr-wrap svg { width: 17mm; height: 17mm; }
      .card-bottom { text-align: center; }
      .card-regid { font-size: 3pt; font-weight: 600; font-family: 'Courier New', monospace; letter-spacing: 0.3pt; opacity: 0.85; text-shadow: 0 0.3mm 0.5mm rgba(0,0,0,0.3); }
      .card-back-content { position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; padding: 2mm 4mm 1.5mm; color: white; }
      .card-back-header { text-align: center; margin-bottom: 1mm; }
      .card-back-title { font-size: 3pt; font-weight: 800; letter-spacing: 0.7pt; text-transform: uppercase; text-shadow: 0 0.3mm 1mm rgba(0,0,0,0.4); }
      .card-back-sub { font-size: 2pt; opacity: 0.6; margin-top: 0.2mm; letter-spacing: 0.2pt; }
      .card-meal-list { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 0.7mm; }
      .card-meal-item { display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.1); border-radius: 1.2mm; padding: 0.8mm 2.5mm; border: 0.3mm solid rgba(255,255,255,0.08); }
      .card-meal-left { display: flex; align-items: center; gap: 2mm; }
      .card-meal-day-num { width: 4.5mm; height: 4.5mm; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 2.5pt; font-weight: 700; }
      .card-meal-day-label { font-size: 2.8pt; font-weight: 600; letter-spacing: 0.1pt; }
      .card-meal-check { width: 3.5mm; height: 3.5mm; border: 0.3mm solid rgba(255,255,255,0.5); border-radius: 0.6mm; background: rgba(255,255,255,0.05); }
      .card-back-footer { text-align: center; font-size: 1.8pt; opacity: 0.5; margin-top: 0.8mm; display: flex; justify-content: center; gap: 1mm; }
      .card-back-dot { opacity: 0.3; }
      .card-back-regid { text-align: center; font-size: 1.8pt; font-family: 'Courier New', monospace; opacity: 0.35; margin-top: 0.3mm; letter-spacing: 0.2pt; }
      @media print { .card-front-wrap, .card-back-wrap { box-shadow: none; border: 0.3pt solid #ccc; } }
    `

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>HKC Registration Cards</title>
<style>
  @page { size: A4 portrait; margin: 8mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: white; }
  ${cardCSS}
</style>
</head><body>
${printRef.current.innerHTML}
</body></html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hkcc-registration-cards.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedParticipants = participants.filter((p) => selected.has(p.registrationId))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
          <div className="text-sm text-gray-500">Loading participants...</div>
        </div>
      </div>
    )
  }

  if (error === 'APP_CONFIG_MISSING') {
    return (
      <div className="space-y-4 pt-4">
        <h1 className="text-lg font-bold">Bulk Card Generator</h1>
        <ConfigBanner />
      </div>
    )
  }

  if (showCards) {
    return (
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between no-print">
          <button onClick={() => setShowCards(false)} className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="btn-primary !py-2 !px-4 flex items-center gap-1 text-sm">
              <Printer size={16} /> Print
            </button>
            <button onClick={handleExportHTML} className="btn-secondary !py-2 !px-4 flex items-center gap-1 text-sm">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 no-print">
          {selectedParticipants.length} cards ready to print
        </div>

        {/* Printable cards */}
        <div ref={printRef} className="print-area">
          {selectedParticipants.map((p, idx) => (
            <PrintCard key={p.registrationId} participant={p} index={idx} />
          ))}
        </div>

        <div className="flex gap-3 no-print pb-6">
          <button onClick={handlePrint} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Printer size={18} /> Print All Cards
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4">
      <h1 className="text-lg font-bold">Bulk Card Generator</h1>

      <div className="card p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-bold text-gray-900">{participants.length}</div>
            <div className="text-[11px] text-gray-500">Total</div>
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-600">{selected.size}</div>
            <div className="text-[11px] text-gray-500">Selected</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600">{Math.ceil(selected.size * 2 / 10)}</div>
            <div className="text-[11px] text-gray-500">Pages</div>
          </div>
        </div>
      </div>

      {/* Select All */}
      <div className="card p-3 flex items-center justify-between">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.size === participants.length && participants.length > 0}
            onChange={toggleAll}
            className="w-5 h-5 rounded border-gray-300 text-emerald-600"
          />
          <span className="text-sm font-medium text-gray-700">Select All</span>
        </label>
        <span className="text-xs text-gray-400">{selected.size} selected</span>
      </div>

      {/* List */}
      <div className="card divide-y divide-gray-100 max-h-[40vh] overflow-y-auto">
        {participants.map((p, idx) => (
          <label
            key={`${p.registrationId}-${idx}`}
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={selected.has(p.registrationId)}
              onChange={() => toggleOne(p.registrationId)}
              className="w-5 h-5 rounded border-gray-300 text-emerald-600"
            />
            <div
              className="w-8 h-8 rounded-lg bg-cover bg-center border border-gray-200 shrink-0"
              style={{ backgroundImage: `url(${getBgImage(getCardColor(idx))})` }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{p.fullName}</div>
              <div className="text-[11px] text-gray-500 font-mono">{p.registrationId}</div>
            </div>
            <div className="text-xs text-gray-400 shrink-0">{p.church}</div>
          </label>
        ))}
      </div>

      {/* Generate */}
      <button
        onClick={handleGenerate}
        disabled={selected.size === 0 || generating}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {generating ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
        ) : (
          <>Generate {selected.size} Cards</>
        )}
      </button>
    </div>
  )
}
