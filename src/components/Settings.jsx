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

  const preview = adjustedCosts(
    parseFloat(local.gasPrice)              || 0,
    parseFloat(local.mpg)                   || 1,
    parseFloat(local.maintenanceCost)       || 0,
    parseFloat(local.maintenanceFreqMonths) || 1,
  )

  return (
    <div className="px-5 py-4 space-y-5 pb-6">
      <Section label="Veículo & Combustível">
        <Field label="Preço da gasolina (galão)" prefix="$"     value={local.gasPrice}              onChange={(v) => set('gasPrice', v)} />
        <Field label="Milhas por galão (MPG)"    suffix="mpg"   value={local.mpg}                   onChange={(v) => set('mpg', v)} />
        <Field label="Custo de manutenção"        prefix="$"     value={local.maintenanceCost}        onChange={(v) => set('maintenanceCost', v)} />
        <Field label="Frequência de manutenção"   suffix="meses" value={local.maintenanceFreqMonths}  onChange={(v) => set('maintenanceFreqMonths', v)} />

        <div className="pt-1 space-y-2">
          <CostPreviewRow label="Combustível / mi" adj={preview.fuelPerMile}  raw={preview.rawCostPerMile} pct={GAS_BUFFER} />
          <CostPreviewRow label="Manutenção / mi"  adj={preview.maintPerMile} pct={MAINTENANCE_BUFFER} />
          <div className="flex justify-between items-center pt-1 border-t border-uber-border">
            <span className="text-sm text-uber-sub font-semibold">Total / milha</span>
            <span className="text-uber-green font-black text-xl">${preview.totalCostPerMile.toFixed(4)}</span>
          </div>
        </div>
      </Section>

      <Section label="Metas Financeiras">
        <Field label="Meta diária"  prefix="$" value={local.dailyGoal}   onChange={(v) => set('dailyGoal', v)} />
        <Field label="Meta semanal" prefix="$" value={local.weeklyGoal}  onChange={(v) => set('weeklyGoal', v)} />
        <Field label="Meta mensal"  prefix="$" value={local.monthlyGoal} onChange={(v) => set('monthlyGoal', v)} />
      </Section>

      <button
        onClick={handleSave}
        className={`w-full py-4 rounded-xl font-bold text-[15px] tracking-wide transition-all active:scale-[0.98]
          ${saved ? 'bg-uber-surface border border-uber-green text-uber-green' : 'bg-white text-black hover:bg-zinc-100'}`}
      >
        {saved ? 'Salvo ✓' : 'Salvar configurações'}
      </button>

      {/* Formula info */}
      <Section label="Como funciona">
        <div className="space-y-3 text-sm">
          <InfoRow label="Margem gasolina"   value={`+${Math.round(GAS_BUFFER*100)}%`} />
          <InfoRow label="Margem manutenção" value={`+${Math.round(MAINTENANCE_BUFFER*100)}%`} />
          <div className="border-t border-uber-border pt-3 space-y-2 text-[12px] text-uber-muted font-mono">
            <p>Milhas ajustadas = mi × 1.35</p>
            <p>Breakeven = (mi_adj × custo/mi) + (itens × 0.30)</p>
            <p>Mínimo = Breakeven × 1.15</p>
          </div>
          <p className="text-[11px] text-zinc-700 pt-1">Dados salvos localmente — funciona offline.</p>
        </div>
      </Section>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div className="bg-uber-surface rounded-2xl border border-uber-border overflow-hidden">
      <div className="px-4 py-3 border-b border-uber-border">
        <p className="text-[11px] text-uber-muted font-bold uppercase tracking-[0.15em]">{label}</p>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, prefix, suffix }) {
  return (
    <div>
      <label className="block text-[11px] text-uber-muted mb-1.5 font-semibold uppercase tracking-wider">{label}</label>
      <div className="flex items-center bg-uber-card rounded-xl border border-uber-border focus-within:border-white/40 transition-all overflow-hidden">
        {prefix && <span className="pl-4 text-uber-sub text-base">{prefix}</span>}
        <input
          type="number" inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent px-4 py-3 text-white text-base outline-none font-medium"
        />
        {suffix && <span className="pr-4 text-uber-muted text-sm">{suffix}</span>}
      </div>
    </div>
  )
}

function CostPreviewRow({ label, adj, raw, pct }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-uber-muted">{label}</span>
      <div className="flex items-center gap-2">
        {raw != null && <span className="text-zinc-700 line-through text-xs">${raw.toFixed(4)}</span>}
        <span className="text-white font-semibold">${adj.toFixed(4)}</span>
        <span className="text-[10px] text-yellow-500 font-bold">+{Math.round(pct*100)}%</span>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-uber-muted">{label}</span>
      <span className="text-yellow-500 font-bold text-sm">{value}</span>
    </div>
  )
}
