import AppIcon from './AppIcon'

const TITLES = {
  dashboard:  'Dashboard',
  calculator: 'Calculadora',
  history:    'Histórico',
  settings:   'Configurações',
}

export default function TopBar({ tab }) {
  return (
    <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-uber-border">
      <div className="flex items-center gap-3 px-5 py-4">
        <AppIcon size={30} />
        <div>
          <p className="text-[10px] text-uber-muted font-semibold uppercase tracking-[0.15em] leading-none mb-0.5">GigCalc</p>
          <h1 className="text-[17px] font-bold text-white leading-tight tracking-tight">{TITLES[tab]}</h1>
        </div>
      </div>
    </div>
  )
}
