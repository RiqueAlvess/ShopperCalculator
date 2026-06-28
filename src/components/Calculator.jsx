import { useState, useEffect } from 'react'
import { saveRide, getRidesByDate } from '../lib/db'

const MILES_MULTIPLIER = 1.35

async function loadSurplus() {
  const today = new Date().toISOString().slice(0, 10)
  const rides = await getRidesByDate(today)
  return rides
    .filter(r => r.decision === 'aceitou')
    .reduce((acc, r) => acc + ((r.offered || 0) - (r.minWithMargin || 0)), 0)
}

function calcMinimum(miles, items, surplus, costPerMile) {
  const adjMiles      = miles * MILES_MULTIPLIER
  const breakeven     = adjMiles * costPerMile + items * 0.33
  const minWithMargin = breakeven * 1.15
  const effectiveMin  = Math.max(minWithMargin * 0.60, minWithMargin - Math.max(0, surplus))
  const boosted       = surplus > 0 && effectiveMin < minWithMargin
  return { adjMiles, minWithMargin, effectiveMin, boosted }
}

export default function Calculator({ costs }) {
  const [miles,    setMiles]    = useState('')
  const [items,    setItems]    = useState('')
  const [surplus,  setSurplus]  = useState(0)
  const [step,     setStep]     = useState('input')
  const [calc,     setCalc]     = useState(null)
  const [received, setReceived] = useState('')

  const refresh = async () => setSurplus(await loadSurplus())
  useEffect(() => { refresh() }, [])

  const handleCalc = () => {
    const m = parseFloat(miles) || 0
    const i = parseFloat(items) || 0
    setCalc(calcMinimum(m, i, surplus, costs.totalCostPerMile))
    setStep('minimum')
  }

  const handleRejected = async () => {
    const now = new Date()
    await saveRide({
      timestamp:     now.toISOString(),
      date:          now.toISOString().slice(0, 10),
      miles:         parseFloat(miles) || 0,
      items:         parseFloat(items) || 0,
      offered:       null,
      profit:        null,
      minWithMargin: calc.minWithMargin,
      boosted:       false,
      decision:      'rejeitou',
    })
    await refresh()
    reset()
  }

  const handleConfirm = async () => {
    const offered  = parseFloat(received) || 0
    const now      = new Date()
    const { adjMiles, minWithMargin, boosted, effectiveMin } = calc
    const profit   = offered - adjMiles * costs.totalCostPerMile
    const isBoosted= boosted && offered < minWithMargin
    await saveRide({
      timestamp:     now.toISOString(),
      date:          now.toISOString().slice(0, 10),
      miles:         parseFloat(miles) || 0,
      items:         parseFloat(items) || 0,
      offered,
      profit,
      minWithMargin,
      boosted:       isBoosted,
      decision:      'aceitou',
    })
    await refresh()
    reset()
  }

  const reset = () => {
    setMiles(''); setItems(''); setReceived('')
    setCalc(null); setStep('input')
  }

  /* ── INPUT ── */
  if (step === 'input') return (
    <div className="px-5 py-6 space-y-4 pb-6">
      {surplus > 0 && (
        <div className="flex items-center justify-between bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-2.5">
          <span className="text-[12px] text-amber-400 font-semibold flex items-center gap-1.5">🔥 Saldo de sessão</span>
          <span className="text-amber-400 font-black">+${surplus.toFixed(2)}</span>
        </div>
      )}

      <Field label="Milhas" value={miles} onChange={setMiles} placeholder="0.0" suffix="mi"
        hint={miles > 0 ? `${(parseFloat(miles)*MILES_MULTIPLIER).toFixed(1)} mi consideradas` : null}
      />
      <Field label="Itens" value={items} onChange={setItems} placeholder="0" />

      <button
        onClick={handleCalc}
        disabled={!miles && !items}
        className="w-full py-5 bg-white text-black font-bold rounded-xl text-[17px] tracking-wide active:scale-[0.98] transition-all disabled:opacity-25 mt-2"
      >
        Ver Mínimo
      </button>
    </div>
  )

  /* ── MINIMUM ── */
  if (step === 'minimum') {
    const { minWithMargin, effectiveMin, boosted } = calc
    const display = boosted ? effectiveMin : minWithMargin

    return (
      <div className="px-5 py-6 space-y-4 pb-6 animate-fade-up">
        <div className="rounded-2xl p-8 text-center bg-uber-surface border border-uber-border space-y-2">
          <p className="text-[11px] text-uber-muted font-bold uppercase tracking-[0.2em]">Valor mínimo para aceitar</p>
          <p className="text-[72px] font-black text-white leading-none tracking-tighter">
            ${display.toFixed(2)}
          </p>
          {boosted && (
            <p className="text-amber-400 text-xs font-bold pt-1 flex items-center justify-center gap-1">
              🔥 Impulsionado pelo saldo de +${surplus.toFixed(2)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setStep('accepted')}
            className="py-5 bg-uber-green text-black font-black rounded-xl text-base active:scale-95 transition-all"
          >
            Aceitei
          </button>
          <button
            onClick={handleRejected}
            className="py-5 bg-uber-card border border-uber-border text-uber-sub font-bold rounded-xl text-base active:scale-95 transition-all"
          >
            Rejeitei
          </button>
        </div>

        <button onClick={reset} className="w-full text-center text-uber-muted text-sm py-1">← Voltar</button>
      </div>
    )
  }

  /* ── ACCEPTED: enter amount received ── */
  if (step === 'accepted') return (
    <div className="px-5 py-6 space-y-4 pb-6 animate-fade-up">
      <div className="rounded-2xl p-5 bg-uber-surface border border-uber-border text-center">
        <p className="text-[11px] text-uber-muted font-bold uppercase tracking-[0.2em] mb-1">Mínimo era</p>
        <p className="text-3xl font-black text-uber-green">
          ${(calc.boosted ? calc.effectiveMin : calc.minWithMargin).toFixed(2)}
        </p>
      </div>

      <div>
        <label className="block text-[11px] text-uber-muted mb-2 font-semibold uppercase tracking-wider">Quanto te pagaram?</label>
        <div className="flex items-center bg-uber-card rounded-xl border border-uber-border focus-within:border-white/40 transition-all overflow-hidden">
          <span className="pl-5 text-uber-sub text-2xl font-semibold">$</span>
          <input
            type="number" inputMode="decimal"
            value={received} onChange={e => setReceived(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent px-3 py-5 text-white text-3xl outline-none placeholder-zinc-700 font-bold"
            autoFocus
          />
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={!received}
        className="w-full py-5 bg-white text-black font-bold rounded-xl text-[17px] active:scale-[0.98] transition-all disabled:opacity-25"
      >
        Confirmar
      </button>

      <button onClick={() => setStep('minimum')} className="w-full text-center text-uber-muted text-sm py-1">← Voltar</button>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, suffix, hint }) {
  return (
    <div>
      <label className="block text-[11px] text-uber-muted mb-1.5 font-semibold uppercase tracking-wider">{label}</label>
      <div className="flex items-center bg-uber-card rounded-xl border border-uber-border focus-within:border-white/40 transition-all overflow-hidden">
        <input
          type="number" inputMode="decimal"
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-4 py-4 text-white text-2xl outline-none placeholder-zinc-700 font-bold"
        />
        {suffix && <span className="pr-4 text-uber-muted text-sm font-medium">{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] text-uber-green mt-1.5 pl-1 font-medium">{hint}</p>}
    </div>
  )
}
