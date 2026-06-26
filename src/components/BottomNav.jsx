export default function BottomNav({ active, onChange }) {
  const tabs = [
    { id: 'dashboard',  label: 'Dashboard', icon: GridIcon },
    { id: 'calculator', label: 'Calcular',  icon: CalcIcon },
    { id: 'history',    label: 'Histórico', icon: ClockIcon },
    { id: 'settings',   label: 'Config',    icon: GearIcon },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-uber-border safe-bottom">
      <div className="flex items-stretch h-[60px] max-w-lg mx-auto">
        {tabs.map(({ id, label, icon: Icon }) => {
          const on = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Icon active={on} />
              <span className={`text-[10px] font-semibold tracking-wide transition-colors ${on ? 'text-white' : 'text-uber-muted'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

const s = { size: 22, strokeWidth: 1.8 }

function GridIcon({ active }) {
  const c = active ? '#fff' : '#6b6b6b'
  return (
    <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )
}
function CalcIcon({ active }) {
  const c = active ? '#fff' : '#6b6b6b'
  return (
    <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <line x1="8" y1="7" x2="16" y2="7"/>
      <line x1="8" y1="12" x2="8.01" y2="12"/><line x1="12" y1="12" x2="12.01" y2="12"/><line x1="16" y1="12" x2="16.01" y2="12"/>
      <line x1="8" y1="16" x2="8.01" y2="16"/><line x1="12" y1="16" x2="12.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/>
    </svg>
  )
}
function ClockIcon({ active }) {
  const c = active ? '#fff' : '#6b6b6b'
  return (
    <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function GearIcon({ active }) {
  const c = active ? '#fff' : '#6b6b6b'
  return (
    <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
