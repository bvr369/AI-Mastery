import { useMemo, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Semantic vector search, live. ~12 document CHUNKS get hand-placed 2D coords
 * that CLUSTER by theme; each preset QUERY sits near its cluster. Selecting a
 * query embeds it on the same map and lights up its top-K=3 nearest chunks by
 * REAL cosine similarity (mean-centered vectors, so direction discriminates).
 * The typed box maps free text to the nearest preset by keyword overlap.
 */

const K = 3

// 0-100 space. Four themes pushed to four diagonal directions from the centroid
// so cosine (an angle measure) cleanly separates them.
const CHUNKS = [
  { id: 'c1', short: 'basil', theme: 'cooking', x: 18, y: 20, text: 'Simmer the tomatoes gently before folding in the fresh basil.' },
  { id: 'c2', short: 'dough', theme: 'cooking', x: 28, y: 16, text: 'Knead the dough until it turns smooth, soft and elastic.' },
  { id: 'c3', short: 'pasta', theme: 'cooking', x: 22, y: 30, text: 'Salt the pasta water heavily and boil it until al dente.' },
  { id: 'c4', short: 'refactor', theme: 'code', x: 78, y: 18, text: 'Refactor the function to pull the nested loops into helpers.' },
  { id: 'c5', short: 'commit', theme: 'code', x: 84, y: 28, text: 'Commit your changes before you merge the feature branch.' },
  { id: 'c6', short: 'API', theme: 'code', x: 72, y: 24, text: 'The API returns JSON that you parse into typed objects.' },
  { id: 'c7', short: 'flight', theme: 'travel', x: 18, y: 78, text: 'Book an aisle seat for the long overnight flight abroad.' },
  { id: 'c8', short: 'passport', theme: 'travel', x: 28, y: 84, text: 'Pack light and zip your passport into an inside pocket.' },
  { id: 'c9', short: 'train', theme: 'travel', x: 22, y: 72, text: 'The scenic train winds along the coast to the old town.' },
  { id: 'c10', short: 'walk', theme: 'health', x: 78, y: 80, text: 'A brisk daily walk keeps your heart and lungs strong.' },
  { id: 'c11', short: 'stretch', theme: 'health', x: 84, y: 72, text: 'Stretch and rehydrate well after a hard afternoon workout.' },
  { id: 'c12', short: 'sleep', theme: 'health', x: 72, y: 84, text: 'Deep sleep lets your muscles repair and recover overnight.' },
]

const QUERIES = [
  { id: 'q1', text: 'how do I make fresh pasta?', kw: 'cook recipe tomato dough boil kitchen dinner', x: 20, y: 24 },
  { id: 'q2', text: 'fix a bug and clean up my code', kw: 'debug function branch merge program software json', x: 80, y: 22 },
  { id: 'q3', text: 'planning a trip abroad', kw: 'travel flight vacation passport train seat pack', x: 20, y: 80 },
  { id: 'q4', text: 'how to stay fit and healthy', kw: 'exercise workout heart sleep hydrate walk fitness', x: 80, y: 78 },
  { id: 'q5', text: 'quick healthy dinner recipes', kw: 'cook meal food eat nutrition kitchen recipe', x: 30, y: 34 },
]

const THEMES = {
  cooking: { label: 'Cooking', fill: 'fill-amber-500', bg: 'bg-amber-500', tx: 'text-amber-600 dark:text-amber-400' },
  code: { label: 'Programming', fill: 'fill-sky-500', bg: 'bg-sky-500', tx: 'text-sky-600 dark:text-sky-400' },
  travel: { label: 'Travel', fill: 'fill-indigo-500', bg: 'bg-indigo-500', tx: 'text-indigo-600 dark:text-indigo-400' },
  health: { label: 'Health', fill: 'fill-emerald-500', bg: 'bg-emerald-500', tx: 'text-emerald-600 dark:text-emerald-400' },
}

// mean-center on the chunk centroid so cosine measures direction, not the shared
// all-positive offset. Same center is applied to the query -> comparable angles.
const MX = CHUNKS.reduce((s, c) => s + c.x, 0) / CHUNKS.length
const MY = CHUNKS.reduce((s, c) => s + c.y, 0) / CHUNKS.length
const cosine = (a, b) => {
  const ax = a.x - MX, ay = a.y - MY, bx = b.x - MX, by = b.y - MY
  const dot = ax * bx + ay * by
  const na = Math.hypot(ax, ay), nb = Math.hypot(bx, by)
  return na && nb ? dot / (na * nb) : 0
}

const STOP = new Set(['how', 'do', 'i', 'a', 'the', 'to', 'my', 'and', 'for', 'of', 'in', 'is', 'can', 'you', 'me', 'up'])
const toks = (s) => s.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter((t) => t && !STOP.has(t))
// map free text to the nearest preset by keyword overlap (a tiny stand-in for
// a real query encoder). No match -> keep whatever is active.
function matchPreset(text) {
  const t = toks(text)
  if (!t.length) return null
  let best = null, score = 0
  for (const q of QUERIES) {
    const bag = new Set([...toks(q.text), ...toks(q.kw)])
    const s = t.reduce((n, w) => n + (bag.has(w) ? 1 : 0), 0)
    if (s > score) { score = s; best = q }
  }
  return score > 0 ? best : null
}

// SVG geometry
const W = 480, H = 330, PADX = 26, PADY = 24
const px = (x) => PADX + (x / 100) * (W - 2 * PADX)
const py = (y) => PADY + (y / 100) * (H - 2 * PADY)
const star = (cx, cy, r) => {
  const p = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rad = i % 2 === 0 ? r : r * 0.45
    p.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`)
  }
  return p.join(' ')
}

export default function DemoVectorSearch({ onInteract }) {
  const [activeId, setActiveId] = useState('q1')
  const [typed, setTyped] = useState('')
  const query = QUERIES.find((q) => q.id === activeId)

  const ranked = useMemo(
    () => CHUNKS.map((c) => ({ c, sim: cosine(query, c) })).sort((a, b) => b.sim - a.sim),
    [query]
  )
  const top = ranked.slice(0, K)
  const topSet = new Set(top.map((r) => r.c.id))

  const run = (q) => { if (!q) return; onInteract?.(); setActiveId(q.id) }
  const submit = (e) => { e.preventDefault(); const m = matchPreset(typed); if (m) run(m) }

  return (
    <div>
      {/* preset queries + typed box */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {QUERIES.map((q) => (
          <button
            key={q.id}
            onClick={() => run(q)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-left text-[11px] transition-all',
              q.id === activeId
                ? 'border-brand-500 bg-brand-500/10 font-semibold text-brand-600 dark:text-brand-300'
                : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700'
            )}
          >
            {q.text}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mb-3 flex gap-2">
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="…or type your own query"
          className="input flex-1 text-xs"
          aria-label="type a search query"
        />
        <button type="submit" className="btn-primary px-3 py-1.5 text-xs"><Search size={13} /> Search</button>
      </form>

      <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
        {/* 2D embedding map */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="2D semantic search map: a query star linked to its nearest document chunks">
            {/* connectors query -> top-K nearest chunks */}
            {top.map((r) => (
              <line
                key={r.c.id}
                x1={px(query.x)} y1={py(query.y)} x2={px(r.c.x)} y2={py(r.c.y)}
                className="stroke-brand-400/70" strokeWidth="1.4" strokeDasharray="3 3"
              />
            ))}

            {/* chunk dots + short labels */}
            {CHUNKS.map((c) => {
              const hit = topSet.has(c.id)
              const t = THEMES[c.theme]
              const end = c.x > 60
              return (
                <g key={c.id}>
                  {hit && <circle cx={px(c.x)} cy={py(c.y)} r="8" className="fill-brand-500/10 stroke-brand-400/70" strokeWidth="1.3" />}
                  <circle cx={px(c.x)} cy={py(c.y)} r={hit ? 4.5 : 3.5} className={t.fill} />
                  <text
                    x={px(c.x) + (end ? -7 : 7)} y={py(c.y)} dy="0.32em" textAnchor={end ? 'end' : 'start'}
                    className={cn('select-none text-[10px]', hit ? 'fill-zinc-800 font-bold dark:fill-zinc-100' : 'fill-zinc-500 dark:fill-zinc-400')}
                  >
                    {c.short}
                  </text>
                </g>
              )
            })}

            {/* query star + pulsing halo */}
            <polygon points={star(px(query.x), py(query.y), 9)} className="fill-brand-500 stroke-white/70 dark:stroke-zinc-900" strokeWidth="1" />
            <circle cx={px(query.x)} cy={py(query.y)} r="9" className="fill-none stroke-brand-500/40">
              <animate attributeName="r" values="9;16;9" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2.2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        {/* ranked results */}
        <div className="card p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold txt-1">
            <Sparkles size={13} className="text-brand-500 dark:text-brand-300" /> Top {K} matches
          </div>
          <div className="mb-2.5 truncate font-mono text-[11px] italic txt-3" title={query.text}>“{query.text}”</div>
          <div className="space-y-1.5">
            {top.map((r, i) => {
              const t = THEMES[r.c.theme]
              return (
                <div key={r.c.id} className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold txt-3">#{i + 1}</span>
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', t.bg)} />
                    <span className={cn('text-[9px] font-semibold uppercase tracking-wide', t.tx)}>{t.label}</span>
                    <span className="ml-auto font-mono text-[11px] tabular-nums text-brand-500 dark:text-brand-300">{r.sim.toFixed(3)}</span>
                  </div>
                  <p className="text-[11px] leading-snug txt-2">{r.c.text}</p>
                </div>
              )
            })}
          </div>
          <div className="mt-2 text-[10px] leading-snug txt-3">score = cosine similarity · 1.0 = identical direction</div>
        </div>
      </div>

      {/* legend */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {Object.values(THEMES).map((t) => (
          <span key={t.label} className="flex items-center gap-1.5 text-[11px] font-medium txt-2">
            <span className={cn('h-2.5 w-2.5 rounded-full', t.bg)} /> {t.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[11px] font-medium txt-2">
          <span className="text-brand-500 dark:text-brand-300">★</span> query
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        This is exactly how semantic search works: <span className="txt-2">embed the query</span> into the same vector space as your
        documents, then <span className="txt-2">rank chunks by cosine similarity</span> and return the closest ones. Real systems do
        this in hundreds of dimensions over millions of chunks with an approximate-nearest-neighbor index — the 2D map is just for
        intuition. This retrieval step is the <span className="font-mono text-brand-500 dark:text-brand-300">R</span> in RAG (Module 7).
      </p>
    </div>
  )
}
