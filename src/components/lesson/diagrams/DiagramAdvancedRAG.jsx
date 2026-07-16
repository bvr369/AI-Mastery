/**
 * When naive retrieval isn't enough: naive RAG (query → retrieve → generate)
 * on the left, versus the enriched pipeline on the right that layers query
 * rewriting, multi-hop retrieval, reranking, and an agentic loop on top of the
 * same core retrieve-then-generate spine. A dot animates the enriched flow.
 */

const label = 'fill-zinc-500 dark:fill-zinc-400'
const strong = 'fill-zinc-800 dark:fill-zinc-100'
const muted = 'fill-zinc-400 dark:fill-zinc-500'

// naive path: three plain stages stacked down the left
const NAIVE = [
  { y: 78, t: 'Query', s: 'the raw question', cls: 'fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700', tx: strong },
  { y: 150, t: 'Retrieve', s: 'top-k by similarity', cls: 'fill-zinc-500/10 stroke-zinc-400/50', tx: 'fill-zinc-600 dark:fill-zinc-300' },
  { y: 222, t: 'Generate', s: 'answer from context', cls: 'fill-zinc-500/10 stroke-zinc-400/50', tx: 'fill-zinc-600 dark:fill-zinc-300' },
]

// enriched add-ons layered onto the core loop, top to bottom
const UPGRADES = [
  { y: 70, t: '1 · Query rewrite / expand', s: 'vague ask → sharper search queries', cls: 'fill-brand-500/10 stroke-brand-400/60', tx: 'fill-brand-600 dark:fill-brand-300' },
  { y: 130, t: '2 · Multi-hop retrieval', s: 'retrieve → reason → retrieve again', cls: 'fill-sky-500/10 stroke-sky-500/55', tx: 'fill-sky-600 dark:fill-sky-400' },
  { y: 190, t: '3 · Rerank', s: 'fetch many → keep the best few', cls: 'fill-amber-500/10 stroke-amber-500/55', tx: 'fill-amber-600 dark:fill-amber-400' },
  { y: 250, t: '4 · Agentic RAG', s: 'model decides when & what to fetch', cls: 'fill-emerald-500/10 stroke-emerald-500/55', tx: 'fill-emerald-600 dark:fill-emerald-400' },
]

export default function DiagramAdvancedRAG() {
  return (
    <svg viewBox="0 0 760 360" className="w-full" role="img" aria-label="Naive RAG on the left is a straight line: query, retrieve top-k, generate. On the right, an enriched pipeline layers four upgrades onto the same core retrieve-then-generate loop: query rewriting and expansion turns a vague question into sharper search queries, multi-hop retrieval retrieves then reasons then retrieves again, reranking fetches many candidates and keeps the best few, and agentic RAG lets the model decide when and what to retrieve in a loop.">
      <text x="380" y="24" textAnchor="middle" fontSize="14" fontWeight="700" className={strong}>When naive retrieval isn't enough</text>

      {/* ── LEFT: naive RAG ── */}
      <text x="140" y="52" textAnchor="middle" fontSize="11" fontWeight="700" className={muted}>Naive RAG</text>
      {NAIVE.map((n, i) => (
        <g key={n.t}>
          <rect x="60" y={n.y} width="160" height="52" rx="12" className={n.cls} strokeWidth="1.2" />
          <text x="140" y={n.y + 24} textAnchor="middle" fontSize="12.5" fontWeight="700" className={n.tx}>{n.t}</text>
          <text x="140" y={n.y + 40} textAnchor="middle" fontSize="9" className={label}>{n.s}</text>
          {i < NAIVE.length - 1 && (
            <line x1="140" y1={n.y + 52} x2="140" y2={n.y + 72} className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" strokeDasharray="3 4" />
          )}
        </g>
      ))}
      <text x="140" y="298" textAnchor="middle" fontSize="9" className={muted}>fine for simple, single-fact lookups</text>
      <text x="140" y="316" textAnchor="middle" fontSize="9.5" className="fill-rose-500">✗ vague or multi-fact questions → weak context</text>

      {/* divider */}
      <line x1="290" y1="60" x2="290" y2="300" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" strokeDasharray="2 5" />

      {/* ── RIGHT: enriched pipeline ── */}
      <text x="530" y="52" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-brand-600 dark:fill-brand-300">Advanced RAG — same core loop, upgraded</text>

      {/* the shared core-loop spine the upgrades attach to */}
      <rect x="343" y="70" width="5" height="232" rx="2.5" className="fill-brand-500/25" />
      <text x="336" y="186" fontSize="8.5" transform="rotate(-90 336 186)" textAnchor="middle" className="fill-brand-500/80 dark:fill-brand-300/80">core retrieve → generate loop</text>

      {UPGRADES.map((u, i) => (
        <g key={u.t}>
          {/* connector from spine to the add-on card */}
          <line x1="348" y1={u.y + 24} x2="372" y2={u.y + 24} className="stroke-brand-400/60" strokeWidth="1.3" />
          <rect x="372" y={u.y} width="320" height="48" rx="11" className={u.cls} strokeWidth="1.2" />
          <text x="388" y={u.y + 20} fontSize="12" fontWeight="700" className={u.tx}>{u.t}</text>
          <text x="388" y={u.y + 36} fontSize="9.5" className={label}>{u.s}</text>
          {/* flowing pulse riding down the spine into each add-on */}
          <circle cx="345.5" cy={u.y + 24} r="3.5" className="fill-brand-500">
            <animate attributeName="opacity" values="0;1;0" dur="3.2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {/* agentic feedback arc — the loop that re-decides and retrieves again */}
      <path d="M692 274 C 726 274, 726 94, 692 94" fill="none" className="stroke-emerald-500/70" strokeWidth="1.4" strokeDasharray="4 4" />
      <path d="M692 94 l 6 -4 l -1 8 z" className="fill-emerald-500/80" />
      <text x="731" y="188" fontSize="8.5" transform="rotate(-90 731 188)" textAnchor="middle" className="fill-emerald-600/80 dark:fill-emerald-400/80">decide → retrieve again</text>
      <circle r="3" className="fill-emerald-500">
        <animateMotion dur="2.6s" repeatCount="indefinite" path="M692 274 C 726 274, 726 94, 692 94" />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="2.6s" repeatCount="indefinite" />
      </circle>

      {/* ── footer ── */}
      <text x="380" y="336" textAnchor="middle" fontSize="10" className={label}>Real questions often need query rewriting, multiple retrieval hops, reranking, or an agent that decides what to fetch —</text>
      <text x="380" y="352" textAnchor="middle" fontSize="10" className={muted}>each one layered on the same core RAG loop, not a replacement for it.</text>
    </svg>
  )
}
