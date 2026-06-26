import { useState, useEffect } from 'react'
import { adjustedCosts, GAS_BUFFER, MAINTENANCE_BUFFER } from '../lib/costBuffers'

export default function Settings({ settings, updateSetting, costs }) {
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

  // Live-preview adjusted costs as user types (before saving)
  const preview = adjustedCosts(
    parseFloat(local.gasPrice)             || 0,
    parseFloat(local.mpg)                  || 1,
    parseFloat(local.maintenanceCost)      || 0,
    parseFloat(local.maintenanceFreqMonths)|| 1,
  )

  return (
    <div className="p-4 space-y-5 pb-6">
      {/* Vehicle */}
      <Section title="Veículo & Combustível" icon={<CarIcon />}>
        <SettingInput label="Preço da Gasolina (por galão)" prefix="$"     value={local.gasPrice}              onChange={(v) => set('gasPrice', v)} />
        <SettingInput label="Milhas por Galão (MPG)"        suffix="mpg"   value={local.mpg}                   onChange={(v) => set('mpg', v)} />
        <SettingInput label="Custo de Manutenção"           prefix="$"     value={local.maintenanceCost}        onChange={(v) => set('maintenanceCost', v)} />
        <SettingInput label="Frequência de Manutenção"      suffix="meses" value={local.maintenanceFreqMonths}  onChange={(v) => set('maintenanceFreqMonths', v)} />

        {/* Adjusted cost preview */}
        <div className="bg-graphite-700 rounded-xl border border-graphite-500 p-4 space-y-2.5 mt-1">
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Custo por Milha Protegido</p>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Combustível</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 line-through text-xs">${preview.rawCostPerMile.toFixed(4)}</span>
              <span className="text-yellow-400 font-semibold">${preview.fuelPerMile.toFixed(4)}</span>
              <BufferBadge pct={GAS_BUFFER} />
            </div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Manutenção</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-xs">+</span>
              <span className="text-yellow-400 font-semibold">${preview.maintPerMile.toFixed(4)}</span>
              <BufferBadge pct={MAINTENANCE_BUFFER} />
            </div>
          </div>

          <div className="border-t border-graphite-600 pt-2 flex justify-between items-center">
            <span className="text-sm text-gray-300 font-semibold">Total / milha</span>
            <span className="text-neon-green font-black text-xl">${preview.totalCostPerMile.toFixed(4)}</span>
          </div>
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

      {/* Buffer rationale */}
      <div className="bg-graphite-800 rounded-2xl p-4 border border-graphite-600 space-y-3">
        <div className="flex items-center gap-2">
          <InfoIcon />
          <p className="text-sm font-semibold text-gray-300">Por que esses buffers?</p>
        </div>
        <BufferExplain
          label="Gasolina"
          pct={GAS_BUFFER}
          why="Preços de varejo oscilam ±8–18% sazonalmente (fonte: EIA). Um spike de refinery pode subir 10% numa semana."
        />
        <BufferExplain
          label="Manutenção"
          pct={MAINTENANCE_BUFFER}
          why="Peças automotivas subiram +7,9% ao ano de 2022–2024 (fonte: BLS CPI). Mão-de-obra independente +5–7% a.a."
        />
        <div className="border-t border-graphite-600 pt-3 space-y-2">
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Fórmula</p>
          <FormulaRow label="Custo Combustível/mi" value="(Gas × 1.12) ÷ MPG" />
          <FormulaRow label="Custo Manutenção/mi"  value="(Manutenção × 1.08) ÷ freq ÷ 1.050 mi/mês" />
          <FormulaRow label="Breakeven"             value="(mi × 1.31) + (itens × $0.60)" />
          <FormulaRow label="Mínimo Recomendado"    value="Breakeven × 1.15  (margem 15%)" />
        </div>
        <p className="text-[10px] text-gray-600">Dados salvos localmente — funciona 100% offline.</p>
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

function BufferBadge({ pct }) {
  return (
    <span className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/25 rounded px-1.5 py-0.5 font-bold">
      +{Math.round(pct * 100)}%
    </span>
  )
}

function BufferExplain({ label, pct, why }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-300 font-medium">{label}</span>
        <BufferBadge pct={pct} />
      </div>
      <p className="text-[11px] text-gray-600 leading-snug">{why}</p>
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
