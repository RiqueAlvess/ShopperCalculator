import { useState } from 'react'
import BottomNav from './components/BottomNav'
import Dashboard from './components/Dashboard'
import Calculator from './components/Calculator'
import History from './components/History'
import Settings from './components/Settings'
import { useSettings } from './hooks/useSettings'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const { settings, updateSetting, costPerMile, loaded } = useSettings()

  if (!loaded) {
    return (
      <div className="min-h-screen bg-graphite-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-graphite-900 text-white">
      <div className="max-w-lg mx-auto relative">
        <div className="overflow-y-auto" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
          {tab === 'dashboard' && <Dashboard settings={settings} />}
          {tab === 'calculator' && <Calculator costPerMile={costPerMile} />}
          {tab === 'history' && <History />}
          {tab === 'settings' && <Settings settings={settings} updateSetting={updateSetting} costPerMile={costPerMile} />}
        </div>
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  )
}
