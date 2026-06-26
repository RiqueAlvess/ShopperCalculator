export default function ProgressBar({ value, max, color = 'neon' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const colorMap = {
    neon: 'bg-neon-green',
    red: 'bg-red-500',
    yellow: 'bg-yellow-400',
    blue: 'bg-blue-400',
  }
  const bg = colorMap[color] ?? colorMap.neon

  return (
    <div className="w-full h-2 bg-graphite-600 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${bg}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
