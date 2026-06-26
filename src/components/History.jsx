import { useState, useEffect, useCallback } from 'react'
import { getRidesByDate } from '../lib/db'

const pad = (n) => String(n).padStart(2,'0')
const toStr = (y,m,d) => `${y}-${pad(m+1)}-${pad(d)}`
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS   = ['D','S','T','Q','Q','S','S']

export default function History() {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [sel,   setSel]   = useState(now.toISOString().slice(0,10))
  const [rides, setRides] = useState([])
  const [loading,setLoading] = useState(false)

  const load = useCallback(async (d) => {
    setLoading(true)
    const data = await getRidesByDate(d)
    data.sort((a,b) => b.timestamp.localeCompare(a.timestamp))
    setRides(data)
    setLoading(false)
  }, [])

  useEffect(() => { load(sel) }, [sel, load])

  const prev = () => { if (month===0){setYear(y=>y-1);setMonth(11)} else setMonth(m=>m-1) }
  const next = () => { if (month===11){setYear(y=>y+1);setMonth(0)}  else setMonth(m=>m+1) }

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const cells       = Array.from({length:firstDay},()=>null).concat(Array.from({length:daysInMonth},(_,i)=>i+1))

  const accepted   = rides.filter(r=>r.decision==='aceitou')
  const earned     = accepted.reduce((a,r)=>a+r.offered,0)
  const totalMiles = accepted.reduce((a,r)=>a+(r.miles||0)+(r.extraMiles||0),0)

  return (
    <div className="px-5 py-4 space-y-4 pb-6">
      {/* Calendar */}
      <div className="bg-uber-surface rounded-2xl border border-uber-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-uber-border">
          <button onClick={prev} className="p-1.5 text-uber-muted hover:text-white transition-colors"><Chev left /></button>
          <span className="text-white font-semibold text-sm">{MONTHS[month]} {year}</span>
          <button onClick={next} className="p-1.5 text-uber-muted hover:text-white transition-colors"><Chev /></button>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d,i) => <div key={i} className="text-center text-[10px] text-uber-muted font-bold py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day,i) => {
              if (!day) return <div key={i}/>
              const ds = toStr(year,month,day)
              const isSel   = ds === sel
              const isToday = ds === new Date().toISOString().slice(0,10)
              return (
                <button
                  key={i}
                  onClick={() => setSel(ds)}
                  className={`aspect-square flex items-center justify-center rounded-lg text-[13px] font-semibold transition-all
                    ${isSel   ? 'bg-white text-black font-black'
                    : isToday ? 'border border-uber-sub text-white'
                    : 'text-uber-sub hover:bg-uber-card'}`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Day summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-uber-surface rounded-2xl p-4 border border-uber-border">
          <p className="text-[11px] text-uber-muted font-semibold uppercase tracking-wider mb-1">Faturado</p>
          <p className="text-2xl font-bold text-uber-green">${earned.toFixed(2)}</p>
        </div>
        <div className="bg-uber-surface rounded-2xl p-4 border border-uber-border">
          <p className="text-[11px] text-uber-muted font-semibold uppercase tracking-wider mb-1">Milhas</p>
          <p className="text-2xl font-bold text-blue-400">{totalMiles.toFixed(1)} mi</p>
        </div>
      </div>

      {/* Ride list */}
      {loading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"/></div>}

      {!loading && rides.length === 0 && (
        <div className="text-center py-12">
          <p className="text-uber-muted text-sm">Nenhuma corrida neste dia</p>
        </div>
      )}

      {!loading && rides.map(r => <RideCard key={r.id} ride={r} />)}
    </div>
  )
}

function RideCard({ ride }) {
  const ok      = ride.decision === 'aceitou'
  const boosted = ride.boosted === true
  const time    = new Date(ride.timestamp).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  return (
    <div className={`bg-uber-surface rounded-2xl p-4 border ${boosted ? 'border-amber-700/50' : 'border-uber-border'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${ok ? 'bg-uber-green/15 text-uber-green' : 'bg-uber-red/15 text-uber-red'}`}>
              {ok ? 'ACEITA' : 'REJEITADA'}
            </span>
            {boosted && (
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-900/40 text-amber-400 flex items-center gap-1">
                🔥 Impulsionado
              </span>
            )}
            <span className="text-[11px] text-uber-muted">{time}</span>
          </div>
          {ride.store && <p className="text-white font-semibold text-sm mb-1">{ride.store}</p>}
          <p className="text-uber-muted text-xs">{ride.miles} mi · {ride.items} itens{ride.extraMiles>0?` · +${ride.extraMiles} mi`:''}</p>
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          <p className="text-xl font-bold text-white">${ride.offered?.toFixed(2)}</p>
          <p className={`text-xs font-semibold mt-0.5 ${(ride.profit||0)>=0?'text-uber-muted':'text-uber-red'}`}>
            {(ride.profit||0)>=0?'+':'−'}${Math.abs(ride.profit||0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}

function Chev({ left }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {left ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
    </svg>
  )
}
