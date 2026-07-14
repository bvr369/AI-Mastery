import { useMemo, useState } from 'react'
import { cn } from '../../../lib/utils'

/**
 * Self-attention visualizer. Click a token to make it the QUERY, then watch how
 * much attention it pays to every other token (the keys). Weights come from a
 * baked-in but linguistically plausible logit table, run through a REAL softmax
 * so each query's weights sum to 1. Three heads specialize differently.
 */

const TOKENS = ['The', 'cat', 'sat', 'on', 'the', 'mat', 'because', 'it', 'was', 'tired']
const N = TOKENS.length

const softmax = (arr) => {
  const m = Math.max(...arr)
  const e = arr.map((x) => Math.exp(x - m))
  const s = e.reduce((a, b) => a + b, 0)
  return e.map((x) => x / s)
}

// Build a logit matrix from per-query {keyIndex: boost} nudges over a flat base.
const fromBoosts = (boosts, self = 0.5, base = 0.2) =>
  TOKENS.map((_, q) => {
    const row = TOKENS.map((__, k) => (k === q ? self : base))
    const b = boosts[q] || {}
    for (const k in b) row[+k] += b[k]
    return softmax(row)
  })

const HEADS = [
  {
    name: 'Head 1 · Coreference',
    tag: 'pronouns → the nouns they refer to',
    rows: fromBoosts({
      0: { 1: 3.0 }, // The → cat
      1: { 7: 1.4 }, // cat ↔ its pronoun "it"
      2: { 1: 0.9 },
      4: { 5: 3.0 }, // the → mat
      7: { 1: 3.6, 5: 1.1 }, // it → cat (strong), mat (competing antecedent)
      8: { 7: 1.1 },
      9: { 7: 2.0, 1: 1.4 }, // tired → it / cat
    }),
  },
  {
    name: 'Head 2 · Positional',
    tag: 'each token attends to the one just before it',
    rows: TOKENS.map((_, q) =>
      softmax(TOKENS.map((__, k) => (k === q ? 1.0 : k === q - 1 ? 3.3 : k === q - 2 ? 0.9 : 0.15)))
    ),
  },
  {
    name: 'Head 3 · Syntactic',
    tag: 'verbs attend to their subjects & objects',
    rows: fromBoosts({
      0: { 1: 2.5 }, // The → cat
      1: { 2: 2.0 }, // cat → sat
      2: { 1: 3.2, 5: 2.4 }, // sat → cat (subject) + mat (object)
      3: { 5: 2.2 }, // on → mat
      4: { 5: 2.5 }, // the → mat
      5: { 2: 1.4 },
      6: { 2: 1.8, 8: 1.8 }, // because links the two clauses
      7: { 8: 1.6 }, // it → was
      8: { 7: 3.0, 9: 2.6 }, // was → it (subject) + tired (predicate)
      9: { 8: 2.0 }, // tired → was
    }),
  },
]

// SVG geometry
const W = 760
const H = 172
const M = 26
const STEP = (W - M * 2) / N
const cx = (i) => M + STEP * (i + 0.5)
const BOX_W = 62
const BOX_H = 28
const BOX_TOP = H - 36

export default function DemoAttentionViz({ onInteract }) {
  const [query, setQuery] = useState(7) // start on "it" — the interesting case
  const [head, setHead] = useState(0)

  const weights = HEADS[head].rows[query]
  const maxK = useMemo(() => weights.indexOf(Math.max(...weights)), [weights])

  const select = (i) => {
    onInteract?.()
    setQuery(i)
  }

  return (
    <div>
      {/* head selector */}
      <div className="mb-3 flex flex-wrap gap-2">
        {HEADS.map((h, i) => (
          <button
            key={h.name}
            onClick={() => { onInteract?.(); setHead(i) }}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
              i === head ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700'
            )}
          >
            {h.name}
          </button>
        ))}
      </div>
      <div className="mb-2 text-xs txt-3">
        <span className="text-brand-500 dark:text-brand-300">{HEADS[head].tag}</span> — click any token to make it the <strong className="txt-2">query</strong>.
      </div>

      {/* attention arc diagram */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img" aria-label={`Attention weights from the token "${TOKENS[query]}" to every other token`}>
          {/* arcs from the query to each key, thickness/opacity ∝ weight */}
          {weights.map((w, k) => {
            if (k === query) return null
            const x1 = cx(query)
            const x2 = cx(k)
            const dist = Math.abs(x1 - x2)
            const cyTop = BOX_TOP - (18 + dist * 0.14)
            const midx = (x1 + x2) / 2
            return (
              <path
                key={k}
                d={`M ${x1} ${BOX_TOP} Q ${midx} ${cyTop} ${x2} ${BOX_TOP}`}
                fill="none"
                className={k === maxK ? 'stroke-brand-600 dark:stroke-brand-300' : 'stroke-brand-500'}
                strokeWidth={0.4 + w * 9}
                strokeOpacity={0.12 + w * 0.85}
                strokeLinecap="round"
              />
            )
          })}

          {/* token boxes */}
          {TOKENS.map((t, i) => {
            const isQ = i === query
            const w = weights[i]
            return (
              <g key={i} onClick={() => select(i)} className="cursor-pointer">
                <rect
                  x={cx(i) - BOX_W / 2} y={BOX_TOP} width={BOX_W} height={BOX_H} rx={7}
                  className={cn(
                    'transition-all',
                    isQ ? 'fill-brand-500 stroke-brand-600' : 'fill-white stroke-zinc-300 dark:fill-zinc-800 dark:stroke-zinc-700'
                  )}
                  strokeWidth={isQ ? 2 : 1}
                />
                {/* attention tint for keys */}
                {!isQ && (
                  <rect
                    x={cx(i) - BOX_W / 2} y={BOX_TOP} width={BOX_W} height={BOX_H} rx={7}
                    className={cn('fill-brand-500', i === maxK && 'stroke-brand-600 dark:stroke-brand-300')}
                    fillOpacity={w * 0.9}
                    strokeWidth={i === maxK ? 2 : 0}
                  />
                )}
                <text
                  x={cx(i)} y={BOX_TOP + BOX_H / 2 + 4} textAnchor="middle" fontSize="12.5" fontFamily="ui-monospace, monospace"
                  className={cn('pointer-events-none select-none font-medium', isQ ? 'fill-white' : 'fill-zinc-700 dark:fill-zinc-200')}
                >
                  {t}
                </text>
                {/* weight % above each key */}
                {!isQ && (
                  <text x={cx(i)} y={BOX_TOP - 6} textAnchor="middle" fontSize="9" className="pointer-events-none select-none fill-zinc-400 dark:fill-zinc-500 tabular-nums">
                    {(w * 100).toFixed(0)}%
                  </text>
                )}
              </g>
            )
          })}

          {/* query label */}
          <text x={cx(query)} y={BOX_TOP + BOX_H + 15} textAnchor="middle" fontSize="9.5" className="fill-brand-500 dark:fill-brand-300 font-semibold uppercase">
            query
          </text>
        </svg>
      </div>

      {/* per-token weight bars */}
      <div className="mt-3 space-y-1">
        {TOKENS.map((t, i) => {
          const w = weights[i]
          return (
            <button
              key={i}
              onClick={() => select(i)}
              className={cn('flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-brand-500/5', i === query && 'bg-brand-500/10')}
            >
              <span className={cn('w-16 shrink-0 text-right font-mono text-xs', i === query ? 'font-bold text-brand-500 dark:text-brand-300' : 'txt-2')}>{t}</span>
              <div className="h-3.5 flex-1 overflow-hidden rounded bg-zinc-200/60 dark:bg-zinc-800">
                <div
                  className={cn('h-full rounded transition-all duration-300', i === maxK ? 'bg-gradient-to-r from-brand-500 to-indigo-500' : 'bg-brand-500/45')}
                  style={{ width: `${(w * 100).toFixed(1)}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-[10px] tabular-nums txt-3">{(w * 100).toFixed(1)}%</span>
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex items-center gap-2 text-[11px] txt-3">
        <span className="chip-brand">“{TOKENS[query]}”</span>
        attends most to
        <span className="font-mono font-semibold text-brand-500 dark:text-brand-300">“{TOKENS[maxK]}”</span>
        <span className="ml-auto tabular-nums">Σ weights = {weights.reduce((a, b) => a + b, 0).toFixed(2)}</span>
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Each row is a real softmax over learned-style scores, so a query's attention weights always sum to 1. Attention lets every token gather
        information from the relevant others in a single step — and different heads specialize (coreference, position, syntax). Stacking many
        attention layers on top of each other is what lets transformers build a rich understanding of context.
      </p>
    </div>
  )
}
