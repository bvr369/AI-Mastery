/**
 * RAG at scale: a core retrieve-then-generate pipeline wrapped in a "production"
 * frame, surrounded by the four concerns that turn a demo into a product:
 * Caching, Latency, Cost, and Freshness. Each concern points at the pipeline
 * stage it acts on. A token rides the pipeline left→right (SMIL) for life.
 */

const label = 'fill-zinc-500 dark:fill-zinc-400'
const strong = 'fill-zinc-800 dark:fill-zinc-100'
const muted = 'fill-zinc-400 dark:fill-zinc-500'

// core pipeline stages, laid out left→right inside the production frame
const STAGES = [
  { x: 60, t: 'Query', s: 'user question', cls: 'fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700', tx: strong },
  { x: 196, t: 'Embed', s: 'query → vector', cls: 'fill-brand-500/10 stroke-brand-400/60', tx: 'fill-brand-600 dark:fill-brand-300' },
  { x: 332, t: 'Vector search', s: 'top-K nearest', cls: 'fill-sky-500/10 stroke-sky-500/55', tx: 'fill-sky-600 dark:fill-sky-400' },
  { x: 468, t: 'LLM generate', s: 'context → answer', cls: 'fill-amber-500/10 stroke-amber-500/55', tx: 'fill-amber-600 dark:fill-amber-400' },
  { x: 604, t: 'Answer', s: 'grounded reply', cls: 'fill-emerald-500/10 stroke-emerald-500/50', tx: 'fill-emerald-600 dark:fill-emerald-400' },
]

const BOX_W = 116
const BOX_H = 62
const ROW_Y = 176

// the four production concerns: which stage each targets and the takeaway
const CONCERNS = [
  {
    t: '⚡ Caching', tx: 'fill-brand-600 dark:fill-brand-300', box: 'fill-brand-500/10 stroke-brand-400/60',
    lines: ['cache query embeddings', 'reuse frequent results', 'prompt-cache stable context'],
    note: 'KV cache · callback to Module 5', target: 254, ty: 100, tx0: 190,
  },
  {
    t: '⏱ Latency', tx: 'fill-sky-600 dark:fill-sky-400', box: 'fill-sky-500/10 stroke-sky-500/55',
    lines: ['retrieval adds a hop', 'parallelize embed + search', 'keep top-K small'],
    note: 'every extra doc = more to read', target: 390, ty: 100, tx0: 570,
  },
  {
    t: '💸 Cost', tx: 'fill-amber-600 dark:fill-amber-400', box: 'fill-amber-500/10 stroke-amber-500/55',
    lines: ['embed + retrieval + generate', 'context size drives gen cost', 'lean context = cheaper tokens'],
    note: 'trim the prompt, not the answer', target: 526, ty: 342, tx0: 570,
  },
  {
    t: '🔄 Freshness', tx: 'fill-emerald-600 dark:fill-emerald-400', box: 'fill-emerald-500/10 stroke-emerald-500/50',
    lines: ['docs change over time', 're-index changed sources', 'stale index → stale answers'],
    note: 'sync the vector store', target: 390, ty: 342, tx0: 190,
  },
]

export default function DiagramProductionRAG() {
  return (
    <svg viewBox="0 0 760 448" className="w-full" role="img" aria-label="A core retrieval-augmented-generation pipeline — query, embed, vector search for the top-K nearest chunks, LLM generation, answer — wrapped in a production frame and surrounded by four concerns: caching (cache embeddings, reuse frequent results, prompt-cache stable context), latency (retrieval adds a hop, parallelize embed and search, keep top-K small), cost (embedding plus retrieval plus generation, where context size drives generation cost), and freshness (re-index changed documents).">
      <text x="380" y="22" textAnchor="middle" fontSize="14" fontWeight="700" className={strong}>RAG at scale: cost, latency, caching</text>

      {/* ── production frame wrapping the core pipeline ── */}
      <rect x="30" y="150" width="700" height="118" rx="16" className="fill-zinc-50/70 stroke-zinc-300 dark:fill-zinc-800/40 dark:stroke-zinc-700" strokeWidth="1.2" />
      <text x="46" y="146" fontSize="10" fontWeight="700" className={muted}>PRODUCTION SYSTEM · the demo is the easy part</text>

      {/* connector track + a token flowing through the whole pipeline */}
      {STAGES.slice(0, -1).map((s, i) => (
        <line key={i} x1={s.x + BOX_W} y1={ROW_Y + BOX_H / 2} x2={STAGES[i + 1].x} y2={ROW_Y + BOX_H / 2}
          className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" strokeDasharray="3 4" />
      ))}
      <circle r="4.5" cy={ROW_Y + BOX_H / 2} className="fill-brand-500">
        <animate attributeName="cx" values="176;720" dur="3.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;0.05;0.5;0.95;1" dur="3.6s" repeatCount="indefinite" />
      </circle>

      {/* core pipeline stage boxes */}
      {STAGES.map((s) => (
        <g key={s.t}>
          <rect x={s.x} y={ROW_Y} width={BOX_W} height={BOX_H} rx="11" className={s.cls} strokeWidth="1.2" />
          <text x={s.x + BOX_W / 2} y={ROW_Y + 27} textAnchor="middle" fontSize="11.5" fontWeight="700" className={s.tx}>{s.t}</text>
          <text x={s.x + BOX_W / 2} y={ROW_Y + 43} textAnchor="middle" fontSize="8.5" className={label}>{s.s}</text>
        </g>
      ))}

      {/* ── the four concern cards, targeting a pipeline stage each ── */}
      {CONCERNS.map((c) => {
        const above = c.ty < ROW_Y
        const cardH = 84
        const cardY = above ? c.ty - cardH + 18 : c.ty - 18
        const anchorY = above ? cardY + cardH : cardY
        return (
          <g key={c.t}>
            {/* dashed tie-line from concern to the stage it acts on */}
            <line x1={c.tx0} y1={anchorY} x2={c.target} y2={ROW_Y + (above ? 0 : BOX_H)}
              className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.1" strokeDasharray="2 3" />
            <circle cx={c.target} cy={ROW_Y + (above ? 0 : BOX_H)} r="2.6" className="fill-zinc-400 dark:fill-zinc-600" />

            <rect x={c.tx0 - 120} y={cardY} width="240" height={cardH} rx="12" className={c.box} strokeWidth="1.2" />
            <text x={c.tx0} y={cardY + 20} textAnchor="middle" fontSize="12" fontWeight="700" className={c.tx}>{c.t}</text>
            {c.lines.map((ln, j) => (
              <text key={j} x={c.tx0} y={cardY + 36 + j * 13} textAnchor="middle" fontSize="8.8" className={label}>{ln}</text>
            ))}
            <text x={c.tx0} y={cardY + cardH - 8} textAnchor="middle" fontSize="8" fontStyle="italic" className={muted}>{c.note}</text>
          </g>
        )
      })}

      {/* footer */}
      <text x="380" y="418" textAnchor="middle" fontSize="10.5" className={label}>A RAG demo is easy; serving it cheaply and fast at scale means caching aggressively,</text>
      <text x="380" y="434" textAnchor="middle" fontSize="10.5" className={label}>keeping context lean, and re-indexing as your documents change.</text>
    </svg>
  )
}
