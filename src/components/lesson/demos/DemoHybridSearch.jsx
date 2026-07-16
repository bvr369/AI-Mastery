import { useMemo, useState } from 'react'
import { Search, Sparkles, Layers, ArrowUp } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Keyword vs semantic vs hybrid+rerank on ONE query, side by side.
 * Keyword score is computed live: TF-IDF-ish sum of matched query-term IDF,
 * normalized per query (real term-overlap). Semantic + cross-encoder rerank
 * signals are curated so paraphrases with zero shared words still surface —
 * exactly why production retrieval blends both, then reranks the top hits.
 */

const CHUNKS = [
  { id: 'c1', text: "To reset your password, open Settings and click 'Forgot password' to get a reset link by email." },
  { id: 'c2', text: 'Change your account password regularly and turn on two-factor authentication for security.' },
  { id: 'c3', text: "If you're locked out, our support team can restore access to your account within 24 hours." },
  { id: 'c4', text: 'Lower the max_tokens parameter to make the model produce shorter, more concise responses.' },
  { id: 'c5', text: 'Set a smaller output limit so the assistant returns brief replies instead of long essays.' },
  { id: 'c6', text: 'Streaming returns tokens incrementally so users see partial output while generation continues.' },
  { id: 'c7', text: 'Embeddings turn text into vectors so similar meanings sit close together in vector space.' },
  { id: 'c8', text: 'Our pricing tiers bill per million tokens; the free tier includes a monthly quota.' },
]

// Curated semantic (cosine-like) + cross-encoder rerank signals, per query per chunk.
const QUERIES = [
  {
    id: 'q1', text: 'reset my password', best: 'c1',
    note: 'Exact term "password" — keyword nails it; semantic also catches "locked out" (c3) with no shared words.',
    sem: { c1: 0.93, c2: 0.79, c3: 0.72, c4: 0.08, c5: 0.07, c6: 0.06, c7: 0.05, c8: 0.09 },
    rr: { c1: 0.97, c2: 0.71, c3: 0.76, c4: 0.05, c5: 0.05, c6: 0.04, c7: 0.04, c8: 0.08 },
  },
  {
    id: 'q2', text: 'make the model give shorter answers', best: 'c5',
    note: 'Keyword favors c4 ("make/model/shorter" match), but c5 is the better answer — rerank promotes the paraphrase.',
    sem: { c1: 0.05, c2: 0.06, c3: 0.07, c4: 0.86, c5: 0.92, c6: 0.24, c7: 0.08, c8: 0.14 },
    rr: { c1: 0.04, c2: 0.05, c3: 0.05, c4: 0.88, c5: 0.96, c6: 0.22, c7: 0.06, c8: 0.12 },
  },
  {
    id: 'q3', text: 'notify users while a long response is generating', best: 'c6',
    note: 'Keyword whiffs — "generating" ≠ "generation", and streaming shares almost no words. Semantic + hybrid recover it.',
    sem: { c1: 0.05, c2: 0.05, c3: 0.14, c4: 0.22, c5: 0.30, c6: 0.90, c7: 0.09, c8: 0.07 },
    rr: { c1: 0.04, c2: 0.04, c3: 0.10, c4: 0.20, c5: 0.28, c6: 0.95, c7: 0.07, c8: 0.06 },
  },
]

const STOP = new Set(['the', 'a', 'an', 'to', 'my', 'do', 'i', 'how', 'is', 'are', 'and', 'or', 'for', 'of', 'so', 'in', 'on', 'your', 'you', 'our', 'me', 'can', 'with', 'while', 'still'])
const tokenize = (s) => (s.toLowerCase().match(/[a-z0-9_]+/g) || []).filter((t) => !STOP.has(t))

// Real IDF across the corpus: rare terms count for more (log(N / df)).
const N = CHUNKS.length
const chunkTokens = Object.fromEntries(CHUNKS.map((c) => [c.id, new Set(tokenize(c.text))]))
const df = {}
CHUNKS.forEach((c) => new Set(tokenize(c.text)).forEach((t) => { df[t] = (df[t] || 0) + 1 }))
const idf = (t) => Math.log(N / ((df[t] || 0) + 1)) + 0.2

const WEIGHT = 0.5 // hybrid blend: half keyword, half semantic

export default function DemoHybridSearch({ onInteract }) {
  const [qid, setQid] = useState('q1')
  const q = QUERIES.find((x) => x.id === qid)

  const cols = useMemo(() => {
    const terms = [...new Set(tokenize(q.text))]
    const rawKw = {}
    CHUNKS.forEach((c) => {
      rawKw[c.id] = terms.reduce((s, t) => (chunkTokens[c.id].has(t) ? s + idf(t) : s), 0)
    })
    const maxKw = Math.max(1e-6, ...Object.values(rawKw))
    const kw = {}
    CHUNKS.forEach((c) => { kw[c.id] = rawKw[c.id] / maxKw })

    const hybrid = {}
    CHUNKS.forEach((c) => { hybrid[c.id] = WEIGHT * kw[c.id] + (1 - WEIGHT) * q.sem[c.id] })

    const rank = (score) => CHUNKS.map((c) => ({ id: c.id, v: score[c.id] })).sort((a, b) => b.v - a.v)
    const keyword = rank(kw).slice(0, 5)
    const semantic = rank(q.sem).slice(0, 5)

    // Retrieve top-5 by hybrid, then rerank THOSE candidates with the cross-encoder.
    const candidates = rank(hybrid).slice(0, 5)
    const hybridRank = Object.fromEntries(candidates.map((c, i) => [c.id, i]))
    const reranked = candidates
      .map((c) => ({ id: c.id, v: q.rr[c.id], hybrid: hybrid[c.id] }))
      .sort((a, b) => b.v - a.v)
      .map((c, i) => ({ ...c, promoted: i < hybridRank[c.id] }))

    return { keyword, semantic, reranked }
  }, [qid])

  const choose = (id) => { onInteract?.(); setQid(id) }
  const snippet = (id) => CHUNKS.find((c) => c.id === id).text

  const Column = ({ icon, title, tag, chip, bar, rows, showPromo }) => (
    <div className="card p-3">
      <div className="mb-1 flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-semibold txt-1">{title}</span>
        <span className={cn('ml-auto', chip)}>{tag}</span>
      </div>
      <div className="mt-2 space-y-1.5">
        {rows.map((r, i) => {
          const isBest = r.id === q.best
          return (
            <div key={r.id} className={cn('rounded-lg border p-1.5 transition-colors', isBest ? 'border-brand-500/60 bg-brand-500/5' : 'border-zinc-200 dark:border-zinc-800')}>
              <div className="flex items-center gap-1.5">
                <span className="w-4 shrink-0 text-center font-mono text-[10px] font-bold txt-3">{i + 1}</span>
                <span className={cn('font-mono text-[10px] font-semibold', isBest ? 'text-brand-500 dark:text-brand-300' : 'txt-2')}>{r.id}</span>
                {showPromo && r.promoted && (
                  <span className="flex items-center gap-0.5 rounded bg-emerald-500/15 px-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400"><ArrowUp size={9} />up</span>
                )}
                <span className="ml-auto font-mono text-[10px] tabular-nums txt-3">{r.v.toFixed(2)}</span>
              </div>
              <p className="mt-0.5 line-clamp-2 pl-[22px] text-[10px] leading-snug txt-3">{snippet(r.id)}</p>
              <div className="ml-[22px] mt-1 h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', bar)} style={{ width: `${Math.max(4, r.v * 100)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide txt-3">
          <Search size={12} /> pick a query
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUERIES.map((x) => (
            <button
              key={x.id}
              onClick={() => choose(x.id)}
              className={cn('rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all',
                x.id === qid ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700')}
            >
              <span className="font-mono">“{x.text}”</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-[11px] leading-snug txt-2 dark:border-zinc-800 dark:bg-zinc-950/50">
        <Sparkles size={13} className="mt-0.5 shrink-0 text-brand-500 dark:text-brand-300" />
        <span>Truly-best answer for this query: <span className="font-mono font-bold text-brand-500 dark:text-brand-300">{q.best}</span> — {q.note}</span>
      </div>

      <div className="grid gap-2.5 md:grid-cols-3">
        <Column
          icon={<Search size={13} className="text-amber-600 dark:text-amber-400" />}
          title="Keyword" tag="TF-IDF overlap" chip="chip-amber"
          bar="from-amber-500 to-amber-400" rows={cols.keyword}
        />
        <Column
          icon={<Sparkles size={13} className="text-brand-500 dark:text-brand-300" />}
          title="Semantic" tag="cosine" chip="chip-brand"
          bar="from-brand-500 to-indigo-500" rows={cols.semantic}
        />
        <Column
          icon={<Layers size={13} className="text-emerald-600 dark:text-emerald-400" />}
          title="Hybrid + rerank" tag="blend → rerank" chip="chip-green"
          bar="from-emerald-500 to-teal-400" rows={cols.reranked} showPromo
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed txt-3">
        Keyword search nails exact terms and rare tokens but is blind to paraphrase — it can rank the right chunk low, or miss it when
        no words are shared. <span className="txt-2">Vector search</span> understands meaning, so it recovers those paraphrases.
        Production systems <span className="txt-2">combine both</span> — a weighted blend to retrieve, then a cross-encoder
        <span className="font-mono text-brand-500 dark:text-brand-300"> rerank</span> to reorder the top hits (watch the
        <span className="text-emerald-600 dark:text-emerald-400"> up</span> badge). Hybrid retrieval is the modern default.
      </p>
    </div>
  )
}
