import { useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Four decoding strategies race from the SAME tiny generation tree.
 * Greedy = argmax (deterministic). Beam(2) = max cumulative log-prob.
 * Top-k(2) & Top-p(0.9) = real sampling with cumulative Math.random thresholds.
 * Temperature reshapes every distribution first (logit / T) — Lesson 2.5's knobs.
 */

// prefix (space-joined generated tokens) -> next-token logits. Prompt is "The AI …".
const TREE = {
  '': [{ t: 'wrote', l: 2.4 }, { t: 'ate', l: 1.1 }],
  'wrote': [{ t: 'a', l: 2.2 }, { t: 'bad', l: 1.0 }],
  'ate': [{ t: 'my', l: 2.0 }, { t: 'the', l: 1.2 }],
  'wrote a': [{ t: 'poem', l: 2.3 }, { t: 'bug', l: 1.4 }],
  'wrote bad': [{ t: 'code', l: 2.6 }, { t: 'puns', l: 0.8 }],
  'ate my': [{ t: 'homework', l: 2.4 }, { t: 'socks', l: 1.0 }],
  'ate the': [{ t: 'data', l: 2.1 }, { t: 'cookies', l: 1.3 }],
  'wrote a poem': [{ t: 'about', l: 2.0 }, { t: 'for', l: 1.1 }],
  'wrote a bug': [{ t: 'again', l: 2.2 }, { t: 'somehow', l: 0.9 }],
  'wrote bad code': [{ t: 'fast', l: 2.1 }, { t: 'twice', l: 1.0 }],
  'wrote bad puns': [{ t: 'daily', l: 1.8 }, { t: 'loudly', l: 1.2 }],
  'ate my homework': [{ t: 'twice', l: 2.0 }, { t: 'sadly', l: 1.0 }],
  'ate my socks': [{ t: 'again', l: 1.9 }, { t: 'somehow', l: 1.1 }],
  'ate the data': [{ t: 'whole', l: 2.0 }, { t: 'raw', l: 1.2 }],
  'ate the cookies': [{ t: 'all', l: 2.2 }, { t: 'slowly', l: 0.9 }],
}

// softmax(l / T) over the children of a prefix, sorted by descending probability.
function distOf(prefix, temp) {
  const kids = TREE[prefix]
  if (!kids) return null
  const T = Math.max(0.05, temp)
  const exps = kids.map((k) => Math.exp(k.l / T))
  const sum = exps.reduce((a, b) => a + b, 0)
  return kids.map((k, i) => ({ t: k.t, p: exps[i] / sum })).sort((a, b) => b.p - a.p)
}

// weighted pick over [{t, p}] whose probs sum to 1, using cumulative thresholds.
function pick(items) {
  let r = Math.random()
  for (const it of items) { r -= it.p; if (r <= 0) return it }
  return items[items.length - 1]
}

function runGreedy(temp) {
  const seq = []; let lp = 0
  for (let i = 0; i < 4; i++) {
    const d = distOf(seq.join(' '), temp); if (!d) break
    seq.push(d[0].t); lp += Math.log(d[0].p) // argmax == top of the sorted dist
  }
  return { seq, lp }
}

function runBeam(temp, width = 2) {
  let beams = [{ seq: [], lp: 0 }]
  for (let i = 0; i < 4; i++) {
    const cand = []
    for (const b of beams) {
      const d = distOf(b.seq.join(' '), temp)
      if (!d) { cand.push(b); continue }
      for (const c of d) cand.push({ seq: [...b.seq, c.t], lp: b.lp + Math.log(c.p) })
    }
    cand.sort((a, b) => b.lp - a.lp)
    beams = cand.slice(0, width)
  }
  return { beams, seq: beams[0].seq, lp: beams[0].lp }
}

function runSampled(temp, mode) {
  const seq = []; let lp = 0
  for (let i = 0; i < 4; i++) {
    const d = distOf(seq.join(' '), temp); if (!d) break
    let keep
    if (mode === 'topk') keep = d.slice(0, 2)
    else { keep = []; let cum = 0; for (const c of d) { keep.push(c); cum += c.p; if (cum >= 0.9) break } }
    const norm = keep.reduce((a, c) => a + c.p, 0)
    const chosen = pick(keep.map((c) => ({ ...c, p: c.p / norm })))
    seq.push(chosen.t); lp += Math.log(chosen.p) // score under the true model prob
  }
  return { seq, lp }
}

const PANELS = [
  { key: 'greedy', label: 'Greedy', chip: 'chip-zinc', accent: 'from-zinc-500 to-zinc-400', tag: 'argmax · deterministic' },
  { key: 'beam', label: 'Beam · width 2', chip: 'chip-brand', accent: 'from-brand-500 to-indigo-500', tag: 'max total log-prob' },
  { key: 'topk', label: 'Top-k · k=2', chip: 'chip-green', accent: 'from-emerald-500 to-teal-400', tag: 'sample top 2, renormed' },
  { key: 'topp', label: 'Top-p · 0.9', chip: 'chip-amber', accent: 'from-amber-500 to-orange-400', tag: 'sample 90% mass' },
]

export default function DemoSamplingRace({ onInteract }) {
  const [temp, setTemp] = useState(0.8)
  const [results, setResults] = useState(null)
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)
  const [runs, setRuns] = useState(0)

  const race = () => {
    onInteract?.()
    setResults({
      greedy: runGreedy(temp),
      beam: runBeam(temp),
      topk: runSampled(temp, 'topk'),
      topp: runSampled(temp, 'topp'),
    })
    setRuns((n) => n + 1)
    setRunning(true)
    setStep(0)
    let s = 0
    const tick = () => { s += 1; setStep(s); if (s < 4) setTimeout(tick, 430); else setRunning(false) }
    setTimeout(tick, 300)
  }

  const reset = () => { setResults(null); setStep(0); setRunning(false) }
  const tempNote = temp <= 0.2 ? 'near-greedy' : temp <= 1 ? 'balanced' : 'high — samplers get wild'

  const Sentence = ({ seq, dim }) => (
    <span className="flex flex-wrap items-center gap-1">
      <span className="font-mono text-[11px] italic txt-3">The AI</span>
      {seq.slice(0, step).map((t, i) => (
        <span key={i} className={cn('rounded-md border px-1.5 py-0.5 font-mono text-[11px] animate-fade-up', dim
          ? 'border-zinc-300 txt-2 dark:border-zinc-700'
          : 'border-brand-500/40 bg-brand-500/10 text-brand-700 dark:text-brand-300')}>{t}</span>
      ))}
      {running && step < 4 && <span className="h-3 w-1 animate-pulse rounded bg-brand-400" />}
    </span>
  )

  return (
    <div>
      <div className="mb-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex justify-between text-xs">
          <span className="font-mono font-semibold txt-1">temperature</span>
          <span className="tabular-nums text-brand-500 dark:text-brand-300">{temp.toFixed(2)}</span>
        </div>
        <input type="range" min={0} max={2} step={0.05} value={temp} onChange={(e) => setTemp(+e.target.value)} className="mt-1 w-full accent-brand-500" aria-label="temperature" />
        <div className="text-[10px] txt-3">{tempNote} — reshapes every distribution (logit / T) before any pick</div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <button onClick={race} disabled={running} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50"><Play size={13} /> {results ? 'Race again' : 'Race'}</button>
        <button onClick={reset} className="btn-ghost px-2 py-1.5 text-xs" aria-label="reset"><RotateCcw size={12} /></button>
        {runs > 0 && <span className="ml-auto chip-zinc">run #{runs}</span>}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {PANELS.map((panel) => {
          const r = results?.[panel.key]
          const stable = panel.key === 'greedy' || panel.key === 'beam'
          return (
            <div key={panel.key} className="card p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className={panel.chip}>{panel.label}</span>
                <span className="text-[10px] txt-3">{panel.tag}</span>
              </div>
              <div className={cn('h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800')}>
                <div className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-300', panel.accent)} style={{ width: `${(step / 4) * 100}%` }} />
              </div>

              <div className="mt-2 min-h-[46px]">
                {r ? (
                  panel.key === 'beam' ? (
                    <div className="space-y-1">
                      {r.beams.map((b, i) => (
                        <div key={i} className={cn('flex items-start justify-between gap-2 rounded-md px-1 py-0.5', i === 0 && 'bg-brand-500/5')}>
                          <Sentence seq={b.seq} dim={i !== 0} />
                          <span className="shrink-0 pt-0.5 font-mono text-[10px] tabular-nums txt-3">{b.lp.toFixed(2)}{i === 0 && ' ★'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <Sentence seq={r.seq} dim={panel.key === 'greedy'} />
                      <span className="shrink-0 pt-0.5 font-mono text-[10px] tabular-nums txt-3">{step >= 4 ? r.lp.toFixed(2) : ''}</span>
                    </div>
                  )
                ) : (
                  <span className="text-xs italic txt-3">press Race…</span>
                )}
              </div>

              {r && step >= 4 && (
                <div className="mt-1.5 text-[10px] txt-3">{stable ? 'stable across runs' : 'varies run to run'}</div>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Same distributions, four sequences. <span className="txt-2">Greedy</span> is deterministic but bland and prone to loops.
        <span className="txt-2"> Beam</span> maximizes total sequence log-prob (great for translation, dull for creativity) — notice both
        strategies repeat every run. <span className="txt-2">Top-k</span> and <span className="txt-2">top-p</span> inject controlled
        randomness, so they wander — raise the temperature and watch them diverge. That is exactly what the
        <span className="font-mono text-brand-500 dark:text-brand-300"> temperature</span> / <span className="font-mono text-brand-500 dark:text-brand-300">top_p</span> API knobs do under the hood (Lesson 2.5).
      </p>
    </div>
  )
}
