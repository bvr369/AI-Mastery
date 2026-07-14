import { useEffect, useRef, useState } from 'react'
import { Dices, Play, RotateCcw } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * A toy next-token predictor with a REAL softmax + temperature.
 * Candidate scores are canned; the probability math is genuine.
 */

const SCENARIOS = [
  {
    start: ['The', 'best', 'way', 'to', 'learn', 'programming', 'is'],
    steps: [
      [{ t: 'by', s: 3.2 }, { t: 'to', s: 2.9 }, { t: 'through', s: 2.1 }, { t: 'obviously', s: 0.4 }],
      [{ t: 'building', s: 3.4 }, { t: 'writing', s: 2.6 }, { t: 'breaking', s: 1.5 }, { t: 'dreaming', s: 0.3 }],
      [{ t: 'real', s: 3.0 }, { t: 'small', s: 2.8 }, { t: 'weird', s: 1.2 }, { t: 'gigantic', s: 0.6 }],
      [{ t: 'projects', s: 3.6 }, { t: 'apps', s: 2.7 }, { t: 'things', s: 2.0 }, { t: 'sandwiches', s: 0.2 }],
      [{ t: '.', s: 3.1 }, { t: 'daily', s: 2.2 }, { t: 'together', s: 1.6 }, { t: 'forever', s: 0.8 }],
    ],
  },
  {
    start: ['Once', 'upon', 'a', 'time,', 'a', 'robot'],
    steps: [
      [{ t: 'learned', s: 3.1 }, { t: 'wanted', s: 2.7 }, { t: 'refused', s: 1.6 }, { t: 'exploded', s: 0.5 }],
      [{ t: 'to', s: 3.8 }, { t: 'how', s: 2.0 }, { t: 'about', s: 1.1 }, { t: 'nothing', s: 0.3 }],
      [{ t: 'dream', s: 2.9 }, { t: 'code', s: 2.8 }, { t: 'dance', s: 2.2 }, { t: 'taxes', s: 0.3 }],
      [{ t: 'in', s: 2.8 }, { t: 'about', s: 2.5 }, { t: 'loudly', s: 1.3 }, { t: 'backwards', s: 0.7 }],
      [{ t: 'color.', s: 2.9 }, { t: 'binary.', s: 2.6 }, { t: 'secret.', s: 1.4 }, { t: 'spreadsheets.', s: 0.9 }],
    ],
  },
]

const softmax = (scores, temp) => {
  const t = Math.max(0.05, temp)
  const exps = scores.map((s) => Math.exp(s / t))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

export default function DemoNextToken({ onInteract }) {
  const [scenario, setScenario] = useState(0)
  const [temp, setTemp] = useState(0.7)
  const [generated, setGenerated] = useState([]) // [{t, p}]
  const [auto, setAuto] = useState(false)
  const autoRef = useRef(null)

  const data = SCENARIOS[scenario]
  const step = generated.length
  const finished = step >= data.steps.length
  const candidates = finished ? [] : data.steps[step]
  const probs = finished ? [] : softmax(candidates.map((c) => c.s), temp)

  const sample = () => {
    onInteract?.()
    if (finished) return
    const r = Math.random()
    let acc = 0
    let pick = 0
    for (let i = 0; i < probs.length; i++) {
      acc += probs[i]
      if (r <= acc) { pick = i; break }
      pick = i
    }
    setGenerated((g) => [...g, { t: candidates[pick].t, p: probs[pick] }])
  }

  // auto-write loop
  useEffect(() => {
    if (!auto) return
    if (finished) { setAuto(false); return }
    autoRef.current = setTimeout(sample, 650)
    return () => clearTimeout(autoRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, generated])

  const reset = (idx = scenario) => {
    setAuto(false)
    setScenario(idx)
    setGenerated([])
  }

  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide txt-3">1 · Pick a sentence start</div>
      <div className="mb-4 flex flex-wrap gap-2">
        {SCENARIOS.map((s, i) => (
          <button
            key={i}
            onClick={() => reset(i)}
            className={cn(
              'rounded-xl border px-3 py-1.5 font-mono text-xs transition-all',
              i === scenario ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700'
            )}
          >
            {s.start.slice(0, 4).join(' ')}…
          </button>
        ))}
      </div>

      {/* the growing sentence */}
      <div className="mb-4 flex min-h-[58px] flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/50">
        {data.start.map((t, i) => (
          <span key={`s${i}`} className="rounded-lg bg-zinc-200/70 px-2 py-1 font-mono text-xs txt-1 dark:bg-zinc-800">{t}</span>
        ))}
        {generated.map((g, i) => (
          <span
            key={`g${i}`}
            title={`sampled with ${(g.p * 100).toFixed(0)}% probability`}
            className="animate-pop-in rounded-lg bg-emerald-500/15 px-2 py-1 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400"
          >
            {g.t}
          </span>
        ))}
        {!finished && <span className="h-5 w-[8px] animate-pulse-soft rounded-sm bg-brand-500" />}
      </div>

      {/* temperature */}
      <div className="mb-4 rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800">
        <div className="mb-2 flex items-center justify-between text-xs font-medium">
          <span className="txt-2">2 · Temperature: <strong className="text-brand-500 dark:text-brand-300">{temp.toFixed(2)}</strong></span>
          <span className="txt-3">{temp <= 0.2 ? 'near-greedy: top token almost always wins' : temp <= 0.9 ? 'balanced' : 'chaotic: unlikely tokens get real chances'}</span>
        </div>
        <input
          type="range" min="0.05" max="2" step="0.05" value={temp}
          onChange={(e) => setTemp(parseFloat(e.target.value))}
          className="w-full accent-brand-500"
          aria-label="Temperature"
        />
      </div>

      {/* live probability bars */}
      <div className="mb-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide txt-3">3 · Probability of each next token (live softmax)</div>
        {finished ? (
          <div className="rounded-xl bg-emerald-500/10 p-3 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Sentence complete! Reset and try a different temperature — you'll likely get a different sentence.
          </div>
        ) : (
          <div className="space-y-1.5">
            {candidates.map((c, i) => (
              <div key={c.t} className="flex items-center gap-2">
                <span className="w-24 shrink-0 truncate text-right font-mono text-xs txt-1">{c.t}</span>
                <div className="h-5 flex-1 overflow-hidden rounded-lg bg-zinc-200/60 dark:bg-zinc-800">
                  <div
                    className={cn('h-full rounded-lg transition-all duration-300', i === 0 ? 'bg-gradient-to-r from-brand-500 to-indigo-500' : 'bg-brand-500/40')}
                    style={{ width: `${(probs[i] * 100).toFixed(1)}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-xs tabular-nums txt-3">{(probs[i] * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={sample} disabled={finished || auto} className="btn-primary">
          <Dices size={15} /> Sample next token
        </button>
        <button onClick={() => { onInteract?.(); setAuto(true) }} disabled={finished || auto} className="btn-outline">
          <Play size={14} /> Auto-write
        </button>
        <button onClick={() => reset()} className="btn-ghost">
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        The candidate words are canned, but the math is real: scores → <code className="inline-code">softmax(score / temperature)</code> → weighted random pick.
        Drag the slider and watch probability mass shift between tokens.
      </p>
    </div>
  )
}
