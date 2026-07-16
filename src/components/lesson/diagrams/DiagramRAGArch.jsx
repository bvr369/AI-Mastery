/**
 * The signature RAG map, end to end. Two flows share one Vector DB:
 * INGEST (one-time, top): Documents → Chunk → Embed → write vectors into the index.
 * QUERY (per request, bottom): question → Embed → Retrieve top-K → Augment
 * (system + context + question) → LLM → Grounded answer with citations.
 * A brand dot rides the generate path (retrieve → augment → LLM → answer) via SMIL.
 */

const ink = 'fill-zinc-800 dark:fill-zinc-100'
const label = 'fill-zinc-500 dark:fill-zinc-400'
const muted = 'fill-zinc-400 dark:fill-zinc-500'

const SKY = { box: 'fill-sky-500/10 stroke-sky-500/50', tx: 'fill-sky-600 dark:fill-sky-400' }
const AMBER = { box: 'fill-amber-500/10 stroke-amber-500/55', tx: 'fill-amber-600 dark:fill-amber-400' }
const BRAND = { box: 'fill-brand-500/10 stroke-brand-400/60', tx: 'fill-brand-600 dark:fill-brand-300' }

// INGEST chain (top) — one-time index build
const INGEST = [
  { x: 40, w: 140, t: 'Documents', s: 'PDFs · docs · pages' },
  { x: 210, w: 110, t: 'Chunk', s: 'split into passages' },
  { x: 350, w: 120, t: 'Embed', s: 'passage → vector' },
]

// QUERY chain (bottom) — per request. First three amber, generate path brand.
const QUERY = [
  { x: 22, w: 118, t: 'User question', s: '“how do I…?”', c: AMBER },
  { x: 154, w: 96, t: 'Embed', s: 'same model', c: AMBER },
  { x: 264, w: 104, t: 'Retrieve', s: 'top-K nearest', c: AMBER },
  { x: 382, w: 110, t: 'Augment', s: 'build the prompt', c: BRAND },
  { x: 506, w: 92, t: 'LLM', s: 'generate', c: BRAND },
  { x: 612, w: 126, t: 'Grounded answer', s: 'with citations', c: BRAND },
]

// horizontal connectors: [x1, x2, y, colorClass, delay]
const arrow = 'stroke-zinc-400 dark:stroke-zinc-600'
const INGEST_ARR = [[180, 210, 91], [320, 350, 91]]
const QUERY_IN = [[140, 154, 393], [250, 264, 393]] // amber input arrows
const QUERY_GEN = [[368, 382, 393], [492, 506, 393], [598, 612, 393]] // brand generate arrows

export default function DiagramRAGArch() {
  return (
    <svg viewBox="0 0 760 470" className="w-full" role="img" aria-label="Retrieval-Augmented Generation end to end. Ingest (one-time, top): documents are chunked, embedded into vectors, and written into a shared vector database. Query (per request, bottom): the user question is embedded, the top-K nearest chunks are retrieved from the same vector database, an augmented prompt is built from the system message plus retrieved context plus the question, the LLM generates from it, and returns a grounded answer with citations.">
      <text x="380" y="24" textAnchor="middle" fontSize="14" fontWeight="800" className={ink}>Retrieval-Augmented Generation, end to end</text>

      {/* ── section labels ── */}
      <text x="40" y="52" fontSize="10.5" fontWeight="700" className="fill-sky-600 dark:fill-sky-400">INGEST · build the index once</text>
      <text x="22" y="352" fontSize="10.5" fontWeight="700" className="fill-amber-600 dark:fill-amber-400">QUERY · every request</text>

      {/* ── INGEST boxes ── */}
      {INGEST.map((b) => (
        <g key={b.t}>
          <rect x={b.x} y="66" width={b.w} height="50" rx="12" className={SKY.box} strokeWidth="1.2" />
          <text x={b.x + b.w / 2} y="88" textAnchor="middle" fontSize="12" fontWeight="700" className={SKY.tx}>{b.t}</text>
          <text x={b.x + b.w / 2} y="104" textAnchor="middle" fontSize="8.5" className={label}>{b.s}</text>
        </g>
      ))}
      {/* documents raining in */}
      {[0, 1, 2].map((i) => (
        <text key={i} x={54 + i * 34} y="42" fontSize="11" className="fill-sky-500/80">
          📄
          <animate attributeName="y" values="36;60" dur="1.7s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="1.7s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
        </text>
      ))}
      {INGEST_ARR.map(([x1, x2, y], i) => (
        <g key={i}>
          <line x1={x1 + 2} y1={y} x2={x2 - 2} y2={y} className={arrow} strokeWidth="1.5" strokeDasharray="3 4" />
          <circle r="3.2" cy={y} className="fill-sky-500">
            <animate attributeName="cx" values={`${x1 + 3};${x2 - 3}`} dur="1.5s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {/* ── WRITE path: Embed → Vector DB (sky, dashed) ── */}
      <path d="M410 118 C 410 148, 380 150, 372 162" fill="none" className="stroke-sky-500/70" strokeWidth="1.5" strokeDasharray="4 4" />
      <text x="426" y="146" fontSize="8.5" className="fill-sky-600 dark:fill-sky-400">write vectors</text>
      <circle r="3.2" className="fill-sky-500">
        <animateMotion path="M410 118 C 410 148, 380 150, 372 162" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;1;0" dur="1.6s" repeatCount="indefinite" />
      </circle>

      {/* ── VECTOR DB cylinder (shared, emerald) ── */}
      <path d="M278 178 v100 a92 16 0 0 0 184 0 v-100" className="fill-emerald-500/12 stroke-emerald-500/55" strokeWidth="1.3" />
      <ellipse cx="370" cy="178" rx="92" ry="16" className="fill-emerald-500/20 stroke-emerald-500/55" strokeWidth="1.3" />
      {/* stored-vector rows for texture */}
      {[0, 1, 2].map((r) => (
        <g key={r}>
          {[0, 1, 2, 3, 4].map((c) => (
            <rect key={c} x={300 + c * 28} y={252 + r * 12} width="20" height="4" rx="2" className="fill-emerald-500/45">
              <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.4s" begin={`${(r * 5 + c) * 0.12}s`} repeatCount="indefinite" />
            </rect>
          ))}
        </g>
      ))}
      <text x="370" y="200" textAnchor="middle" fontSize="13" fontWeight="800" className="fill-emerald-600 dark:fill-emerald-400">🗄 Vector DB</text>
      <text x="370" y="216" textAnchor="middle" fontSize="9" className={label}>embeddings index · shared by both flows</text>
      <text x="370" y="304" textAnchor="middle" fontSize="8.5" className={muted}>nearest-neighbor search · cosine similarity</text>

      {/* ── READ path: Vector DB → Retrieve (amber) ── */}
      <path d="M340 300 C 330 330, 320 336, 316 364" fill="none" className="stroke-amber-500/75" strokeWidth="1.5" strokeDasharray="4 4" />
      <text x="238" y="332" fontSize="8.5" className="fill-amber-600 dark:fill-amber-400">read top-K chunks</text>
      <circle r="3.2" className="fill-amber-500">
        <animateMotion path="M340 300 C 330 330, 320 336, 316 364" dur="1.6s" begin="0.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;1;0" dur="1.6s" begin="0.4s" repeatCount="indefinite" />
      </circle>

      {/* ── QUERY boxes ── */}
      {QUERY.map((b) => (
        <g key={b.t}>
          <rect x={b.x} y="364" width={b.w} height="54" rx="12" className={b.c.box} strokeWidth="1.2" />
          <text x={b.x + b.w / 2} y="386" textAnchor="middle" fontSize="11.5" fontWeight="700" className={b.c.tx}>{b.t}</text>
          <text x={b.x + b.w / 2} y="402" textAnchor="middle" fontSize="8.5" className={label}>{b.s}</text>
        </g>
      ))}
      {/* Augment recipe callout */}
      <text x="437" y="434" textAnchor="middle" fontSize="8" className="fill-brand-600 dark:fill-brand-300">prompt = system + context + question</text>

      {/* amber input arrows */}
      {QUERY_IN.map(([x1, x2, y], i) => (
        <g key={i}>
          <line x1={x1 + 2} y1={y} x2={x2 - 2} y2={y} className={arrow} strokeWidth="1.5" strokeDasharray="3 4" />
          <circle r="3.2" cy={y} className="fill-amber-500">
            <animate attributeName="cx" values={`${x1 + 3};${x2 - 3}`} dur="1.4s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;0" dur="1.4s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      {/* brand generate arrows — the query flows through to a grounded answer */}
      {QUERY_GEN.map(([x1, x2, y], i) => (
        <g key={i}>
          <line x1={x1 + 2} y1={y} x2={x2 - 2} y2={y} className="stroke-brand-400/70" strokeWidth="1.7" strokeDasharray="3 4" />
          <circle r="3.6" cy={y} className="fill-brand-500">
            <animate attributeName="cx" values={`${x1 + 3};${x2 - 3}`} dur="1.2s" begin={`${0.9 + i * 0.4}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin={`${0.9 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {/* ── footer ── */}
      <text x="380" y="452" textAnchor="middle" fontSize="10.5" className={label}>Ingest builds the index once; every question embeds, retrieves the relevant chunks, and generates grounded in them.</text>
      <text x="380" y="466" textAnchor="middle" fontSize="9" className={muted}>The Vector DB is the one shared component — written once at ingest, read on every query.</text>
    </svg>
  )
}
