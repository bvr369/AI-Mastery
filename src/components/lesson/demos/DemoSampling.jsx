import { useMemo, useState } from 'react'
import { Dices, RotateCcw } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * The full sampling pipeline: temperature reshapes, top_p / top_k truncate,
 * then a weighted pick. Sample repeatedly and watch the tally histogram.
 */

const CANDIDATES = [
  { t: 'projects', s: 3.4 },
  { t: 'practice', s: 2.9 },
  { t: 'tutorials', s: 2.2 },
  { t: 'curiosity', s: 1.6 },
  { t: 'coffee', s: 1.0 },
  { t: 'chaos', s: 0.4 },
]

export default function DemoSampling({ onInteract }) {
  const [temp, setTemp] = useState(0.8)
  const [topP, setTopP] = useState(1.0)
  const [topK, setTopK] = useState(6)
  const [tally, setTally] = useState({})
  const [last, setLast] = useState(null)

  const dist = useMemo(() => {
    // 1. temperature: softmax(s / T)
    const exps = CANDIDATES.map((c) => Math.exp(c.s / Math.max(0.05, temp)))
    const sum = exps.reduce((a, b) => a + b, 0)
    let probs = CANDIDATES.map((c, i) => ({ ...c, p: exps[i] / sum, cut: false }))
    // 2. top_k: keep k highest
    probs = probs.map((c, i) => ({ ...c, cut: i >= topK }))
    // 3. top_p: keep smallest set whose cumulative prob >= topP
    let cum = 0
    probs = probs.map((c) => {
      if (c.cut) return c
      if (cum >= topP) return { ...c, cut: true }
      cum += c.p
      return c
    })
    // renormalize over survivors
    const survivors = probs.filter((c) => !c.cut)
    const sSum = survivors.reduce((a, c) => a + c.p, 0)
    return probs.map((c) => ({ ...c, finalP: c.cut ? 0 : c.p / sSum }))
  }, [temp, topP, topK])

  const sample = () => {
    onInteract?.()
    let r = Math.random()
    let pick = dist.find((c) => !c.cut)
    for (const c of dist) {
      if (c.cut) continue
      r -= c.finalP
      if (r <= 0) { pick = c; break }
    }
    setLast(pick.t)
    setTally((t) => ({ ...t, [pick.t]: (t[pick.t] || 0) + 1 }))
  }

  const sample20 = () => { for (let i = 0; i < 20; i++) sample() }
  const reset = () => { setTally({}); setLast(null) }
  const maxTally = Math.max(1, ...Object.values(tally))

  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          ['temperature', temp, 0.05, 2, 0.05, setTemp, temp <= 0.2 ? 'near-greedy' : temp <= 1 ? 'balanced' : 'chaotic'],
          ['top_p', topP, 0.1, 1, 0.05, setTopP, topP < 1 ? `keep top ${Math.round(topP * 100)}% mass` : 'off (keep all)'],
          ['top_k', topK, 1, 6, 1, setTopK, topK < 6 ? `keep ${topK} tokens` : 'off (keep all)'],
        ].map(([name, val, min, max, step, set, note]) => (
          <div key={name} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="flex justify-between text-xs">
              <span className="font-mono font-semibold txt-1">{name}</span>
              <span className="tabular-nums text-brand-500 dark:text-brand-300">{typeof val === 'number' ? val.toFixed(name === 'top_k' ? 0 : 2) : val}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(+e.target.value)} className="mt-1 w-full accent-brand-500" aria-label={name} />
            <div className="text-[10px] txt-3">{note}</div>
          </div>
        ))}
      </div>

      <div className="mb-1 text-xs txt-3">“The best way to learn AI is through ___” — live distribution (grayed = cut by top_p/top_k):</div>
      <div className="space-y-1.5">
        {dist.map((c) => (
          <div key={c.t} className={cn('flex items-center gap-2', c.cut && 'opacity-30')}>
            <span className={cn('w-20 shrink-0 text-right font-mono text-xs', last === c.t ? 'font-bold text-emerald-500' : 'txt-1')}>{c.t}</span>
            <div className="h-4 flex-1 overflow-hidden rounded-md bg-zinc-200/60 dark:bg-zinc-800">
              <div className={cn('h-full rounded-md transition-all duration-300', c.cut ? 'bg-zinc-400/40' : 'bg-gradient-to-r from-brand-500 to-indigo-500')} style={{ width: `${(c.finalP * 100).toFixed(1)}%` }} />
            </div>
            <span className="w-11 text-right text-[10px] tabular-nums txt-3">{c.cut ? 'cut' : `${(c.finalP * 100).toFixed(1)}%`}</span>
            {/* tally dots */}
            <div className="h-4 w-24 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
              <div className="h-full bg-emerald-500/50 transition-all" style={{ width: `${((tally[c.t] || 0) / maxTally) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 pr-0 text-right text-[10px] txt-3">← probabilities · sample tally →</div>

      <div className="mt-3 flex gap-2">
        <button onClick={sample} className="btn-primary px-3 py-1.5 text-xs"><Dices size={13} /> Sample once</button>
        <button onClick={sample20} className="btn-outline px-3 py-1.5 text-xs">Sample ×20</button>
        <button onClick={reset} className="btn-ghost px-2 py-1.5 text-xs"><RotateCcw size={12} /></button>
        <span className="ml-auto chip-zinc">{Object.values(tally).reduce((a, b) => a + b, 0)} samples</span>
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Experiments to run: (1) temp 0.05 → sample ×20 → one bar owns the tally. (2) temp 2 + top_p 1 → even “chaos” gets picks.
        (3) temp 2 + top_p 0.5 → chaos is CUT before sampling — that's why top_p is the safety rail for high temperatures.
      </p>
    </div>
  )
}
