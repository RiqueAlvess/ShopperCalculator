import { useState } from 'react'
import { saveRide } from '../lib/db'

function fmt(n) {
  return n.toFixed(2)
}

export default function Calculator({ costPerMile }) {
  const [form, setForm] = useState({
    offered: '',
    miles: '',
    items: '',
    extraMiles: '',
    store: '',
  })
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(null)

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }))
    setResult(null)
    setSaved(null)
  }

  const calculate = () => {
    const offered = parseFloat(form.offered) || 0
    const miles = parseFloat(form.miles) || 0
    const items = parseFloat(form.items) || 0
    const extra = parseFloat(form.extraMiles) || 0
    const totalMiles = miles + extra

    const fuelCost = totalMiles * costPerMile
    const breakeven = totalMiles * 1.31 + items * 0.6
    const minWithMargin = breakeven * 1.15
    const profit = offered - fuelCost
    const accept = offered >= minWithMargin

    setResult({ offered, miles, items, extra, totalMiles, fuelCost, breakeven, minWithMargin, profit, accept })
    setSaved(null)
  }

  const handleDecision = async (decision) => {
    if (!result) return
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const ride = {
      timestamp: now.toISOString(),
      date: dateStr,
      offered: result.offered,
      miles: result.miles,
      items: result.items,
      extraMiles: result.extra,
      store: form.store.trim(),
      profit: result.profit,
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
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🧮</span>
        <h1 className="text-xl font-bold text-white">Calculadora</h1>
      </div>

      <div className="bg-graphite-800 rounded-2xl p-4 space-y-3 border border-graphite-600">
        <InputField label="Valor Oferecido ($)" prefix="$" value={form.offered} onChange={(v) => set('offered', v)} placeholder="0.00" type="number" />
        <InputField label="Milhas da Corrida" suffix="mi" value={form.miles} onChange={(v) => set('miles', v)} placeholder="0.0" type="number" />
        <InputField label="Quantidade de Itens" value={form.items} onChange={(v) => set('items', v)} placeholder="0" type="number" />
        <InputField label="Deslocamento Extra (opcional)" suffix="mi" value={form.extraMiles} onChange={(v) => set('extraMiles', v)} placeholder="0.0" type="number" />
        <InputField label="Nome do Mercado (opcional)" value={form.store} onChange={(v) => set('store', v)} placeholder="ex: Smith's, Target..." type="text" />

        <button
          onClick={calculate}
          className="w-full py-3 bg-neon-green text-graphite-900 font-bold rounded-xl text-base tracking-wide hover:brightness-110 active:scale-95 transition-all"
        >
          CALCULAR VIABILIDADE
        </button>
      </div>

      {result && (
        <div className="space-y-3 animate-fade-in">
          <div className={`rounded-2xl p-5 border-2 text-center ${result.accept ? 'bg-green-900/30 border-neon-green' : 'bg-red-900/30 border-red-500'}`}>
            <div className="text-3xl mb-1">{result.accept ? '🔥' : '❌'}</div>
            <div className={`text-2xl font-black tracking-tight ${result.accept ? 'text-neon-green' : 'text-red-400'}`}>
              {result.accept ? 'ZONA QUENTE: ACEITAR!' : 'ZONA FRIA: REJEITAR!'}
            </div>
          </div>

          <div className="bg-graphite-800 rounded-2xl p-4 space-y-2 border border-graphite-600">
            <Row label="Valor Oferecido" value={`$${fmt(result.offered)}`} />
            <Row label="Custo de Combustível" value={`$${fmt(result.fuelCost)}`} dim />
            <Row label="Mín. Breakeven" value={`$${fmt(result.breakeven)}`} dim />
            <Row label="Mín. c/ Margem (15%)" value={`$${fmt(result.minWithMargin)}`} accent />
            <div className="border-t border-graphite-600 pt-2 mt-2">
              <Row
                label="Lucro Líquido Estimado"
                value={`${result.profit >= 0 ? '+' : ''}$${fmt(result.profit)}`}
                highlight={result.profit >= 0 ? 'green' : 'red'}
              />
            </div>
          </div>

          {!saved && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDecision('aceitou')}
                className="py-4 bg-neon-green/10 border-2 border-neon-green text-neon-green font-bold rounded-xl text-sm hover:bg-neon-green/20 active:scale-95 transition-all"
              >
                ✅ ACEITEI
              </button>
              <button
                onClick={() => handleDecision('rejeitou')}
                className="py-4 bg-red-500/10 border-2 border-red-500 text-red-400 font-bold rounded-xl text-sm hover:bg-red-500/20 active:scale-95 transition-all"
              >
                ❌ REJEITEI
              </button>
            </div>
          )}

          {saved && (
            <div className="bg-graphite-700 rounded-xl p-4 text-center space-y-3">
              <div className={`text-lg font-bold ${saved === 'aceitou' ? 'text-neon-green' : 'text-red-400'}`}>
                {saved === 'aceitou' ? '✅ Corrida salva como ACEITA!' : '❌ Corrida salva como REJEITADA!'}
              </div>
              <button onClick={reset} className="px-6 py-2 bg-graphite-600 text-white rounded-lg text-sm font-medium hover:bg-graphite-500">
                Nova Corrida
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, type, prefix, suffix }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1 font-medium">{label}</label>
      <div className="flex items-center bg-graphite-700 rounded-xl border border-graphite-500 focus-within:border-neon-green transition-colors overflow-hidden">
        {prefix && <span className="pl-3 text-gray-400 text-sm">{prefix}</span>}
        <input
          type={type}
          inputMode={type === 'number' ? 'decimal' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-3 text-white text-base outline-none placeholder-gray-600"
        />
        {suffix && <span className="pr-3 text-gray-400 text-sm">{suffix}</span>}
      </div>
    </div>
  )
}

function Row({ label, value, dim, accent, highlight }) {
  const valClass = highlight === 'green'
    ? 'text-neon-green font-bold'
    : highlight === 'red'
    ? 'text-red-400 font-bold'
    : accent
    ? 'text-yellow-400 font-semibold'
    : dim
    ? 'text-gray-400'
    : 'text-white'

  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={valClass}>{value}</span>
    </div>
  )
}
