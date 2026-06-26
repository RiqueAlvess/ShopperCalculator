import { useState, useEffect } from 'react'
import { getRidesInRange } from '../lib/db'
import ProgressBar from './ProgressBar'

function todayStr()  { return new Date().toISOString().slice(0, 10) }
function weekStart() { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10) }
function monthStart(){ const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }

export default function Dashboard({ settings }) {
  const [todayRides,  setTodayRides]  = useState([])
  const [weekRides,   setWeekRides]   = useState([])
  const [monthRides,  setMonthRides]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const today = todayStr()

  useEffect(() => {
    Promise.all([
      getRidesInRange(today, today),
      getRidesInRange(weekStart(), today),
      getRidesInRange(monthStart(), today),
    ]).then(([t, w, m]) => {
      setTodayRides(t); setWeekRides(w); setMonthRides(m); setLoading(false)
    })
  }, [today])

  const accepted = (r) => r.filter((x) => x.decision === 'aceitou')
  const earn     = (r) => accepted(r).reduce((a, x) => a + x.offered, 0)
  const miles    = (r) => accepted(r).reduce((a, x) => a + (x.miles || 0) + (x.extraMiles || 0), 0)
  const profit   = (r) => accepted(r).reduce((a, x) => a + (x.profit || 0), 0)

  const todayEarned  = earn(todayRides)
  const weekEarned   = earn(weekRides)
  const monthEarned  = earn(monthRides)
  const todayMi      = miles(todayRides)
  const profitPerMile= todayMi > 0 ? profit(todayRides) / todayMi : 0
  const dailyGoal    = settings.dailyGoal  ?? 0
  const weekGoal     = settings.weeklyGoal ?? 0
  const monthGoal    = settings.monthlyGoal ?? 0
  const dailyPct     = dailyGoal > 0 ? Math.min(100, Math.round((todayEarned / dailyGoal) * 100)) : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Hero — Daily Goal */}
      <div className="bg-gradient-to-br from-graphite-700 to-graphite-800 rounded-2xl p-5 border border-neon-green/25 shadow-[0_0_40px_rgba(57,255,20,0.06)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest mb-1">Meta de Hoje</p>
            <p className="text-5xl font-black text-neon-green leading-none">${todayEarned.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">de <span className="text-gray-300">${dailyGoal.toFixed(2)}</span></p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-black ${dailyPct >= 100 ? 'text-neon-green' : 'text-white'}`}>{dailyPct}%</div>
            <div className="text-xs text-gray-500 mt-0.5">{accepted(todayRides).length} corrida{accepted(todayRides).length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <ProgressBar value={todayEarned} max={dailyGoal || 1} color="neon" />
        {dailyPct >= 100 && (
          <p className="text-neon-green text-xs font-bold mt-2 flex items-center gap-1">
            <StarIcon /> Meta diária atingida!
          </p>
        )}
      </div>

      {/* Weekly + Monthly */}
      <div className="grid grid-cols-2 gap-3">
        <GoalCard label="Semanal"  earned={weekEarned}  goal={weekGoal}  icon={<CalWeekIcon />}  color="blue"   />
        <GoalCard label="Mensal"   earned={monthEarned} goal={monthGoal} icon={<CalMonthIcon />} color="yellow" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Milhas Hoje"    value={`${todayMi.toFixed(1)} mi`}       icon={<RoadIcon />}   />
        <KpiCard label="Lucro / Milha"  value={`$${profitPerMile.toFixed(2)}`}   icon={<FlashIcon />}  />
        <KpiCard label="Aceitas"        value={accepted(todayRides).length}       icon={<CheckIcon />}  />
        <KpiCard label="Rejeitadas"     value={todayRides.filter(r=>r.decision==='rejeitou').length} icon={<XCircleIcon />} />
      </div>
    </div>
  )
}

function GoalCard({ label, earned, goal, icon, color }) {
  const pct = goal > 0 ? Math.min(100, Math.round((earned / goal) * 100)) : 0
  const valClass = { blue: 'text-blue-400', yellow: 'text-yellow-400' }
  return (
    <div className="bg-graphite-800 rounded-2xl p-4 border border-graphite-600 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className={`${color === 'blue' ? 'text-blue-400' : 'text-yellow-400'}`}>{icon}</span>
        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${valClass[color]}`}>${earned.toFixed(2)}</p>
      <p className="text-xs text-gray-600">de ${goal.toFixed(2)}</p>
      <ProgressBar value={earned} max={goal || 1} color={color} />
      <p className="text-xs font-semibold text-gray-400">{pct}%</p>
    </div>
  )
}

function KpiCard({ label, value, icon }) {
  return (
    <div className="bg-graphite-800 rounded-2xl p-4 border border-graphite-600 flex items-center gap-3">
      <div className="text-gray-400 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

/* ── tiny inline icons ── */
function StarIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}
function CalWeekIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}
function CalMonthIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/></svg>
}
function RoadIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l3-10 6 2 6-2 3 10"/><line x1="12" y1="9" x2="12" y2="17"/></svg>
}
function FlashIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
}
function CheckIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function XCircleIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
}
