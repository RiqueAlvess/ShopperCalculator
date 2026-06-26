import { useState, useEffect } from 'react'

export default function Settings({ settings, updateSetting, costPerMile }) {
  const [local, setLocal] = useState({ ...settings })
  const [saved, setSaved] = useState(false)

  useEffect(() => { setLocal({ ...settings }) }, [settings])

  const handleSave = async () => {
    const keys = ['gasPrice', 'mpg', 'maintenanceCost', 'maintenanceFreqMonths', 'dailyGoal', 'weeklyGoal', 'monthlyGoal']
    await Promise.all(keys.map((k) => updateSetting(k, local[k])))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const set = (k, v) => setLocal((p) => ({ ...p, [k]: v }))

  const localCpm = local.gasPrice / local.mpg

  return (
    <div className="p-4 space-y-5 pb-24">
      <div className="flex items-center gap-2">
        <span className="text-2xl">⚙️</span>
        <h1 className="text-xl font-bold text-white">Configurações</h1>
      </div>

      {/* Vehicle */}
      <Section title="🚗 Veículo & Combustível">
        <SettingInput
          label="Preço da Gasolina (por galão)"
          prefix="$"
          value={local.gasPrice}
          onChange={(v) => set('gasPrice', v)}
        />
        <SettingInput
          label="Milhas por Galão (MPG)"
          suffix="mpg"
          value={local.mpg}
          onChange={(v) => set('mpg', v)}
        />
        <SettingInput
          label="Custo de Manutenção Recorrente"
          prefix="$"
          value={local.maintenanceCost}
          onChange={(v) => set('maintenanceCost', v)}
        />
        <SettingInput
          label="Frequência de Manutenção"
          suffix="meses"
          value={local.maintenanceFreqMonths}
          onChange={(v) => set('maintenanceFreqMonths', v)}
        />

        <div className="flex items-center justify-between bg-neon-green/10 border border-neon-green/30 rounded-xl p-3">
          <span className="text-sm text-gray-300">Custo por Milha (calculado)</span>
          <span className="text-neon-green font-bold text-lg">${localCpm.toFixed(4)}</span>
        </div>
      </Section>

      {/* Goals */}
      <Section title="🎯 Metas Financeiras">
        <SettingInput
          label="Meta Diária"
          prefix="$"
          value={local.dailyGoal}
          onChange={(v) => set('dailyGoal', v)}
        />
        <SettingInput
          label="Meta Semanal"
          prefix="$"
          value={local.weeklyGoal}
          onChange={(v) => set('weeklyGoal', v)}
        />
        <SettingInput
          label="Meta Mensal"
          prefix="$"
          value={local.monthlyGoal}
          onChange={(v) => set('monthlyGoal', v)}
        />
      </Section>

      <button
        onClick={handleSave}
        className={`w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all active:scale-95
          ${saved ? 'bg-graphite-600 text-neon-green border border-neon-green' : 'bg-neon-green text-graphite-900 hover:brightness-110'}`}
      >
        {saved ? '✅ Configurações Salvas!' : 'SALVAR CONFIGURAÇÕES'}
      </button>

      <div className="bg-graphite-800 rounded-2xl p-4 border border-graphite-600 text-xs text-gray-400 space-y-1">
        <p className="text-gray-300 font-medium text-sm mb-2">ℹ️ Como funciona a fórmula</p>
        <p>• <strong className="text-gray-200">Custo por Milha</strong> = Preço Gasolina ÷ MPG</p>
        <p>• <strong className="text-gray-200">Breakeven</strong> = (Milhas × 1.31) + (Itens × $0.60)</p>
        <p>• <strong className="text-gray-200">Mínimo Recomendado</strong> = Breakeven × 1.15 (margem 15%)</p>
        <p>• Todos os dados ficam salvos localmente no dispositivo (offline).</p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-graphite-800 rounded-2xl p-4 border border-graphite-600 space-y-3">
      <h2 className="text-sm font-semibold text-gray-300">{title}</h2>
      {children}
    </div>
  )
}

function SettingInput({ label, value, onChange, prefix, suffix }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <div className="flex items-center bg-graphite-700 rounded-xl border border-graphite-500 focus-within:border-neon-green transition-colors overflow-hidden">
        {prefix && <span className="pl-3 text-gray-400 text-sm">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent px-3 py-3 text-white text-base outline-none"
        />
        {suffix && <span className="pr-3 text-gray-400 text-sm">{suffix}</span>}
      </div>
    </div>
  )
}
