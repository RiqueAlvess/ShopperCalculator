import { useState, useEffect, useCallback } from 'react'
import { getRidesByDate } from '../lib/db'

const pad = (n) => String(n).padStart(2, '0')
const toDateStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS   = ['D','S','T','Q','Q','S','S']

export default function History() {
  const now = new Date()
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selected,  setSelected]  = useState(now.toISOString().slice(0, 10))
  const [rides,     setRides]     = useState([])
  const [loading,   setLoading]   = useState(false)

  const loadRides = useCallback(async (dateStr) => {
    setLoading(true)
    const data = await getRidesByDate(dateStr)
    data.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    setRides(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadRides(selected) }, [selected, loadRides])

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells       = Array.from({ length: firstDay }, () => null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))

  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) } else setViewMonth(m => m-1) }
  const nextMonth = () => { if (viewMonth===11)  { setViewYear(y => y+1); setViewMonth(0)  } else setViewMonth(m => m+1) }

  const accepted    = rides.filter(r => r.decision === 'aceitou')
  const totalEarned = accepted.reduce((a, r) => a + r.offered, 0)
  const totalMiles  = accepted.reduce((a, r) => a + (r.miles||0) + (r.extraMiles||0), 0)

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Calendar */}
      <div className="bg-graphite-800 rounded-2xl p-4 border border-graphite-600">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-graphite-600 transition-colors">
            <ChevronLeft />
          </button>
          <span className="text-white font-semibold text-sm">{MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-graphite-600 transition-colors">
            <ChevronRight />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d, i) => (
            <div key={i} className="text-center text-[10px] text-gray-600 font-bold py-1 uppercase">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const dateStr   = toDateStr(viewYear, viewMonth, day)
            const isSelected = dateStr === selected
            const isToday    = dateStr === new Date().toISOString().slice(0, 10)
            return (
              <button
                key={i}
                onClick={() => setSelected(dateStr)}
                className={`aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all
                  ${isSelected
                    ? 'bg-neon-green text-graphite-900 font-black shadow-[0_0_12px_rgba(57,255,20,0.4)]'
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
        <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest mb-3">{formatDate(selected)}</p>
        <div className="grid grid-cols-2 gap-3">
          <SummaryTile label="Total Faturado"  value={`$${totalEarned.toFixed(2)}`} color="text-neon-green" />
          <SummaryTile label="Total de Milhas" value={`${totalMiles.toFixed(1)} mi`} color="text-blue-400"  />
        </div>
      </div>

      {/* Ride List */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && rides.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          <InboxIcon />
          <p className="text-sm mt-3">Nenhuma corrida registrada neste dia</p>
        </div>
      )}

      {!loading && rides.map((ride) => <RideCard key={ride.id} ride={ride} />)}
    </div>
  )
}

function SummaryTile({ label, value, color }) {
  return (
    <div className="bg-graphite-700 rounded-xl p-3">
      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function RideCard({ ride }) {
  const ok   = ride.decision === 'aceitou'
  const time = new Date(ride.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className={`bg-graphite-800 rounded-2xl p-4 border ${ok ? 'border-neon-green/25' : 'border-red-500/25'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${ok ? 'bg-neon-green/15 text-neon-green' : 'bg-red-500/15 text-red-400'}`}>
              {ok ? 'ACEITA' : 'REJEITADA'}
            </span>
            <span className="text-[11px] text-gray-600">{time}</span>
          </div>
          {ride.store && <p className="text-white font-semibold text-sm mb-1">{ride.store}</p>}
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span>{ride.miles} mi</span>
            <span>·</span>
            <span>{ride.items} itens</span>
            {ride.extraMiles > 0 && <><span>·</span><span>+{ride.extraMiles} mi extra</span></>}
          </div>
        </div>
        <div className="text-right ml-3 flex-shrink-0">
          <p className="text-xl font-bold text-white">${ride.offered?.toFixed(2)}</p>
          <p className={`text-xs font-semibold mt-0.5 ${(ride.profit||0) >= 0 ? 'text-gray-400' : 'text-red-400'}`}>
            {(ride.profit||0) >= 0 ? '+' : '−'}${Math.abs(ride.profit||0).toFixed(2)} após combustível
          </p>
        </div>
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m-1, d).toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })
}

function ChevronLeft()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> }
function ChevronRight() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg> }
function InboxIcon()    { return <svg className="mx-auto" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg> }
