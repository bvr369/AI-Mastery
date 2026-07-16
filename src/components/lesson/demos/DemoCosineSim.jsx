import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Cosine similarity, made geometric. Eight short sentences carry hand-tuned 4-dim
 * "topic" vectors [tech, animal, food, finance]. Pick sentence A and B and see the
 * REAL cosine = dot / (|A||B|) with every intermediate term, plus two arrows drawn
 * at the true angle arccos(sim) — aligned arrows literally mean similar meaning.
 */

const DIMS = ['tech', 'animal', 'food', 'finance']

// non-negative topic weights → dot ≥ 0, so cosine lands in [0, 1] (angle 0–90°).
const SENTS = [
  { t: 'I trained a neural network on the GPUs.', v: [5, 0, 0, 0] },
  { t: 'The deep-learning model overfit the data.', v: [4, 1, 0, 0] },
  { t: 'My cat napped on the warm laptop.', v: [2, 4, 0, 0] },
  { t: 'The puppy chased its tail all day.', v: [0, 5, 0, 0] },
  { t: 'We baked fresh sourdough bread today.', v: [0, 0, 5, 0] },
  { t: 'She grilled the vegetables for dinner.', v: [0, 1, 4, 0] },
  { t: 'The stock market rallied on earnings.', v: [0, 0, 0, 5] },
  { t: 'Investors bought shares before the close.', v: [1, 0, 0, 4] },
]

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const mag = (a) => Math.sqrt(dot(a, a))
const cosine = (a, b) => {
  const na = mag(a), nb = mag(b)
  return na && nb ? dot(a, b) / (na * nb) : 0
}

// verdict buckets over the full [-1, 1] range so the scale teaches the whole story.
const VERDICTS = [
  { min: 0.8, label: 'very similar', chip: 'chip-green' },
  { min: 0.45, label: 'somewhat related', chip: 'chip-brand' },
  { min: 0.15, label: 'weakly related', chip: 'chip-amber' },
  { min: -0.15, label: 'unrelated', chip: 'chip-zinc' },
  { min: -1.01, label: 'opposite', chip: 'chip-rose' },
]
const verdictOf = (s) => VERDICTS.find((v) => s >= v.min)

const fmtVec = (v) => `[${v.join(', ')}]`

export default function DemoCosineSim({ onInteract }) {
  const [ai, setAi] = useState(0)
  const [bi, setBi] = useState(2)

  const A = SENTS[ai], B = SENTS[bi]
  const d = dot(A.v, B.v)
  const nA = mag(A.v), nB = mag(B.v)
  const sim = cosine(A.v, B.v)
  const angle = Math.acos(Math.min(1, Math.max(-1, sim))) * (180 / Math.PI)
  const verdict = verdictOf(sim)

  const ranked = useMemo(
    () => SENTS.map((s, i) => ({ i, s, sim: cosine(A.v, s.v) }))
      .filter((r) => r.i !== ai)
      .sort((a, b) => b.sim - a.sim),
    [ai], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const change = (setter) => (e) => { onInteract?.(); setter(+e.target.value) }

  // arrow geometry: both start at origin; A fixed, B swung open by the true angle.
  const OX = 30, OY = 130, L = 96
  const aDeg = 18, bDeg = aDeg + angle
  const rad = (deg) => (deg * Math.PI) / 180
  const tip = (deg) => [OX + L * Math.cos(rad(deg)), OY - L * Math.sin(rad(deg))]
  const [ax, ay] = tip(aDeg), [bx, by] = tip(bDeg)

  return (
    <div>
      {/* pickers */}
      <div className="mb-3 grid gap-2.5 sm:grid-cols-2">
        {[{ v: ai, set: setAi, lbl: 'A', tone: 'text-brand-500 dark:text-brand-300' },
          { v: bi, set: setBi, lbl: 'B', tone: 'text-emerald-600 dark:text-emerald-400' }].map((p) => (
          <label key={p.lbl} className="block">
            <span className={cn('mb-1 flex items-center gap-1.5 text-xs font-semibold', p.tone)}>
              <span className="font-mono">sentence {p.lbl}</span>
            </span>
            <select value={p.v} onChange={change(p.set)} className="input w-full text-xs" aria-label={`sentence ${p.lbl}`}>
              {SENTS.map((s, i) => <option key={i} value={i}>{s.t}</option>)}
            </select>
            <span className="mt-1 block font-mono text-[10px] tabular-nums txt-3">{fmtVec(SENTS[p.v].v)}</span>
          </label>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[200px_1fr]">
        {/* angle visual */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
          <svg viewBox="0 0 220 160" className="w-full" role="img" aria-label="two vectors drawn at their cosine angle">
            {/* origin arc showing the angle between the arrows */}
            <path
              d={`M ${OX + 44 * Math.cos(rad(aDeg))} ${OY - 44 * Math.sin(rad(aDeg))} A 44 44 0 0 0 ${OX + 44 * Math.cos(rad(bDeg))} ${OY - 44 * Math.sin(rad(bDeg))}`}
              className="fill-none stroke-zinc-400 dark:stroke-zinc-500" strokeWidth="1" strokeDasharray="2 2"
            />
            <line x1={OX} y1={OY} x2={ax} y2={ay} className="stroke-brand-500" strokeWidth="2.5" strokeLinecap="round" />
            <line x1={OX} y1={OY} x2={bx} y2={by} className="stroke-emerald-500" strokeWidth="2.5" strokeLinecap="round">
              <animate attributeName="x2" from={ax} to={bx} dur="0.4s" />
              <animate attributeName="y2" from={ay} to={by} dur="0.4s" />
            </line>
            <circle cx={ax} cy={ay} r="3" className="fill-brand-500" />
            <circle cx={bx} cy={by} r="3" className="fill-emerald-500" />
            <circle cx={OX} cy={OY} r="3" className="fill-zinc-500" />
            <text x={ax + 4} y={ay} dy="0.32em" className="fill-brand-500 text-[11px] font-bold dark:fill-brand-300">A</text>
            <text x={bx + 4} y={by} dy="0.32em" className="fill-emerald-600 text-[11px] font-bold dark:fill-emerald-400">B</text>
            <text x={OX + 52} y={OY - 4} className="fill-zinc-500 text-[10px] tabular-nums dark:fill-zinc-400">{angle.toFixed(0)}°</text>
          </svg>
        </div>

        {/* the math + verdict */}
        <div className="card p-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-xs font-semibold txt-2">cosine similarity</span>
            <span className="font-mono text-2xl font-bold tabular-nums text-brand-500 dark:text-brand-300">{sim.toFixed(3)}</span>
            <span className={cn(verdict.chip, 'ml-auto')}>{verdict.label}</span>
          </div>

          {/* transparent formula */}
          <div className="mt-2.5 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-[11px] leading-relaxed txt-2 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div>
              cos(θ) = <span className="txt-3">A·B</span> / (<span className="txt-3">|A| · |B|</span>)
            </div>
            <div className="mt-1 tabular-nums">
              = <span className="font-semibold txt-1">{d}</span> / (
              <span className="font-semibold txt-1">{nA.toFixed(2)}</span> ·{' '}
              <span className="font-semibold txt-1">{nB.toFixed(2)}</span>) ={' '}
              <span className="font-bold text-brand-500 dark:text-brand-300">{sim.toFixed(3)}</span>
            </div>
            <div className="mt-1 text-[10px] txt-3">dot product {d} · magnitudes |A|,|B| from √(v·v) · θ = {angle.toFixed(1)}°</div>
          </div>

          {/* verdict scale */}
          <div className="mt-2.5">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-gradient-to-r from-zinc-300 via-amber-300 to-emerald-400 dark:from-zinc-700 dark:via-amber-500/60 dark:to-emerald-500/70">
              <div
                className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-500 shadow dark:border-zinc-900"
                style={{ left: `${Math.max(0, Math.min(1, sim)) * 100}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[9px] uppercase tracking-wide txt-3">
              <span>0 · unrelated</span><span>0.5</span><span>1 · identical</span>
            </div>
          </div>
        </div>
      </div>

      {/* ranked neighbors of A */}
      <div className="mt-3 card p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold txt-1">
          <ArrowRight size={13} className="text-brand-500 dark:text-brand-300" /> most similar to sentence A, ranked
        </div>
        <div className="space-y-1">
          {ranked.map((r) => (
            <button
              key={r.i}
              onClick={() => { onInteract?.(); setBi(r.i) }}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors',
                r.i === bi ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-200 hover:border-brand-400 dark:border-zinc-800',
              )}
            >
              <span className="truncate text-[11px] txt-2">{r.s.t}</span>
              <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-brand-500 dark:text-brand-300">{r.sim.toFixed(3)}</span>
              <span className="h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <span className="block h-full rounded-full bg-brand-500" style={{ width: `${Math.max(0, r.sim) * 100}%` }} />
              </span>
            </button>
          ))}
        </div>
        <div className="mt-1.5 text-[10px] txt-3">dims = {fmtVec(DIMS)} · click a row to load it as sentence B</div>
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Cosine similarity measures the <span className="txt-2">angle</span> between vectors, ignoring their length — two arrows
        pointing the same way score 1.0 no matter how long they are. It is the standard similarity metric for embeddings and the
        scoring function behind semantic search: embed a query, then rank every document by cosine to it.
      </p>
    </div>
  )
}
