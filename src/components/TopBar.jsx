import AppIcon from './AppIcon'

const TITLES = {
  dashboard: 'Dashboard',
  calculator: 'Calculadora',
  history: 'Histórico',
  settings: 'Configurações',
}

export default function TopBar({ tab }) {
  return (
    <div className="sticky top-0 z-40 bg-graphite-900/90 backdrop-blur-md border-b border-graphite-700">
      <div className="flex items-center gap-3 px-4 py-3">
        <AppIcon size={34} />
        <div>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest leading-none mb-0.5">GigCalc</p>
          <h1 className="text-lg font-bold text-white leading-tight">{TITLES[tab]}</h1>
        </div>
      </div>
    </div>
  )
}
