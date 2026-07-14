import { useMemo, useState } from 'react'
import { Sparkles, MousePointerClick } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Meaning becomes numbers. 34 words with hand-placed 2D coords that CLUSTER by
 * category. Click a word -> its 3 nearest neighbors (real Euclidean distance) with
 * a real cosine-similarity score (on mean-centered vectors, so it's discriminative).
 * Word analogies do real vector arithmetic: king - man + woman lands on queen.
 */

// Coordinates in a 0-100 space. The people/royalty block is engineered so a shared
// "gender" vector (man->woman) and "royalty" vector make the analogies exact.
const WORDS = [
  // people (gender axis) + royalty
  { w: 'man', x: 12, y: 52, cat: 'people' },
  { w: 'woman', x: 12, y: 60, cat: 'people' },
  { w: 'king', x: 18, y: 30, cat: 'royalty' },
  { w: 'queen', x: 18, y: 38, cat: 'royalty' },
  { w: 'prince', x: 22, y: 40, cat: 'royalty' },
  { w: 'princess', x: 22, y: 48, cat: 'royalty' },
  // animals
  { w: 'cat', x: 34, y: 12, cat: 'animals' },
  { w: 'dog', x: 40, y: 10, cat: 'animals' },
  { w: 'lion', x: 45, y: 18, cat: 'animals' },
  { w: 'tiger', x: 38, y: 20, cat: 'animals' },
  { w: 'mouse', x: 30, y: 16, cat: 'animals' },
  // tech
  { w: 'code', x: 80, y: 24, cat: 'tech' },
  { w: 'server', x: 86, y: 31, cat: 'tech' },
  { w: 'python', x: 78, y: 33, cat: 'tech' },
  { w: 'laptop', x: 84, y: 20, cat: 'tech' },
  { w: 'api', x: 90, y: 35, cat: 'tech' },
  // food
  { w: 'pizza', x: 78, y: 72, cat: 'food' },
  { w: 'apple', x: 84, y: 67, cat: 'food' },
  { w: 'bread', x: 75, y: 80, cat: 'food' },
  { w: 'coffee', x: 87, y: 77, cat: 'food' },
  // emotions
  { w: 'happy', x: 47, y: 76, cat: 'emotions' },
  { w: 'sad', x: 54, y: 85, cat: 'emotions' },
  { w: 'angry', x: 58, y: 78, cat: 'emotions' },
  { w: 'calm', x: 45, y: 86, cat: 'emotions' },
  // places
  { w: 'paris', x: 52, y: 44, cat: 'places' },
  { w: 'london', x: 58, y: 48, cat: 'places' },
  { w: 'ocean', x: 64, y: 54, cat: 'places' },
  { w: 'mountain', x: 50, y: 56, cat: 'places' },
]

const CATS = {
  people: { label: 'People', fill: 'fill-zinc-400 dark:fill-zinc-500', bg: 'bg-zinc-400 dark:bg-zinc-500', tx: 'text-zinc-500 dark:text-zinc-400' },
  royalty: { label: 'Royalty', fill: 'fill-brand-500', bg: 'bg-brand-500', tx: 'text-brand-500 dark:text-brand-300' },
  animals: { label: 'Animals', fill: 'fill-amber-500', bg: 'bg-amber-500', tx: 'text-amber-600 dark:text-amber-400' },
  tech: { label: 'Tech', fill: 'fill-sky-500', bg: 'bg-sky-500', tx: 'text-sky-600 dark:text-sky-400' },
  food: { label: 'Food', fill: 'fill-rose-500', bg: 'bg-rose-500', tx: 'text-rose-600 dark:text-rose-400' },
  emotions: { label: 'Emotions', fill: 'fill-emerald-500', bg: 'bg-emerald-500', tx: 'text-emerald-600 dark:text-emerald-400' },
  places: { label: 'Places', fill: 'fill-indigo-500', bg: 'bg-indigo-500', tx: 'text-indigo-600 dark:text-indigo-400' },
}

const ANALOGIES = [
  { a: 'king', b: 'man', c: 'woman' },
  { a: 'prince', b: 'man', c: 'woman' },
  { a: 'king', b: 'queen', c: 'woman' },
]

// mean-centered vectors -> cosine actually discriminates (raw coords are all +,+).
const MX = WORDS.reduce((s, w) => s + w.x, 0) / WORDS.length
const MY = WORDS.reduce((s, w) => s + w.y, 0) / WORDS.length
const byWord = Object.fromEntries(WORDS.map((w) => [w.w, w]))
const cvec = (w) => [w.x - MX, w.y - MY]
const cosine = (a, b) => {
  const [ax, ay] = cvec(a), [bx, by] = cvec(b)
  const dot = ax * bx + ay * by
  const na = Math.hypot(ax, ay), nb = Math.hypot(bx, by)
  return na && nb ? dot / (na * nb) : 0
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

// SVG plot geometry
const W = 480, H = 330, PADX = 26, PADY = 24
const px = (x) => PADX + (x / 100) * (W - 2 * PADX)
const py = (y) => PADY + (y / 100) * (H - 2 * PADY)

export default function DemoEmbeddingMap({ onInteract }) {
  const [selected, setSelected] = useState('king')
  const [analogy, setAnalogy] = useState(null)

  const cur = byWord[selected]

  const neighbors = useMemo(() => {
    if (!cur) return []
    return WORDS.filter((w) => w.w !== cur.w)
      .map((w) => ({ w, d: dist(cur, w), sim: cosine(cur, w) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
  }, [cur])

  const nbSet = new Set(neighbors.map((n) => n.w.w))

  const pick = (word) => {
    onInteract?.()
    setSelected(word)
    setAnalogy(null)
  }

  const runAnalogy = ({ a, b, c }) => {
    onInteract?.()
    const A = byWord[a], B = byWord[b], C = byWord[c]
    const target = { x: A.x - B.x + C.x, y: A.y - B.y + C.y }
    const exclude = new Set([a, b, c])
    const result = WORDS.filter((w) => !exclude.has(w.w))
      .map((w) => ({ w, d: Math.hypot(w.x - target.x, w.y - target.y) }))
      .sort((p, q) => p.d - q.d)[0].w
    setSelected(result.w)
    setAnalogy({ a, b, c, result: result.w, target })
  }

  return (
    <div>
      {/* legend */}
      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {Object.entries(CATS).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5 text-[11px] font-medium txt-2">
            <span className={cn('h-2.5 w-2.5 rounded-full', c.bg)} />
            {c.label}
          </span>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
        {/* scatter plot */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="2D semantic embedding map of words clustered by meaning">
            {/* connectors to nearest neighbors */}
            {cur && neighbors.map((n) => (
              <line
                key={n.w.w}
                x1={px(cur.x)} y1={py(cur.y)} x2={px(n.w.x)} y2={py(n.w.y)}
                className="stroke-brand-400/70" strokeWidth="1.3" strokeDasharray="3 3"
              />
            ))}

            {/* analogy target marker */}
            {analogy && (
              <g className="stroke-emerald-500" strokeWidth="1.6">
                <line x1={px(analogy.target.x) - 5} y1={py(analogy.target.y) - 5} x2={px(analogy.target.x) + 5} y2={py(analogy.target.y) + 5} />
                <line x1={px(analogy.target.x) + 5} y1={py(analogy.target.y) - 5} x2={px(analogy.target.x) - 5} y2={py(analogy.target.y) + 5} />
              </g>
            )}

            {/* points */}
            {WORDS.map((w) => {
              const isSel = w.w === selected
              const isNb = nbSet.has(w.w)
              const c = CATS[w.cat]
              const anchorEnd = w.x > 68
              return (
                <g key={w.w} onClick={() => pick(w.w)} className="cursor-pointer">
                  <circle cx={px(w.x)} cy={py(w.y)} r="11" fill="transparent" />
                  {isSel && <circle cx={px(w.x)} cy={py(w.y)} r="8.5" className="fill-brand-500/15 stroke-brand-500" strokeWidth="1.5" />}
                  {isNb && !isSel && <circle cx={px(w.x)} cy={py(w.y)} r="7" className="fill-none stroke-brand-400/70" strokeWidth="1.3" />}
                  <circle cx={px(w.x)} cy={py(w.y)} r={isSel ? 4.5 : 3.5} className={c.fill} />
                  <text
                    x={px(w.x) + (anchorEnd ? -7 : 7)}
                    y={py(w.y)}
                    dy="0.32em"
                    textAnchor={anchorEnd ? 'end' : 'start'}
                    className={cn(
                      'select-none text-[10px]',
                      isSel ? 'fill-zinc-900 font-bold dark:fill-zinc-50' : isNb ? 'fill-zinc-700 font-semibold dark:fill-zinc-200' : 'fill-zinc-500 dark:fill-zinc-400'
                    )}
                  >
                    {w.w}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* panel */}
        <div className="flex flex-col gap-3">
          <div className="card p-3">
            {analogy ? (
              <div className="mb-2 text-xs leading-relaxed txt-2">
                <span className="font-mono font-semibold txt-1">{analogy.a}</span> −{' '}
                <span className="font-mono font-semibold txt-1">{analogy.b}</span> +{' '}
                <span className="font-mono font-semibold txt-1">{analogy.c}</span> ≈{' '}
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{analogy.result}</span>
              </div>
            ) : (
              <div className="mb-2 flex items-center gap-1.5 text-xs txt-3">
                <MousePointerClick size={13} /> nearest neighbors of
              </div>
            )}
            <div className="mb-2 flex items-center gap-2">
              <span className={cn('h-3 w-3 rounded-full', CATS[cur.cat].bg)} />
              <span className="font-mono text-sm font-bold txt-1">{cur.w}</span>
              <span className={cn('ml-auto text-[10px] font-semibold uppercase tracking-wide', CATS[cur.cat].tx)}>{CATS[cur.cat].label}</span>
            </div>
            <div className="space-y-1.5">
              {neighbors.map((n) => (
                <button
                  key={n.w.w}
                  onClick={() => pick(n.w.w)}
                  className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 px-2 py-1.5 text-left transition-colors hover:border-brand-400 dark:border-zinc-800"
                >
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', CATS[n.w.cat].bg)} />
                  <span className="font-mono text-xs txt-1">{n.w.w}</span>
                  <span className="ml-auto font-mono text-[11px] tabular-nums text-brand-500 dark:text-brand-300">cos {n.sim.toFixed(3)}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 text-[10px] leading-snug txt-3">
              cosine of mean-centered coordinate vectors · 1.0 = identical direction
            </div>
          </div>

          <div className="card p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold txt-1">
              <Sparkles size={13} className="text-brand-500 dark:text-brand-300" /> Word analogies
            </div>
            <div className="flex flex-col gap-1.5">
              {ANALOGIES.map((an) => {
                const on = analogy && analogy.a === an.a && analogy.b === an.b && analogy.c === an.c
                return (
                  <button
                    key={`${an.a}-${an.b}-${an.c}`}
                    onClick={() => runAnalogy(an)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 text-left font-mono text-[11px] transition-all',
                      on ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700'
                    )}
                  >
                    {an.a} − {an.b} + {an.c} = ?
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Real embeddings have hundreds-to-thousands of dimensions; this is a 2D projection for intuition. But the operations are
        exactly what powers production systems: nearest-neighbor search, cosine similarity, and analogy arithmetic are the math
        behind semantic search and RAG (Module 6) — "meaning becomes numbers, and nearby vectors mean similar meaning."
      </p>
    </div>
  )
}
