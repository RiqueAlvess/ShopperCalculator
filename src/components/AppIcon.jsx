/* Standalone SVG app icon — speedometer + dollar glyph */
export default function AppIcon({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="48" height="48" rx="12" fill="#161b22" />
      {/* Speedometer arc */}
      <path
        d="M10 30 A14 14 0 1 1 38 30"
        stroke="#39ff14"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Speed ticks */}
      <line x1="24" y1="16" x2="24" y2="13" stroke="#39ff14" strokeWidth="2" strokeLinecap="round" />
      <line x1="14.5" y1="19.5" x2="12.4" y2="17.4" stroke="#39ff14" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="33.5" y1="19.5" x2="35.6" y2="17.4" stroke="#39ff14" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      {/* Needle pointing up-right (hot zone) */}
      <line x1="24" y1="30" x2="33" y2="22" stroke="#39ff14" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="30" r="2.5" fill="#39ff14" />
      {/* Dollar sign */}
      <text
        x="20"
        y="42"
        fill="#39ff14"
        fontSize="10"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        opacity="0.9"
      >$</text>
      <text
        x="26.5"
        y="42"
        fill="white"
        fontSize="10"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
        opacity="0.55"
      >¢</text>
    </svg>
  )
}
