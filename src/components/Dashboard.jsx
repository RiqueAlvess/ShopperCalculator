import { useState, useEffect } from 'react'
import { getRidesInRange } from '../lib/db'
import ProgressBar from './ProgressBar'

const todayStr  = () => new Date().toISOString().slice(0, 10)
const weekStart = () => { const d = new Date(); d.setDate(d.getDate()-6); return d.toISOString().slice(0,10) }
const monthStart= () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10) }

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
    ]).then(([t,w,m]) => { setTodayRides(t); setWeekRides(w); setMonthRides(m); setLoading(false) })
  }, [today])

  const ok    = (r) => r.filter(x => x.decision === 'aceitou')
  const earn  = (r) => ok(r).reduce((a,x) => a + x.offered, 0)
  const mi    = (r) => ok(r).reduce((a,x) => a + (x.miles||0) + (x.extraMiles||0), 0)
  const prof  = (r) => ok(r).reduce((a,x) => a + (x.profit||0), 0)

  const todayEarned  = earn(todayRides)
  const weekEarned   = earn(weekRides)
  const monthEarned  = earn(monthRides)
  const todayMi      = mi(todayRides)
  const ppm          = todayMi > 0 ? prof(todayRides) / todayMi : 0
  const dGoal        = settings.dailyGoal   || 0
  const wGoal        = settings.weeklyGoal  || 0
  const mGoal        = settings.monthlyGoal || 0
  const dPct         = dGoal > 0 ? Math.min(100, Math.round(todayEarned/dGoal*100)) : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="px-5 py-4 space-y-4 pb-6">
      {/* Hero */}
      <div className="bg-uber-surface rounded-2xl p-5 border border-uber-border">
        <p className="text-[11px] text-uber-muted font-semibold uppercase tracking-[0.15em] mb-1">Meta de Hoje</p>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[42px] font-black text-white leading-none tracking-tight">${todayEarned.toFixed(2)}</p>
            <p className="text-uber-muted text-sm mt-1">de <span className="text-uber-sub">${dGoal.toFixed(2)}</span></p>
          </div>
          <div className="text-right pb-1">
            <p className={`text-3xl font-black ${dPct >= 100 ? 'text-uber-green' : 'text-white'}`}>{dPct}%</p>
            <p className="text-uber-muted text-xs">{ok(todayRides).length} corrida{ok(todayRides).length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <ProgressBar value={todayEarned} max={dGoal||1} color="green" />
        {dPct >= 100 && <p className="text-uber-green text-xs font-bold mt-2">Meta atingida ✓</p>}
      </div>

      {/* Week + Month */}
      <div className="grid grid-cols-2 gap-3">
        <GoalCard label="Semanal"  earned={weekEarned}  goal={wGoal} color="blue"   />
        <GoalCard label="Mensal"   earned={monthEarned} goal={mGoal} color="yellow" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Milhas hoje"     value={`${todayMi.toFixed(1)} mi`}    />
        <Kpi label="Lucro / milha"   value={`$${ppm.toFixed(2)}`}          />
        <Kpi label="Aceitas"         value={ok(todayRides).length}          green />
        <Kpi label="Rejeitadas"      value={todayRides.filter(r=>r.decision==='rejeitou').length} red />
      </div>
    </div>
  )
}

function GoalCard({ label, earned, goal, color }) {
  const pct = goal > 0 ? Math.min(100, Math.round(earned/goal*100)) : 0
  const valColor = color === 'blue' ? 'text-blue-400' : 'text-yellow-400'
  return (
    <div className="bg-uber-surface rounded-2xl p-4 border border-uber-border space-y-2.5">
      <p className="text-[11px] text-uber-muted font-semibold uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${valColor}`}>${earned.toFixed(2)}</p>
      <p className="text-[11px] text-uber-muted">de ${goal.toFixed(2)}</p>
      <ProgressBar value={earned} max={goal||1} color={color} />
      <p className="text-xs text-uber-sub font-semibold">{pct}%</p>
    </div>
  )
}

function Kpi({ label, value, green, red }) {
  const valColor = green ? 'text-uber-green' : red ? 'text-uber-red' : 'text-white'
  return (
    <div className="bg-uber-surface rounded-2xl p-4 border border-uber-border">
      <p className="text-[11px] text-uber-muted font-semibold uppercase tracking-wider mb-1.5">{label}</p>
      <p className={`text-2xl font-bold ${valColor}`}>{value}</p>
    </div>
  )
}
