import { useState } from 'react'
import BottomNav from './components/BottomNav'
import TopBar from './components/TopBar'
import Dashboard from './components/Dashboard'
import Calculator from './components/Calculator'
import History from './components/History'
import Settings from './components/Settings'
import { useSettings } from './hooks/useSettings'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const { settings, updateSetting, costs, loaded } = useSettings()

  if (!loaded) {
    return (
      <div className="min-h-screen bg-graphite-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-graphite-900 text-white">
      <div className="max-w-lg mx-auto flex flex-col" style={{ minHeight: '100dvh' }}>
        <TopBar tab={tab} />
        <div className="flex-1 overflow-y-auto pb-20">
          {tab === 'dashboard'  && <Dashboard settings={settings} />}
          {tab === 'calculator' && <Calculator costs={costs} />}
          {tab === 'history'    && <History />}
          {tab === 'settings'   && <Settings settings={settings} updateSetting={updateSetting} costs={costs} />}
        </div>
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  )
}
