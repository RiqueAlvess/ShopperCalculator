import { useState, useEffect } from 'react'
import { getRidesInRange } from '../lib/db'
import ProgressBar from './ProgressBar'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function weekStart() {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return d.toISOString().slice(0, 10)
}

function monthStart() {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

export default function Dashboard({ settings }) {
  const [todayRides, setTodayRides] = useState([])
  const [weekRides, setWeekRides] = useState([])
  const [monthRides, setMonthRides] = useState([])
  const [loading, setLoading] = useState(true)

  const today = todayStr()

  useEffect(() => {
    const load = async () => {
      const [t, w, m] = await Promise.all([
        getRidesInRange(today, today),
        getRidesInRange(weekStart(), today),
        getRidesInRange(monthStart(), today),
      ])
      setTodayRides(t)
      setWeekRides(w)
      setMonthRides(m)
      setLoading(false)
    }
    load()
  }, [today])

  const accepted = (rides) => rides.filter((r) => r.decision === 'aceitou')
  const sum = (rides) => accepted(rides).reduce((a, r) => a + r.offered, 0)
  const totalMiles = (rides) => accepted(rides).reduce((a, r) => a + (r.miles || 0) + (r.extraMiles || 0), 0)
  const totalProfit = (rides) => accepted(rides).reduce((a, r) => a + (r.profit || 0), 0)

  const todayEarned = sum(todayRides)
  const weekEarned = sum(weekRides)
  const monthEarned = sum(monthRides)
  const todayMiles = totalMiles(todayRides)
  const profitPerMile = todayMiles > 0 ? totalProfit(todayRides) / todayMiles : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center gap-2">
        <span className="text-2xl">📊</span>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
      </div>

      {/* Daily Goal – hero card */}
      <div className="bg-gradient-to-br from-graphite-700 to-graphite-800 rounded-2xl p-5 border border-neon-green/30">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Meta Diária</p>
            <p className="text-4xl font-black text-neon-green mt-1">${todayEarned.toFixed(2)}</p>
            <p className="text-sm text-gray-400">de ${settings.dailyGoal?.toFixed(2) ?? '0.00'}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {settings.dailyGoal > 0 ? Math.min(100, Math.round((todayEarned / settings.dailyGoal) * 100)) : 0}%
            </div>
            <div className="text-xs text-gray-400">{accepted(todayRides).length} corrida{accepted(todayRides).length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <ProgressBar value={todayEarned} max={settings.dailyGoal ?? 1} color="neon" />
        {todayEarned >= (settings.dailyGoal ?? 0) && settings.dailyGoal > 0 && (
          <p className="text-neon-green text-xs font-semibold mt-2">🎉 Meta atingida!</p>
        )}
      </div>

      {/* Weekly + Monthly */}
      <div className="grid grid-cols-2 gap-3">
        <GoalCard
          label="Meta Semanal"
          earned={weekEarned}
          goal={settings.weeklyGoal ?? 0}
          icon="📅"
          color="blue"
        />
        <GoalCard
          label="Meta Mensal"
          earned={monthEarned}
          goal={settings.monthlyGoal ?? 0}
          icon="🗓️"
          color="yellow"
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Milhas Hoje" value={`${todayMiles.toFixed(1)} mi`} icon="🛣️" />
        <KpiCard label="Lucro/Milha" value={`$${profitPerMile.toFixed(2)}`} icon="⚡" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Corridas Aceitas" value={accepted(todayRides).length} icon="✅" />
        <KpiCard label="Corridas Rejeitadas" value={todayRides.filter((r) => r.decision === 'rejeitou').length} icon="❌" />
      </div>
    </div>
  )
}

function GoalCard({ label, earned, goal, icon, color }) {
  const pct = goal > 0 ? Math.min(100, Math.round((earned / goal) * 100)) : 0
  const colorMap = { blue: 'text-blue-400', yellow: 'text-yellow-400' }

  return (
    <div className="bg-graphite-800 rounded-2xl p-4 border border-graphite-600 space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-base">{icon}</span>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>${earned.toFixed(2)}</p>
      <p className="text-xs text-gray-500">de ${goal.toFixed(2)}</p>
      <ProgressBar value={earned} max={goal || 1} color={color} />
      <p className="text-xs font-semibold text-gray-300">{pct}% concluído</p>
    </div>
  )
}

function KpiCard({ label, value, icon }) {
  return (
    <div className="bg-graphite-800 rounded-2xl p-4 border border-graphite-600 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
  )
}
