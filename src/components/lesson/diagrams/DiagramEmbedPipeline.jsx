/**
 * The RAG ingestion pipeline, left → right: raw documents are split into
 * overlapping chunks, each chunk is embedded into a vector, and the
 * chunk+vector pairs are indexed in a vector database for fast nearest-neighbor
 * search. A SMIL dot rides a document through all four stages.
 */

const label = 'fill-zinc-500 dark:fill-zinc-400'
const strong = 'fill-zinc-800 dark:fill-zinc-100'
const muted = 'fill-zinc-400 dark:fill-zinc-500'

// four stages, evenly spaced across the flow
const STAGES = [
  { x: 24, title: '1 · Documents', sub: 'PDF · HTML · markdown', cls: 'fill-sky-500/10 stroke-sky-500/50', text: 'fill-sky-600 dark:fill-sky-400' },
  { x: 210, title: '2 · Chunking', sub: 'split into overlapping pieces', cls: 'fill-amber-500/10 stroke-amber-500/55', text: 'fill-amber-600 dark:fill-amber-400' },
  { x: 396, title: '3 · Embedding model', sub: 'each chunk → a vector', cls: 'fill-brand-500/10 stroke-brand-400/60', text: 'fill-brand-600 dark:fill-brand-300' },
  { x: 582, title: '4 · Vector DB', sub: 'indexed for search', cls: 'fill-emerald-500/10 stroke-emerald-500/50', text: 'fill-emerald-600 dark:fill-emerald-400' },
]

const VEC = [0.12, -0.44, 0.87, 0.05]

export default function DiagramEmbedPipeline() {
  return (
    <svg viewBox="0 0 760 300" className="w-full" role="img" aria-label="Ingestion pipeline: raw documents are split into overlapping chunks, each chunk is passed through an embedding model to produce a vector, and the chunk-plus-vector pairs are stored and indexed in a vector database for fast nearest-neighbor search.">
      <text x="380" y="22" textAnchor="middle" fontSize="14" fontWeight="700" className={strong}>From documents to a searchable index</text>

      {/* stage frames */}
      {STAGES.map((s) => (
        <g key={s.title}>
          <rect x={s.x} y="52" width="154" height="176" rx="14" className={s.cls} strokeWidth="1.2" />
          <text x={s.x + 77} y="74" textAnchor="middle" fontSize="12" fontWeight="700" className={s.text}>{s.title}</text>
          <text x={s.x + 77} y="90" textAnchor="middle" fontSize="9" className={label}>{s.sub}</text>
        </g>
      ))}

      {/* connectors between stages */}
      {[0, 1, 2].map((i) => {
        const cx = 178 + i * 186
        return (
          <g key={i}>
            <line x1={cx} y1="140" x2={cx + 32} y2="140" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" strokeDasharray="3 4" />
            <path d={`M${cx + 30} 136 l 6 4 l -6 4`} fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" />
          </g>
        )
      })}

      {/* ── Stage 1: documents ── */}
      {[
        { dx: 30, dy: 108, c: 'fill-sky-500/70' },
        { dx: 52, dy: 118, c: 'fill-sky-500/85' },
        { dx: 74, dy: 128, c: 'fill-sky-500' },
      ].map((d, i) => (
        <g key={i}>
          <rect x={d.dx} y={d.dy} width="52" height="66" rx="5" className="fill-white stroke-sky-500/60 dark:fill-zinc-900" strokeWidth="1.2" />
          <line x1={d.dx + 9} y1={d.dy + 14} x2={d.dx + 43} y2={d.dy + 14} className="stroke-sky-500/50" strokeWidth="1.4" />
          <line x1={d.dx + 9} y1={d.dy + 24} x2={d.dx + 43} y2={d.dy + 24} className="stroke-sky-500/40" strokeWidth="1.4" />
          <line x1={d.dx + 9} y1={d.dy + 34} x2={d.dx + 34} y2={d.dy + 34} className="stroke-sky-500/40" strokeWidth="1.4" />
          <line x1={d.dx + 9} y1={d.dy + 44} x2={d.dx + 43} y2={d.dy + 44} className="stroke-sky-500/40" strokeWidth="1.4" />
        </g>
      ))}
      <text x="101" y="216" textAnchor="middle" fontSize="8.5" className={muted}>a knowledge base</text>

      {/* ── Stage 2: chunks (overlapping pieces) ── */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={230 + (i % 2) * 10} y={104 + i * 26} width="94" height="20" rx="5"
            className="fill-amber-500/15 stroke-amber-500/55" strokeWidth="1.1" />
          <line x1={238 + (i % 2) * 10} y1={114 + i * 26} x2={300 + (i % 2) * 10} y2={114 + i * 26} className="stroke-amber-500/60" strokeWidth="1.3" />
        </g>
      ))}
      {/* overlap brackets */}
      <path d="M326 124 q 8 4 0 8" fill="none" className="stroke-amber-500/70" strokeWidth="1.3" />
      <path d="M326 150 q 8 4 0 8" fill="none" className="stroke-amber-500/70" strokeWidth="1.3" />
      <text x="287" y="216" textAnchor="middle" fontSize="8.5" className={muted}>~overlap keeps context</text>

      {/* ── Stage 3: embedding model → vector ── */}
      <rect x="416" y="106" width="114" height="42" rx="10" className="fill-brand-500/12 stroke-brand-400/60" strokeWidth="1.2" />
      <text x="473" y="126" textAnchor="middle" fontSize="10.5" fontWeight="700" className="fill-brand-600 dark:fill-brand-300">embed( )</text>
      <text x="473" y="140" textAnchor="middle" fontSize="8" className={label}>neural encoder</text>
      {/* vector output */}
      <g>
        {VEC.map((v, i) => (
          <g key={i}>
            <rect x={420 + i * 27} y="162" width="24" height="20" rx="4" className="fill-brand-500/15 stroke-brand-400/50" strokeWidth="1" />
            <text x={432 + i * 27} y="176" textAnchor="middle" fontSize="7.5" fontFamily="monospace" className="fill-brand-600 dark:fill-brand-300">{v}</text>
          </g>
        ))}
      </g>
      <text x="473" y="200" textAnchor="middle" fontSize="8" className={muted}>a point in meaning-space</text>
      <text x="473" y="214" textAnchor="middle" fontSize="8.5" className={muted}>(really ~1536 dims)</text>

      {/* ── Stage 4: vector DB ── */}
      <g>
        {/* database cylinder */}
        <ellipse cx="659" cy="112" rx="42" ry="10" className="fill-emerald-500/20 stroke-emerald-500/60" strokeWidth="1.2" />
        <path d="M617 112 L617 178 A42 10 0 0 0 701 178 L701 112" fill="none" className="stroke-emerald-500/60" strokeWidth="1.2" />
        <path d="M617 112 L617 178 A42 10 0 0 0 701 178 L701 112 Z" className="fill-emerald-500/8" />
        {[0, 1, 2].map((i) => (
          <ellipse key={i} cx="659" cy={134 + i * 20} rx="42" ry="10" fill="none" className="stroke-emerald-500/35" strokeWidth="1" />
        ))}
        <text x="659" y="118" textAnchor="middle" fontSize="8.5" fontFamily="monospace" className="fill-emerald-600 dark:fill-emerald-400">[chunk + vec]</text>
        <text x="659" y="150" textAnchor="middle" fontSize="8.5" fontFamily="monospace" className="fill-emerald-600 dark:fill-emerald-400">[chunk + vec]</text>
        <text x="659" y="170" textAnchor="middle" fontSize="8.5" fontFamily="monospace" className="fill-emerald-600 dark:fill-emerald-400">[chunk + vec]</text>
      </g>
      <text x="659" y="200" textAnchor="middle" fontSize="8.5" className={muted}>ANN index · fast search</text>
      <text x="659" y="214" textAnchor="middle" fontSize="8" className={muted}>e.g. Pinecone · pgvector</text>

      {/* ── the document that rides through every stage (SMIL) ── */}
      <g>
        <rect x="-8" y="-11" width="16" height="20" rx="2.5" className="fill-brand-500 stroke-white/70 dark:stroke-zinc-900" strokeWidth="1">
          <animate attributeName="opacity" values="0;1;1;1;1;0" keyTimes="0;0.05;0.4;0.6;0.95;1" dur="6s" repeatCount="indefinite" />
        </rect>
        <animateMotion dur="6s" repeatCount="indefinite" keyPoints="0;0.28;0.32;0.62;0.66;1" keyTimes="0;0.28;0.4;0.6;0.72;1" calcMode="linear"
          path="M101 240 L287 240 L287 240 L473 240 L473 240 L659 240" />
      </g>
      <line x1="24" y1="240" x2="736" y2="240" className="stroke-brand-400/25" strokeWidth="1" strokeDasharray="2 5" />

      {/* footer */}
      <text x="380" y="266" textAnchor="middle" fontSize="10" className={label}>This one-time ingestion builds the index. Documents in → chunks → vectors → a store you can search.</text>
      <text x="380" y="284" textAnchor="middle" fontSize="9.5" className={muted}>At query time you run the same embedding model on the question, then search this store for the nearest chunks.</text>
    </svg>
  )
}
