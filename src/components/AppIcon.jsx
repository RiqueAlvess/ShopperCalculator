export default function AppIcon({ size = 32, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="48" height="48" rx="12" fill="#1a1a1a"/>
      <path d="M10 30 A14 14 0 1 1 38 30" stroke="#06C167" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <line x1="24" y1="16" x2="24" y2="13" stroke="#06C167" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="14.5" y1="19.5" x2="12.4" y2="17.4" stroke="#06C167" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
      <line x1="33.5" y1="19.5" x2="35.6" y2="17.4" stroke="#06C167" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
      <line x1="24" y1="30" x2="34" y2="21" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="24" cy="30" r="2.5" fill="#06C167"/>
    </svg>
  )
}
