import { QRCodeSVG } from 'qrcode.react'
import type { Participant } from '../types'
import './RegistrationCard.css'

interface Props {
  participant: Participant
  variant?: 'red' | 'yellow'
}

export default function RegistrationCard({ participant, variant }: Props) {
  const color = variant || (Math.random() > 0.5 ? 'red' : 'yellow')
  const bgImage = color === 'red' ? '/red-bg.jpg' : '/yellow-bg.jpg'
  const accentColor = color === 'red' ? '#DC2626' : '#D97706'

  return (
    <div className="card-cut-gutter print-area">
      {/* ==================== FRONT ==================== */}
      <div className="card-front-wrap">
        <img src={bgImage} alt="" className="card-bg-img" />
        <div className="card-bg-blur" />
        <div className="card-bg-overlay" />

        <div className="card-front-content">
          {/* Top: Hero images + Event */}
          <div className="card-top">
            <div className="card-hero-row">
              <div className="card-hero-ring" style={{ borderColor: accentColor }}>
                <img src="/card-hero.jpg" alt="HKC" />
              </div>
              <div className="card-hero-ring" style={{ borderColor: accentColor }}>
                <img src="/church.jpg" alt="Church" />
              </div>
            </div>
            <div className="card-event-text">
              <div className="card-event-title"> Teshuva 2026 </div>
              <div className="card-event-sub">Hossana Kalehiwot Church</div>
            </div>
          </div>

          {/* Center: Name + ID + Category */}
          <div className="card-center">
            <div className="card-participant-name">{participant.fullName}</div>
            <div className="card-participant-id">{participant.registrationId}</div>
            <div className="card-participant-role">{participant.category || 'Participant'}</div>
          </div>

          {/* QR Code */}
          <div className="card-qr-wrap">
            <QRCodeSVG value={participant.registrationId} size={68} level="H" />
          </div>
        </div>
      </div>

      {/* ==================== BACK ==================== */}
      <div className="card-back-wrap">
        <img src={bgImage} alt="" className="card-bg-img" />
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
