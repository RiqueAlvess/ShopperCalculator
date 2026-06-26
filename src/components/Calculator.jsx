import { useState } from 'react'
import { saveRide } from '../lib/db'

/*
 * Verdict scale — based on offer / minWithMargin ratio
 *
 * POSITIVE (aceitar)
 *   INCRÍVEL   ≥ 170%  — muito acima do mínimo
 *   EXCELENTE  ≥ 145%
 *   BOA        ≥ 120%
 *   OK         ≥ 100%  — atinge o mínimo
 *
 * NEGATIVE (rejeitar)
 *   RECUSE     90–99%  — quase lá, mas não chega
 *   RUIM       75–89%
 *   MUITO RUIM 55–74%
 *   PÉSSIMO     < 55%  — nem cobre o combustível
 */
function getVerdict(ratio) {
  if (ratio >= 1.70) return { label: 'INCRÍVEL',   sub: 'Oferta excepcional — não perca',    accept: true,  tier: 4 }
  if (ratio >= 1.45) return { label: 'EXCELENTE',  sub: 'Vale muito a pena aceitar',          accept: true,  tier: 3 }
  if (ratio >= 1.20) return { label: 'BOA CORRIDA',sub: 'Boa relação custo-benefício',        accept: true,  tier: 2 }
  if (ratio >= 1.00) return { label: 'ACEITAR',    sub: 'Cobre o mínimo recomendado',         accept: true,  tier: 1 }
  if (ratio >= 0.90) return { label: 'RECUSE',     sub: 'Próximo do limite, mas não chega',   accept: false, tier: 1 }
  if (ratio >= 0.75) return { label: 'RUIM',       sub: 'Abaixo do mínimo necessário',        accept: false, tier: 2 }
  if (ratio >= 0.55) return { label: 'MUITO RUIM', sub: 'Vai sair no prejuízo',               accept: false, tier: 3 }
  return                    { label: 'PÉSSIMO',    sub: 'Não cobre nem o combustível',        accept: false, tier: 4 }
}

/* Color tokens per verdict */
const POSITIVE_COLORS = {
  1: { bg: '#06C167', text: '#000', glow: 'rgba(6,193,103,0.3)' },
  2: { bg: '#06C167', text: '#000', glow: 'rgba(6,193,103,0.35)' },
  3: { bg: '#00E676', text: '#000', glow: 'rgba(0,230,118,0.4)' },
  4: { bg: '#00FF94', text: '#000', glow: 'rgba(0,255,148,0.45)' },
}
const NEGATIVE_COLORS = {
  1: { bg: '#FF6B35', text: '#fff', glow: 'rgba(255,107,53,0.35)' },
  2: { bg: '#E8413E', text: '#fff', glow: 'rgba(232,65,62,0.35)' },
  3: { bg: '#C62828', text: '#fff', glow: 'rgba(198,40,40,0.4)' },
  4: { bg: '#7B0000', text: '#fff', glow: 'rgba(123,0,0,0.5)' },
}

export default function Calculator({ costs }) {
  const [form, setForm] = useState({ offered: '', miles: '', items: '', extraMiles: '', store: '' })
  const [result, setResult] = useState(null)
  const [saved, setSaved]   = useState(null)

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setResult(null); setSaved(null) }

  const calculate = () => {
    const offered    = parseFloat(form.offered)    || 0
    const miles      = parseFloat(form.miles)      || 0
    const items      = parseFloat(form.items)      || 0
    const extra        = parseFloat(form.extraMiles) || 0
    // Miles are doubled to account for the return trip the app doesn't show
    const milesRounded = miles * 2
    const totalMiles   = milesRounded + extra

    const rideCost      = totalMiles * costs.totalCostPerMile
    const breakeven     = totalMiles * 1.31 + items * 0.6
    const minWithMargin = breakeven * 1.15
    const ratio         = minWithMargin > 0 ? offered / minWithMargin : 0
    const verdict       = getVerdict(ratio)
    const netAfterCost  = offered - rideCost

    setResult({ offered, miles, milesRounded, items, extra, totalMiles, rideCost, minWithMargin, ratio, verdict, netAfterCost })
    setSaved(null)
  }

  const handleDecision = async (decision) => {
    if (!result) return
    const now  = new Date()
    await saveRide({
      timestamp:  now.toISOString(),
      date:       now.toISOString().slice(0, 10),
      offered:    result.offered,
      miles:      result.miles,
      items:      result.items,
      extraMiles: result.extra,
      store:      form.store.trim(),
      profit:     result.netAfterCost,
      decision,
    })
    setSaved(decision)
  }

  const reset = () => {
    setForm({ offered: '', miles: '', items: '', extraMiles: '', store: '' })
    setResult(null)
    setSaved(null)
  }

  return (
    <div className="px-5 py-4 space-y-3 pb-6">
      {/* Inputs */}
      <div className="space-y-2">
        <InputField label="Valor Oferecido" prefix="$" value={form.offered} onChange={(v) => set('offered', v)} placeholder="0.00" type="number" />

        {/* Miles field with round-trip indicator */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] text-uber-muted font-semibold uppercase tracking-wider">Milhas</label>
            <span className="text-[11px] text-uber-green font-bold flex items-center gap-1">
              <RouteIcon />
              Ida + volta calculadas automaticamente
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-uber-card rounded-xl border border-uber-border focus-within:border-white/40 transition-all overflow-hidden">
              <input
                type="number"
                inputMode="decimal"
                value={form.miles}
                onChange={(e) => set('miles', e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent px-4 py-3.5 text-white text-base outline-none placeholder-zinc-700 font-medium"
              />
              <span className="pr-4 text-uber-muted text-sm font-medium">mi</span>
            </div>
            {form.miles > 0 && (
              <div className="flex items-center gap-1 bg-uber-green/10 border border-uber-green/30 rounded-xl px-3 py-3.5 flex-shrink-0">
                <span className="text-uber-green font-black text-base">{(parseFloat(form.miles)*2).toFixed(1)}</span>
                <span className="text-uber-green/70 text-xs font-medium">mi reais</span>
              </div>
            )}
          </div>
          {form.miles > 0 && (
            <p className="text-[11px] text-zinc-600 mt-1.5 pl-1">
              {parseFloat(form.miles).toFixed(1)} mi × 2 = {(parseFloat(form.miles)*2).toFixed(1)} mi (ida e volta)
            </p>
          )}
        </div>

        <InputField label="Itens" value={form.items} onChange={(v) => set('items', v)} placeholder="0" type="number" />
        <InputField label="Deslocamento extra até a loja (opcional)" suffix="mi" value={form.extraMiles} onChange={(v) => set('extraMiles', v)} placeholder="0.0" type="number" />
        <InputField label="Mercado (opcional)" value={form.store} onChange={(v) => set('store', v)} placeholder="Smith's, Target…" type="text" />
      </div>

      <button
        onClick={calculate}
        className="w-full py-4 bg-white text-black font-bold rounded-xl text-[15px] tracking-wide active:scale-[0.98] transition-all"
      >
        Calcular
      </button>

      {/* Verdict */}
      {result && !saved && (
        <VerdictCard result={result} onDecision={handleDecision} />
      )}

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
  const { verdict, ratio } = result
  const colors = verdict.accept
    ? POSITIVE_COLORS[verdict.tier]
    : NEGATIVE_COLORS[verdict.tier]

  return (
    <div className="space-y-3 animate-scale-in">
      {/* Main verdict block */}
      <div
        className="rounded-2xl p-8 text-center flex flex-col items-center gap-2"
        style={{ backgroundColor: colors.bg, boxShadow: `0 0 40px ${colors.glow}` }}
      >
        <p
          className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-70"
          style={{ color: colors.text }}
        >
          {verdict.accept ? 'ACEITAR CORRIDA' : 'REJEITAR CORRIDA'}
        </p>
        <p
          className="text-5xl font-black tracking-tight leading-none"
          style={{ color: colors.text }}
        >
          {verdict.label}
        </p>
        <p
          className="text-sm font-medium mt-1 opacity-75"
          style={{ color: colors.text }}
        >
          {verdict.sub}
        </p>

        {/* Ratio bar */}
        <div className="w-full mt-4">
          <RatioBar ratio={ratio} accept={verdict.accept} barColor={colors.text} />
        </div>
      </div>

      {/* Action buttons */}
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

function RatioBar({ ratio, accept, barColor }) {
  // Visual bar capped at 200% for display
  const pct = Math.min(100, (ratio / 2) * 100)
  const midPct = 50 // 100% = middle of bar

  return (
    <div className="space-y-1.5">
      <div className="relative w-full h-1.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
        {/* midpoint marker */}
        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full" style={{ left: `${midPct}%`, backgroundColor: 'rgba(0,0,0,0.4)' }} />
        {/* fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: 'rgba(0,0,0,0.5)' }}
        />
        {/* cursor */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all duration-700"
          style={{ left: `calc(${Math.min(96, pct)}% - 6px)`, backgroundColor: barColor, borderColor: 'rgba(0,0,0,0.3)' }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-semibold opacity-60" style={{ color: barColor }}>
        <span>Mínimo</span>
        <span>{Math.round(ratio * 100)}% do mín.</span>
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
          type={type}
          inputMode={type === 'number' ? 'decimal' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
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
