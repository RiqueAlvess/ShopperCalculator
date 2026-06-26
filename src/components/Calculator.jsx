import { useState } from 'react'
import { saveRide } from '../lib/db'
import { GAS_BUFFER, MAINTENANCE_BUFFER } from '../lib/costBuffers'

const fmt    = (n) => Math.abs(n).toFixed(2)
const fmtPct = (r) => `+${Math.round(r * 100)}%`

export default function Calculator({ costs }) {
  const [form, setForm] = useState({ offered: '', miles: '', items: '', extraMiles: '', store: '' })
  const [result, setResult] = useState(null)
  const [saved,  setSaved]  = useState(null)
  const [showCosts, setShowCosts] = useState(false)

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setResult(null); setSaved(null) }

  const calculate = () => {
    const offered    = parseFloat(form.offered)    || 0
    const miles      = parseFloat(form.miles)      || 0
    const items      = parseFloat(form.items)      || 0
    const extra      = parseFloat(form.extraMiles) || 0
    const totalMiles = miles + extra

    // Use buffered total cost per mile (fuel + maintenance, with inflation guard)
    const rideCost      = totalMiles * costs.totalCostPerMile
    const breakeven     = totalMiles * 1.31 + items * 0.6
    const minWithMargin = breakeven * 1.15
    const accept        = offered >= minWithMargin
    const netAfterCost  = offered - rideCost
    const vsMinimum     = offered - minWithMargin

    setResult({ offered, miles, items, extra, totalMiles, rideCost, breakeven, minWithMargin, accept, netAfterCost, vsMinimum })
    setSaved(null)
  }

  const handleDecision = async (decision) => {
    if (!result) return
    const now  = new Date()
    const ride = {
      timestamp:  now.toISOString(),
      date:       now.toISOString().slice(0, 10),
      offered:    result.offered,
      miles:      result.miles,
      items:      result.items,
      extraMiles: result.extra,
      store:      form.store.trim(),
      profit:     result.netAfterCost,
      decision,
    }
    await saveRide(ride)
    setSaved(decision)
  }

  const reset = () => {
    setForm({ offered: '', miles: '', items: '', extraMiles: '', store: '' })
    setResult(null)
    setSaved(null)
  }

  return (
    <div className="p-4 space-y-4">
      {/* Cost-per-mile pill — always visible */}
      <button
        onClick={() => setShowCosts((v) => !v)}
        className="w-full flex items-center justify-between bg-graphite-800 border border-graphite-600 rounded-xl px-4 py-2.5 text-sm hover:border-neon-green/40 transition-colors"
      >
        <span className="text-gray-400">Custo/milha protegido</span>
        <div className="flex items-center gap-2">
          <span className="text-neon-green font-bold">${costs.totalCostPerMile.toFixed(4)}</span>
          <ChevronIcon open={showCosts} />
        </div>
      </button>

      {/* Expandable cost breakdown */}
      {showCosts && (
        <div className="bg-graphite-800 rounded-xl border border-graphite-600 p-4 space-y-3 animate-fade-in">
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Composição do Custo por Milha</p>

          <CostRow
            label="Combustível"
            raw={costs.rawCostPerMile}
            adj={costs.fuelPerMile}
            buffer={GAS_BUFFER}
            reason="Oscilação semanal de preço da gasolina (EIA: ±8–18% sazonalmente)"
          />
          <CostRow
            label="Manutenção"
            raw={0}
            adj={costs.maintPerMile}
            buffer={MAINTENANCE_BUFFER}
            reason="Inflação de peças automotivas + mão-de-obra (BLS CPI: +7,9% a.a. 2022–2024)"
            rawLabel="não incluso antes"
          />

          <div className="border-t border-graphite-600 pt-3 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-300">Total por milha</span>
            <div className="text-right">
              <span className="text-neon-green font-black text-lg">${costs.totalCostPerMile.toFixed(4)}</span>
              <p className="text-[10px] text-gray-600">base real: ${costs.rawCostPerMile.toFixed(4)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Input card */}
      <div className="bg-graphite-800 rounded-2xl p-4 space-y-3 border border-graphite-600 shadow-lg">
        <InputField label="Valor Oferecido ($)" prefix="$"   value={form.offered}    onChange={(v) => set('offered', v)}    placeholder="0.00"                 type="number" />
        <InputField label="Milhas da Corrida"   suffix="mi"  value={form.miles}      onChange={(v) => set('miles', v)}      placeholder="0.0"                  type="number" />
        <InputField label="Quantidade de Itens"              value={form.items}      onChange={(v) => set('items', v)}      placeholder="0"                    type="number" />
        <InputField label="Deslocamento Extra (opcional)" suffix="mi" value={form.extraMiles} onChange={(v) => set('extraMiles', v)} placeholder="0.0"        type="number" />
        <InputField label="Nome do Mercado (opcional)"       value={form.store}      onChange={(v) => set('store', v)}      placeholder="ex: Smith's, Target…" type="text" />

        <button
          onClick={calculate}
          className="w-full py-3.5 bg-neon-green text-graphite-900 font-extrabold rounded-xl text-[15px] tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(57,255,20,0.3)]"
        >
          CALCULAR VIABILIDADE
        </button>
      </div>

      {result && (
        <div className="space-y-3 animate-fade-in">
          {/* Verdict banner */}
          <div className={`rounded-2xl px-5 py-6 border-2 text-center ${result.accept
            ? 'bg-green-950/60 border-neon-green shadow-[0_0_30px_rgba(57,255,20,0.18)]'
            : 'bg-red-950/60  border-red-500  shadow-[0_0_30px_rgba(239,68,68,0.18)]'
          }`}>
            <div className="text-4xl mb-2">{result.accept ? '🔥' : '🚫'}</div>
            <div className={`text-2xl font-black tracking-tight ${result.accept ? 'text-neon-green' : 'text-red-400'}`}>
              {result.accept ? 'ZONA QUENTE: ACEITAR!' : 'ZONA FRIA: REJEITAR!'}
            </div>
            <div className="mt-3">
              {result.accept ? (
                <div className="bg-neon-green/10 rounded-xl px-4 py-2 inline-block">
                  <p className="text-xs text-gray-400 mb-0.5">Excede o mínimo por</p>
                  <p className="text-neon-green text-2xl font-black">+${fmt(result.vsMinimum)}</p>
                </div>
              ) : (
                <div className="bg-red-500/10 rounded-xl px-4 py-2 inline-block">
                  <p className="text-xs text-gray-400 mb-0.5">Abaixo do mínimo recomendado por</p>
                  <p className="text-red-400 text-2xl font-black">−${fmt(result.vsMinimum)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-graphite-800 rounded-2xl p-4 space-y-2.5 border border-graphite-600">
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest mb-3">Detalhes do Cálculo</p>
            <Row label="Valor Oferecido"             value={`$${fmt(result.offered)}`}       color="white" />
            <Row
              label={`Custo Real da Corrida (${result.totalMiles.toFixed(1)} mi)`}
              value={`−$${fmt(result.rideCost)}`}
              color="dim"
              hint={`combustível + manutenção com proteção de inflação`}
            />
            <Row label="Breakeven (custo base mín.)" value={`$${fmt(result.breakeven)}`}     color="dim" />
            <Row label="Mínimo c/ margem 15%"        value={`$${fmt(result.minWithMargin)}`} color="yellow" />
            <div className="border-t border-graphite-600 pt-2.5 mt-1">
              <Row
                label="Resultado após todos os custos"
                value={`${result.netAfterCost >= 0 ? '+' : '−'}$${fmt(result.netAfterCost)}`}
                color={result.netAfterCost >= 0 ? 'green' : 'red'}
              />
            </div>
          </div>

          {/* Action buttons */}
          {!saved && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDecision('aceitou')}
                className="py-4 bg-neon-green/10 border-2 border-neon-green text-neon-green font-bold rounded-xl text-sm hover:bg-neon-green/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckIcon /> ACEITEI
              </button>
              <button
                onClick={() => handleDecision('rejeitou')}
                className="py-4 bg-red-500/10 border-2 border-red-500 text-red-400 font-bold rounded-xl text-sm hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <XIcon /> REJEITEI
              </button>
            </div>
          )}

          {saved && (
            <div className="bg-graphite-800 rounded-2xl p-4 text-center space-y-3 border border-graphite-600">
              <p className={`text-base font-bold ${saved === 'aceitou' ? 'text-neon-green' : 'text-red-400'}`}>
                {saved === 'aceitou' ? 'Corrida registrada como ACEITA ✅' : 'Corrida registrada como REJEITADA ❌'}
              </p>
              <button onClick={reset} className="px-6 py-2.5 bg-graphite-600 text-white rounded-xl text-sm font-semibold hover:bg-graphite-500 transition-colors">
                + Nova Corrida
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ── */

function CostRow({ label, raw, adj, buffer, reason, rawLabel }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-300 font-medium">{label}</span>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 line-through text-xs">
            {rawLabel ?? `$${raw.toFixed(4)}`}
          </span>
          <span className="text-yellow-400 font-bold">${adj.toFixed(4)}</span>
          <span className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded px-1.5 py-0.5 font-bold">
            {fmtPct(buffer)}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-gray-600 leading-snug">{reason}</p>
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, type, prefix, suffix }) {
  return (
    <div>
      <label className="block text-[11px] text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">{label}</label>
      <div className="flex items-center bg-graphite-700 rounded-xl border border-graphite-500 focus-within:border-neon-green focus-within:shadow-[0_0_0_3px_rgba(57,255,20,0.1)] transition-all overflow-hidden">
        {prefix && <span className="pl-3.5 text-gray-400 text-base font-medium">{prefix}</span>}
        <input
          type={type}
          inputMode={type === 'number' ? 'decimal' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-3.5 text-white text-base outline-none placeholder-gray-600 font-medium"
        />
        {suffix && <span className="pr-3.5 text-gray-400 text-sm">{suffix}</span>}
      </div>
    </div>
  )
}

function Row({ label, value, color, hint }) {
  const cls = {
    white:  'text-white font-semibold',
    dim:    'text-gray-400',
    yellow: 'text-yellow-400 font-bold',
    green:  'text-neon-green font-bold',
    red:    'text-red-400 font-bold',
  }
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">{label}</span>
        <span className={cls[color] ?? 'text-white'}>{value}</span>
      </div>
      {hint && <p className="text-[10px] text-gray-600">{hint}</p>}
    </div>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
function CheckIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function XIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}
