import { useState, useEffect } from 'react'
import { saveRide, getRidesByDate } from '../lib/db'

const MILES_MULTIPLIER = 1.35

/*
 * Verdict scale — based on effective ratio (after session boost)
 *
 * POSITIVE  ≥ 1.00  ACEITAR / BOA CORRIDA / EXCELENTE / INCRÍVEL
 * NEGATIVE  < 1.00  RECUSE / RUIM / MUITO RUIM / PÉSSIMO
 */
function getVerdict(ratio) {
  if (ratio >= 1.70) return { label: 'INCRÍVEL',    sub: 'Oferta excepcional — não perca',   accept: true,  tier: 4 }
  if (ratio >= 1.45) return { label: 'EXCELENTE',   sub: 'Vale muito a pena aceitar',         accept: true,  tier: 3 }
  if (ratio >= 1.20) return { label: 'BOA CORRIDA', sub: 'Boa relação custo-benefício',       accept: true,  tier: 2 }
  if (ratio >= 1.00) return { label: 'ACEITAR',     sub: 'Cobre o mínimo recomendado',        accept: true,  tier: 1 }
  if (ratio >= 0.90) return { label: 'RECUSE',      sub: 'Próximo do limite, mas não chega',  accept: false, tier: 1 }
  if (ratio >= 0.75) return { label: 'RUIM',        sub: 'Abaixo do mínimo necessário',       accept: false, tier: 2 }
  if (ratio >= 0.55) return { label: 'MUITO RUIM',  sub: 'Vai sair no prejuízo',              accept: false, tier: 3 }
  return                    { label: 'PÉSSIMO',     sub: 'Não cobre nem o combustível',       accept: false, tier: 4 }
}

const POSITIVE_COLORS = {
  1: { bg: '#06C167', text: '#000', glow: 'rgba(6,193,103,0.3)'   },
  2: { bg: '#06C167', text: '#000', glow: 'rgba(6,193,103,0.35)'  },
  3: { bg: '#00E676', text: '#000', glow: 'rgba(0,230,118,0.4)'   },
  4: { bg: '#00FF94', text: '#000', glow: 'rgba(0,255,148,0.45)'  },
}
const NEGATIVE_COLORS = {
  1: { bg: '#FF6B35', text: '#fff', glow: 'rgba(255,107,53,0.35)' },
  2: { bg: '#E8413E', text: '#fff', glow: 'rgba(232,65,62,0.35)'  },
  3: { bg: '#C62828', text: '#fff', glow: 'rgba(198,40,40,0.4)'   },
  4: { bg: '#7B0000', text: '#fff', glow: 'rgba(123,0,0,0.5)'     },
}
// Boosted rides get an amber card
const BOOSTED_COLORS = { bg: '#B45309', text: '#fff', glow: 'rgba(180,83,9,0.4)' }

export default function Calculator({ costs }) {
  const [form, setForm]               = useState({ offered: '', miles: '', items: '', extraMiles: '', store: '' })
  const [result, setResult]           = useState(null)
  const [saved,  setSaved]            = useState(null)
  const [sessionSurplus, setSession]  = useState(0)

  // Load today's accepted rides and compute the running surplus
  const refreshSession = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const rides = await getRidesByDate(today)
    const surplus = rides
      .filter(r => r.decision === 'aceitou')
      .reduce((acc, r) => acc + ((r.offered || 0) - (r.minWithMargin || 0)), 0)
    setSession(surplus)
  }

  useEffect(() => { refreshSession() }, [])

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setResult(null); setSaved(null) }

  const calculate = () => {
    const offered    = parseFloat(form.offered)    || 0
    const miles      = parseFloat(form.miles)      || 0
    const items      = parseFloat(form.items)      || 0
    const extra      = parseFloat(form.extraMiles) || 0
    const adjMiles   = miles * MILES_MULTIPLIER
    const totalMiles = adjMiles + extra

    const rideCost      = totalMiles * costs.totalCostPerMile
    const breakeven     = totalMiles * 1.31 + items * 0.6
    const minWithMargin = breakeven * 1.15
    const rawRatio      = minWithMargin > 0 ? offered / minWithMargin : 0

    // Session boost: surplus from good rides lowers effective minimum
    // Floor: effective min can't drop below 60% of the real minimum
    const surplus       = Math.max(0, sessionSurplus)
    const effectiveMin  = Math.max(minWithMargin * 0.60, minWithMargin - surplus)
    const effectiveRatio= effectiveMin > 0 ? offered / effectiveMin : rawRatio

    // A ride is "boosted" if it fails the raw check but passes with session surplus
    const boosted       = offered < minWithMargin && offered >= effectiveMin && surplus > 0

    const verdict       = getVerdict(effectiveRatio)
    const netAfterCost  = offered - rideCost
    const deficit       = minWithMargin - offered  // how much surplus this ride costs

    setResult({
      offered, miles, adjMiles, items, extra, totalMiles,
      rideCost, minWithMargin, effectiveMin, rawRatio, effectiveRatio,
      verdict, netAfterCost, boosted,
      sessionSurplus: surplus,
      surplusAfter: boosted ? surplus - deficit : surplus,
    })
    setSaved(null)
  }

  const handleDecision = async (decision) => {
    if (!result) return
    const now = new Date()
    await saveRide({
      timestamp:     now.toISOString(),
      date:          now.toISOString().slice(0, 10),
      offered:       result.offered,
      miles:         result.miles,
      items:         result.items,
      extraMiles:    result.extra,
      store:         form.store.trim(),
      profit:        result.netAfterCost,
      minWithMargin: result.minWithMargin,
      boosted:       result.boosted,
      decision,
    })
    await refreshSession()
    setSaved(decision)
  }

  const reset = () => {
    setForm({ offered: '', miles: '', items: '', extraMiles: '', store: '' })
    setResult(null)
    setSaved(null)
  }

  const milesNum = parseFloat(form.miles) || 0

  return (
    <div className="px-5 py-4 space-y-3 pb-6">

      {/* Session surplus pill */}
      {sessionSurplus !== 0 && (
        <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 border ${
          sessionSurplus > 0
            ? 'bg-amber-900/20 border-amber-700/40'
            : 'bg-red-900/20 border-red-800/40'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">🔥</span>
            <span className="text-[12px] text-amber-400 font-semibold">Saldo de sessão</span>
          </div>
          <span className={`font-black text-base ${sessionSurplus > 0 ? 'text-amber-400' : 'text-red-400'}`}>
            {sessionSurplus > 0 ? '+' : ''}${sessionSurplus.toFixed(2)}
          </span>
        </div>
      )}

      {/* Inputs */}
      <div className="space-y-2">
        <InputField label="Valor Oferecido" prefix="$" value={form.offered} onChange={v => set('offered', v)} placeholder="0.00" type="number" />

        {/* Miles with multiplier preview */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] text-uber-muted font-semibold uppercase tracking-wider">Milhas</label>
            <span className="text-[11px] text-uber-green font-bold flex items-center gap-1">
              <RouteIcon />
              ×{MILES_MULTIPLIER} retorno incluído
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-uber-card rounded-xl border border-uber-border focus-within:border-white/40 transition-all overflow-hidden">
              <input
                type="number" inputMode="decimal"
                value={form.miles}
                onChange={e => set('miles', e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent px-4 py-3.5 text-white text-base outline-none placeholder-zinc-700 font-medium"
              />
              <span className="pr-4 text-uber-muted text-sm font-medium">mi</span>
            </div>
            {milesNum > 0 && (
              <div className="flex items-center gap-1 bg-uber-green/10 border border-uber-green/30 rounded-xl px-3 py-3.5 flex-shrink-0">
                <span className="text-uber-green font-black text-base">{(milesNum * MILES_MULTIPLIER).toFixed(1)}</span>
                <span className="text-uber-green/70 text-xs">mi reais</span>
              </div>
            )}
          </div>
          {milesNum > 0 && (
            <p className="text-[11px] text-zinc-600 mt-1.5 pl-1">
              {milesNum.toFixed(1)} mi × {MILES_MULTIPLIER} = {(milesNum * MILES_MULTIPLIER).toFixed(1)} mi
            </p>
          )}
        </div>

        <InputField label="Itens" value={form.items} onChange={v => set('items', v)} placeholder="0" type="number" />
        <InputField label="Deslocamento extra até a loja (opcional)" suffix="mi" value={form.extraMiles} onChange={v => set('extraMiles', v)} placeholder="0.0" type="number" />
        <InputField label="Mercado (opcional)" value={form.store} onChange={v => set('store', v)} placeholder="Smith's, Target…" type="text" />
      </div>

      <button
        onClick={calculate}
        className="w-full py-4 bg-white text-black font-bold rounded-xl text-[15px] tracking-wide active:scale-[0.98] transition-all"
      >
        Calcular
      </button>

      {result && !saved && <VerdictCard result={result} onDecision={handleDecision} />}

      {saved && (
        <div className="bg-uber-card rounded-2xl p-5 text-center space-y-3 animate-scale-in">
          <p className="text-white font-bold text-base">
            {saved === 'aceitou' ? 'Registrado como aceita ✓' : 'Registrado como rejeitada ✕'}
          </p>
          <button onClick={reset} className="px-6 py-2.5 bg-uber-border text-white rounded-xl text-sm font-semibold hover:bg-zinc-700 transition-colors">
            Nova corrida
          </button>
        </div>
      )}
    </div>
  )
}

function VerdictCard({ result, onDecision }) {
  const { verdict, effectiveRatio, boosted, sessionSurplus, surplusAfter, minWithMargin, offered } = result
  const colors = boosted
    ? BOOSTED_COLORS
    : verdict.accept
    ? POSITIVE_COLORS[verdict.tier]
    : NEGATIVE_COLORS[verdict.tier]

  const deficit = minWithMargin - offered

  return (
    <div className="space-y-3 animate-scale-in">
      <div
        className="rounded-2xl px-6 pt-6 pb-5 text-center flex flex-col items-center gap-2"
        style={{ backgroundColor: colors.bg, boxShadow: `0 0 40px ${colors.glow}` }}
      >
        {/* Boosted badge */}
        {boosted && (
          <div className="flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1 mb-1">
            <span className="text-sm">🔥</span>
            <span className="text-[12px] font-black text-white tracking-wide uppercase">Impulsionado</span>
          </div>
        )}

        <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-70" style={{ color: colors.text }}>
          {verdict.accept ? 'ACEITAR CORRIDA' : 'REJEITAR CORRIDA'}
        </p>
        <p className="text-5xl font-black tracking-tight leading-none" style={{ color: colors.text }}>
          {verdict.label}
        </p>
        <p className="text-sm font-medium mt-0.5 opacity-75" style={{ color: colors.text }}>
          {boosted ? `Saldo cobre o déficit de $${deficit.toFixed(2)}` : verdict.sub}
        </p>

        {/* Boosted surplus flow */}
        {boosted && (
          <div className="w-full mt-3 bg-black/20 rounded-xl px-4 py-3 space-y-1 text-left">
            <div className="flex justify-between text-xs font-semibold opacity-80" style={{ color: colors.text }}>
              <span>Saldo antes</span>
              <span>+${sessionSurplus.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold opacity-80" style={{ color: colors.text }}>
              <span>Déficit desta corrida</span>
              <span>−${deficit.toFixed(2)}</span>
            </div>
            <div className="border-t border-white/20 pt-1 flex justify-between text-xs font-black" style={{ color: colors.text }}>
              <span>Saldo após aceitar</span>
              <span>{surplusAfter >= 0 ? '+' : ''}${surplusAfter.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="w-full mt-3">
          <RatioBar ratio={effectiveRatio} barColor={colors.text} boosted={boosted} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onDecision('aceitou')}
          className="py-4 bg-uber-card border border-uber-border text-white font-bold rounded-xl text-sm active:scale-95 transition-all hover:border-white/30"
        >
          Aceitei
        </button>
        <button
          onClick={() => onDecision('rejeitou')}
          className="py-4 bg-uber-card border border-uber-border text-uber-sub font-bold rounded-xl text-sm active:scale-95 transition-all hover:border-white/20"
        >
          Rejeitei
        </button>
      </div>
    </div>
  )
}

function RatioBar({ ratio, barColor, boosted }) {
  const pct = Math.min(100, (ratio / 2) * 100)
  return (
    <div className="space-y-1.5">
      <div className="relative w-full h-1.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full" style={{ left: '50%', backgroundColor: 'rgba(0,0,0,0.4)' }} />
        <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: 'rgba(0,0,0,0.4)' }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all duration-700"
          style={{ left: `calc(${Math.min(96, pct)}% - 6px)`, backgroundColor: boosted ? '#FCD34D' : barColor, borderColor: 'rgba(0,0,0,0.3)' }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-semibold opacity-60" style={{ color: barColor }}>
        <span>Mínimo</span>
        <span>{Math.round(ratio * 100)}%{boosted ? ' (com saldo)' : ''}</span>
        <span>200%</span>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, type, prefix, suffix }) {
  return (
    <div>
      <label className="block text-[11px] text-uber-muted mb-1.5 font-semibold uppercase tracking-wider">{label}</label>
      <div className="flex items-center bg-uber-card rounded-xl border border-uber-border focus-within:border-white/40 transition-all overflow-hidden">
        {prefix && <span className="pl-4 text-uber-sub text-base">{prefix}</span>}
        <input
          type={type} inputMode={type === 'number' ? 'decimal' : 'text'}
          value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 bg-transparent px-4 py-3.5 text-white text-base outline-none placeholder-zinc-700 font-medium"
        />
        {suffix && <span className="pr-4 text-uber-muted text-sm font-medium">{suffix}</span>}
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
