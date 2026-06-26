import { useState, useEffect } from 'react'
import { saveRide, getRidesByDate } from '../lib/db'

const MILES_MULTIPLIER = 1.40

// Session surplus: sum of (offered - minWithMargin) for today's accepted rides
async function loadSurplus() {
  const today = new Date().toISOString().slice(0, 10)
  const rides = await getRidesByDate(today)
  return rides
    .filter(r => r.decision === 'aceitou')
    .reduce((acc, r) => acc + ((r.offered || 0) - (r.minWithMargin || 0)), 0)
}

function calcMinimum(miles, items, surplus) {
  const adjMiles      = miles * MILES_MULTIPLIER
  const breakeven     = adjMiles * 1.31 + items * 0.6
  const minWithMargin = breakeven * 1.15
  const effectiveMin  = Math.max(minWithMargin * 0.60, minWithMargin - Math.max(0, surplus))
  const boosted       = surplus > 0 && effectiveMin < minWithMargin
  return { adjMiles, minWithMargin, effectiveMin, boosted }
}

export default function Calculator({ costs }) {
  const [miles,   setMiles]   = useState('')
  const [items,   setItems]   = useState('')
  const [store,   setStore]   = useState('')
  const [surplus, setSurplus] = useState(0)
  const [step,    setStep]    = useState('input')   // input | minimum | accepted | done
  const [calc,    setCalc]    = useState(null)
  const [received,setReceived]= useState('')

  const refresh = async () => setSurplus(await loadSurplus())
  useEffect(() => { refresh() }, [])

  const handleCalc = () => {
    const m = parseFloat(miles) || 0
    const i = parseFloat(items) || 0
    if (!m && !i) return
    setCalc(calcMinimum(m, i, surplus))
    setStep('minimum')
  }

  const handleAccepted = () => { setReceived(''); setStep('accepted') }
  const handleRejected = async () => {
    const now = new Date()
    await saveRide({
      timestamp:     now.toISOString(),
      date:          now.toISOString().slice(0, 10),
      miles:         parseFloat(miles) || 0,
      items:         parseFloat(items) || 0,
      store:         store.trim(),
      offered:       null,
      profit:        null,
      minWithMargin: calc.minWithMargin,
      boosted:       false,
      decision:      'rejeitou',
    })
    await refresh()
    setStep('done')
  }

  const handleConfirmAccepted = async () => {
    const offered = parseFloat(received) || 0
    const now     = new Date()
    const { adjMiles, minWithMargin, boosted } = calc
    const rideCost    = adjMiles * costs.totalCostPerMile
    const profit      = offered - rideCost
    const isBoosted   = boosted && offered < minWithMargin

    await saveRide({
      timestamp:     now.toISOString(),
      date:          now.toISOString().slice(0, 10),
      miles:         parseFloat(miles) || 0,
      items:         parseFloat(items) || 0,
      store:         store.trim(),
      offered,
      profit,
      minWithMargin,
      boosted:       isBoosted,
      decision:      'aceitou',
    })
    await refresh()
    setStep('done')
  }

  const reset = () => {
    setMiles(''); setItems(''); setStore('')
    setReceived(''); setCalc(null); setStep('input')
  }

  const milesNum = parseFloat(miles) || 0

  /* ── STEP: input ── */
  if (step === 'input') return (
    <div className="px-5 py-4 space-y-3 pb-6">
      {surplus > 0 && (
        <div className="flex items-center justify-between bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-2.5">
          <span className="text-[12px] text-amber-400 font-semibold flex items-center gap-1.5">🔥 Saldo de sessão</span>
          <span className="text-amber-400 font-black">+${surplus.toFixed(2)}</span>
        </div>
      )}

      <div className="space-y-2">
        {/* Miles */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] text-uber-muted font-semibold uppercase tracking-wider">Milhas</label>
            <span className="text-[11px] text-uber-green font-bold flex items-center gap-1">
              <RouteIcon /> ×{MILES_MULTIPLIER} incluído
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-uber-card rounded-xl border border-uber-border focus-within:border-white/40 transition-all overflow-hidden">
              <input
                type="number" inputMode="decimal"
                value={miles} onChange={e => setMiles(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent px-4 py-4 text-white text-lg outline-none placeholder-zinc-700 font-medium"
                autoFocus
              />
              <span className="pr-4 text-uber-muted text-sm">mi</span>
            </div>
            {milesNum > 0 && (
              <div className="bg-uber-green/10 border border-uber-green/30 rounded-xl px-3 py-4 text-center flex-shrink-0">
                <p className="text-uber-green font-black text-base leading-none">{(milesNum * MILES_MULTIPLIER).toFixed(1)}</p>
                <p className="text-uber-green/60 text-[10px] mt-0.5">mi reais</p>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div>
          <label className="block text-[11px] text-uber-muted mb-1.5 font-semibold uppercase tracking-wider">Itens</label>
          <input
            type="number" inputMode="numeric"
            value={items} onChange={e => setItems(e.target.value)}
            placeholder="0"
            className="w-full bg-uber-card rounded-xl border border-uber-border focus:border-white/40 transition-all px-4 py-4 text-white text-lg outline-none placeholder-zinc-700 font-medium"
          />
        </div>

        {/* Store (optional) */}
        <div>
          <label className="block text-[11px] text-uber-muted mb-1.5 font-semibold uppercase tracking-wider">Mercado (opcional)</label>
          <input
            type="text"
            value={store} onChange={e => setStore(e.target.value)}
            placeholder="Smith's, Target…"
            className="w-full bg-uber-card rounded-xl border border-uber-border focus:border-white/40 transition-all px-4 py-3.5 text-white text-base outline-none placeholder-zinc-700 font-medium"
          />
        </div>
      </div>

      <button
        onClick={handleCalc}
        disabled={!miles && !items}
        className="w-full py-4 bg-white text-black font-bold rounded-xl text-[16px] tracking-wide active:scale-[0.98] transition-all disabled:opacity-30"
      >
        Ver Mínimo
      </button>
    </div>
  )

  /* ── STEP: minimum ── */
  if (step === 'minimum') {
    const { minWithMargin, effectiveMin, boosted, adjMiles } = calc
    const display = boosted ? effectiveMin : minWithMargin

    return (
      <div className="px-5 py-4 space-y-3 pb-6 animate-fade-up">
        {/* Summary chips */}
        <div className="flex gap-2 text-[12px]">
          <span className="bg-uber-card border border-uber-border rounded-lg px-3 py-1.5 text-uber-sub font-medium">{milesNum} mi → {adjMiles.toFixed(1)} mi reais</span>
          <span className="bg-uber-card border border-uber-border rounded-lg px-3 py-1.5 text-uber-sub font-medium">{items || 0} itens</span>
          {store && <span className="bg-uber-card border border-uber-border rounded-lg px-3 py-1.5 text-uber-sub font-medium truncate">{store}</span>}
        </div>

        {/* Minimum card */}
        <div className="bg-uber-surface border border-uber-border rounded-2xl p-6 text-center space-y-1">
          <p className="text-[11px] text-uber-muted font-bold uppercase tracking-[0.2em]">
            {boosted ? 'Mínimo com saldo de sessão' : 'Mínimo para aceitar'}
          </p>
          <p className="text-[64px] font-black text-white leading-none tracking-tight">
            ${display.toFixed(2)}
          </p>
          {boosted && (
            <div className="pt-1 space-y-0.5">
              <p className="text-uber-muted text-xs line-through">${minWithMargin.toFixed(2)} sem saldo</p>
              <p className="text-amber-400 text-xs font-bold flex items-center justify-center gap-1">🔥 Impulsionado pelo saldo de +${surplus.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Decision buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleAccepted}
            className="py-5 bg-uber-green text-black font-black rounded-xl text-base active:scale-95 transition-all"
          >
            Aceitei
          </button>
          <button
            onClick={handleRejected}
            className="py-5 bg-uber-card border border-uber-border text-uber-sub font-bold rounded-xl text-base active:scale-95 transition-all hover:border-white/20"
          >
            Rejeitei
          </button>
        </div>

        <button onClick={reset} className="w-full text-center text-uber-muted text-sm py-2">
          ← Voltar
        </button>
      </div>
    )
  }

  /* ── STEP: accepted — enter actual amount ── */
  if (step === 'accepted') return (
    <div className="px-5 py-4 space-y-4 pb-6 animate-fade-up">
      <div className="bg-uber-surface border border-uber-border rounded-2xl p-5 text-center">
        <p className="text-[11px] text-uber-muted font-bold uppercase tracking-[0.2em] mb-1">Mínimo era</p>
        <p className="text-3xl font-black text-uber-green">${(calc.boosted ? calc.effectiveMin : calc.minWithMargin).toFixed(2)}</p>
      </div>

      <div>
        <label className="block text-[11px] text-uber-muted mb-1.5 font-semibold uppercase tracking-wider">Quanto te pagaram?</label>
        <div className="flex items-center bg-uber-card rounded-xl border border-uber-border focus-within:border-white/40 transition-all overflow-hidden">
          <span className="pl-4 text-uber-sub text-xl font-semibold">$</span>
          <input
            type="number" inputMode="decimal"
            value={received} onChange={e => setReceived(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent px-3 py-4 text-white text-2xl outline-none placeholder-zinc-700 font-bold"
            autoFocus
          />
        </div>
      </div>

      <button
        onClick={handleConfirmAccepted}
        disabled={!received}
        className="w-full py-4 bg-white text-black font-bold rounded-xl text-[16px] tracking-wide active:scale-[0.98] transition-all disabled:opacity-30"
      >
        Confirmar
      </button>

      <button onClick={() => setStep('minimum')} className="w-full text-center text-uber-muted text-sm py-1">
        ← Voltar
      </button>
    </div>
  )

  /* ── STEP: done ── */
  return (
    <div className="px-5 py-4 animate-fade-up">
      <div className="bg-uber-surface border border-uber-border rounded-2xl p-8 text-center space-y-4">
        <p className="text-4xl">✓</p>
        <p className="text-white font-bold text-lg">Corrida registrada</p>
        <button
          onClick={reset}
          className="w-full py-4 bg-white text-black font-bold rounded-xl text-[15px] active:scale-[0.98] transition-all"
        >
          Nova corrida
        </button>
      </div>
    </div>
  )
}

function RouteIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/>
      <path d="M6 17V8a6 6 0 0 1 12 0v8"/>
    </svg>
  )
}
