import { useState, useEffect } from 'react'

export default function Settings({ settings, updateSetting, costPerMile }) {
  const [local, setLocal] = useState({ ...settings })
  const [saved, setSaved] = useState(false)

  useEffect(() => { setLocal({ ...settings }) }, [settings])

  const handleSave = async () => {
    const keys = ['gasPrice','mpg','maintenanceCost','maintenanceFreqMonths','dailyGoal','weeklyGoal','monthlyGoal']
    await Promise.all(keys.map((k) => updateSetting(k, local[k])))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const set = (k, v) => setLocal((p) => ({ ...p, [k]: v }))
  const localCpm = (local.gasPrice / local.mpg) || 0

  return (
    <div className="p-4 space-y-5 pb-6">
      {/* Vehicle */}
      <Section title="Veículo & Combustível" icon={<CarIcon />}>
        <SettingInput label="Preço da Gasolina (por galão)" prefix="$"     value={local.gasPrice}              onChange={(v) => set('gasPrice', v)} />
        <SettingInput label="Milhas por Galão (MPG)"        suffix="mpg"   value={local.mpg}                   onChange={(v) => set('mpg', v)} />
        <SettingInput label="Custo de Manutenção"           prefix="$"     value={local.maintenanceCost}        onChange={(v) => set('maintenanceCost', v)} />
        <SettingInput label="Frequência de Manutenção"      suffix="meses" value={local.maintenanceFreqMonths}  onChange={(v) => set('maintenanceFreqMonths', v)} />

        <div className="flex items-center justify-between bg-neon-green/8 border border-neon-green/25 rounded-xl p-4 mt-1">
          <div>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Custo por Milha</p>
            <p className="text-xs text-gray-600 mt-0.5">Calculado automaticamente</p>
          </div>
          <span className="text-neon-green font-black text-2xl">${localCpm.toFixed(4)}</span>
        </div>
      </Section>

      {/* Goals */}
      <Section title="Metas Financeiras" icon={<TargetIcon />}>
        <SettingInput label="Meta Diária"  prefix="$" value={local.dailyGoal}   onChange={(v) => set('dailyGoal', v)} />
        <SettingInput label="Meta Semanal" prefix="$" value={local.weeklyGoal}  onChange={(v) => set('weeklyGoal', v)} />
        <SettingInput label="Meta Mensal"  prefix="$" value={local.monthlyGoal} onChange={(v) => set('monthlyGoal', v)} />
      </Section>

      <button
        onClick={handleSave}
        className={`w-full py-4 rounded-xl font-extrabold text-[15px] tracking-widest transition-all active:scale-[0.98]
          ${saved
            ? 'bg-graphite-700 text-neon-green border-2 border-neon-green'
            : 'bg-neon-green text-graphite-900 hover:brightness-110 shadow-[0_0_20px_rgba(57,255,20,0.25)]'
          }`}
      >
        {saved ? 'CONFIGURAÇÕES SALVAS ✓' : 'SALVAR CONFIGURAÇÕES'}
      </button>

      {/* Formula reference */}
      <div className="bg-graphite-800 rounded-2xl p-4 border border-graphite-600 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <InfoIcon />
          <p className="text-sm font-semibold text-gray-300">Como funciona a fórmula</p>
        </div>
        <FormulaRow label="Custo por Milha"       value="Gas ÷ MPG" />
        <FormulaRow label="Breakeven"              value="(mi × 1.31) + (itens × $0.60)" />
        <FormulaRow label="Mínimo Recomendado"     value="Breakeven × 1.15  (margem 15%)" />
        <p className="text-[11px] text-gray-600 pt-1">Todos os dados são salvos localmente no dispositivo e funcionam sem internet.</p>
      </div>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-graphite-800 rounded-2xl p-4 border border-graphite-600 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-400">{icon}</span>
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function SettingInput({ label, value, onChange, prefix, suffix }) {
  return (
    <div>
      <label className="block text-[11px] text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">{label}</label>
      <div className="flex items-center bg-graphite-700 rounded-xl border border-graphite-500 focus-within:border-neon-green focus-within:shadow-[0_0_0_3px_rgba(57,255,20,0.1)] transition-all overflow-hidden">
        {prefix && <span className="pl-3.5 text-gray-400 text-base font-medium">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent px-3 py-3.5 text-white text-base outline-none font-medium"
        />
        {suffix && <span className="pr-3.5 text-gray-500 text-sm">{suffix}</span>}
      </div>
    </div>
  )
}

function FormulaRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-gray-500 font-semibold">{label}</span>
      <span className="text-xs text-gray-300 font-mono">{value}</span>
    </div>
  )
}

function CarIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
}
function TargetIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
}
function InfoIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
}
