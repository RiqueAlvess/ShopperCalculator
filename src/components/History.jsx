import { useState, useEffect, useCallback } from 'react'
import { getRidesByDate } from '../lib/db'

function pad(n) { return String(n).padStart(2, '0') }

function toDateStr(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

export default function History() {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(now.toISOString().slice(0, 10))
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(false)

  const loadRides = useCallback(async (dateStr) => {
    setLoading(true)
    const data = await getRidesByDate(dateStr)
    data.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    setRides(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadRides(selected) }, [selected, loadRides])

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const DAYS = ['D','S','T','Q','Q','S','S']

  const accepted = rides.filter(r => r.decision === 'aceitou')
  const totalEarned = accepted.reduce((a, r) => a + r.offered, 0)
  const totalMiles = accepted.reduce((a, r) => a + (r.miles || 0) + (r.extraMiles || 0), 0)

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center gap-2">
        <span className="text-2xl">📅</span>
        <h1 className="text-xl font-bold text-white">Calendário & Histórico</h1>
      </div>

      {/* Calendar */}
      <div className="bg-graphite-800 rounded-2xl p-4 border border-graphite-600">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 text-gray-400 hover:text-white">
            <ChevronLeft />
          </button>
          <span className="text-white font-semibold">{MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-white">
            <ChevronRight />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((d, i) => (
            <div key={i} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const dateStr = toDateStr(viewYear, viewMonth, day)
            const isSelected = dateStr === selected
            const isToday = dateStr === new Date().toISOString().slice(0, 10)

            return (
              <button
                key={i}
                onClick={() => setSelected(dateStr)}
                className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                  ${isSelected
                    ? 'bg-neon-green text-graphite-900 font-bold'
                    : isToday
                    ? 'border border-neon-green/50 text-neon-green'
                    : 'text-gray-300 hover:bg-graphite-600'
                  }`}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day Summary */}
      <div className="bg-graphite-800 rounded-2xl p-4 border border-graphite-600">
        <h2 className="text-sm text-gray-400 font-medium mb-3">
          {formatDate(selected)}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-graphite-700 rounded-xl p-3">
            <p className="text-xs text-gray-400">Total Faturado</p>
            <p className="text-xl font-bold text-neon-green">${totalEarned.toFixed(2)}</p>
          </div>
          <div className="bg-graphite-700 rounded-xl p-3">
            <p className="text-xs text-gray-400">Total de Milhas</p>
            <p className="text-xl font-bold text-blue-400">{totalMiles.toFixed(1)} mi</p>
          </div>
        </div>
      </div>

      {/* Ride List */}
      <div className="space-y-2">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && rides.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p className="text-3xl mb-2">🏁</p>
            <p className="text-sm">Nenhuma corrida registrada neste dia.</p>
          </div>
        )}

        {!loading && rides.map((ride) => (
          <RideCard key={ride.id} ride={ride} />
        ))}
      </div>
    </div>
  )
}

function RideCard({ ride }) {
  const isAccepted = ride.decision === 'aceitou'
  const time = new Date(ride.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`bg-graphite-800 rounded-2xl p-4 border ${isAccepted ? 'border-neon-green/30' : 'border-red-500/30'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isAccepted ? 'bg-neon-green/20 text-neon-green' : 'bg-red-500/20 text-red-400'}`}>
              {isAccepted ? '✅ Aceita' : '❌ Rejeitada'}
            </span>
            <span className="text-xs text-gray-500">{time}</span>
          </div>
          {ride.store && <p className="text-white font-medium text-sm mb-1">{ride.store}</p>}
          <div className="flex gap-3 text-xs text-gray-400">
            <span>{ride.miles} mi</span>
            <span>{ride.items} itens</span>
            {ride.extraMiles > 0 && <span>+{ride.extraMiles} mi extra</span>}
          </div>
        </div>
        <div className="text-right ml-3">
          <p className="text-lg font-bold text-white">${ride.offered?.toFixed(2)}</p>
          <p className={`text-xs font-semibold ${ride.profit >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
            {ride.profit >= 0 ? '+' : ''}${ride.profit?.toFixed(2)} lucro
          </p>
        </div>
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
