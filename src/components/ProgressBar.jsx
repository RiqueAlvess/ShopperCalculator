export default function ProgressBar({ value, max, color = 'green' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const colors = {
    green:  '#06C167',
    blue:   '#3B82F6',
    yellow: '#F59E0B',
    red:    '#E8413E',
  }
  const fill = colors[color] ?? colors.green

  return (
    <div className="w-full h-1 bg-uber-border rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: fill }}
      />
    </div>
  )
}
