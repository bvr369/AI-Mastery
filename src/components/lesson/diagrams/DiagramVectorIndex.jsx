/**
 * How vector DBs find nearest neighbors fast: brute-force scan (compare the
 * query against every stored vector — exact but O(N)) vs an ANN index (an
 * HNSW-style navigable graph where search hops through a few connected nodes
 * to land in the right neighborhood — approximate but sub-linear).
 * A dot animates the graph hops (SMIL) to show the search walking to the cluster.
 */

const label = 'fill-zinc-500 dark:fill-zinc-400'
const strong = 'fill-zinc-800 dark:fill-zinc-100'

// scattered corpus vectors for the brute-force panel (curated positions)
const CORPUS = [
  [70, 78], [118, 60], [96, 118], [150, 96], [64, 140],
  [190, 70], [178, 128], [128, 150], [214, 108], [92, 168],
  [160, 168], [224, 158], [58, 108], [196, 176],
]

// HNSW-style graph nodes for the ANN panel; the last few form the target cluster
const NODES = [
  { id: 0, x: 470, y: 92 },   // entry point
  { id: 1, x: 545, y: 70 },
  { id: 2, x: 560, y: 148 },
  { id: 3, x: 628, y: 112 },
  { id: 4, x: 660, y: 168 },  // cluster
  { id: 5, x: 690, y: 132 },  // cluster
  { id: 6, x: 638, y: 176 },  // cluster (nearest)
]
// undirected edges of the navigable small-world graph
const EDGES = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 6], [3, 5], [3, 4], [4, 6], [5, 4], [1, 2]]
// the greedy hop path the search follows: entry → … → nearest
const PATH = [0, 2, 3, 4, 6]

export default function DiagramVectorIndex() {
  const hop = (i) => NODES[PATH[i]]
  return (
    <svg viewBox="0 0 760 470" className="w-full" role="img" aria-label="Two ways a vector database finds nearest neighbors. Top, brute force: the query vector is compared against every stored vector, which is exact but scales linearly and is too slow for millions. Bottom, an approximate-nearest-neighbor index in the HNSW style: a small navigable graph where the search enters at one node and hops along a few edges to reach the nearest cluster, which is approximate but sub-linear and dramatically faster.">
      <text x="380" y="22" textAnchor="middle" fontSize="14" fontWeight="700" className={strong}>How vector DBs search millions of vectors fast</text>

      {/* ─────────────── TOP: BRUTE FORCE ─────────────── */}
      <rect x="24" y="40" width="712" height="184" rx="16" className="fill-rose-500/[0.06] stroke-rose-500/40" strokeWidth="1.2" />
      <text x="44" y="64" fontSize="12.5" fontWeight="700" className="fill-rose-600 dark:fill-rose-400">Brute force — scan every vector</text>
      <text x="44" y="80" fontSize="9.5" className={label}>compare the query to all N stored vectors, one by one</text>

      {/* query on the left */}
      <circle cx="300" cy="118" r="9" className="fill-brand-500" />
      <text x="300" y="122" textAnchor="middle" fontSize="9" fontWeight="800" className="fill-white">q</text>
      <text x="300" y="150" textAnchor="middle" fontSize="9" className={label}>query</text>

      {/* a comparison line to EVERY corpus vector */}
      {CORPUS.map(([x, y], i) => (
        <line key={i} x1="300" y1="118" x2={x} y2={y} className="stroke-rose-400/45 dark:stroke-rose-400/35" strokeWidth="1">
          <animate attributeName="opacity" values="0.15;0.8;0.15" dur="1.6s" begin={`${(i % 7) * 0.12}s`} repeatCount="indefinite" />
        </line>
      ))}
      {CORPUS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" className="fill-zinc-400/70 dark:fill-zinc-500/70" />
      ))}

      <g transform="translate(596 96)">
        <rect x="0" y="0" width="120" height="58" rx="10" className="fill-white/70 stroke-rose-500/40 dark:fill-zinc-900/60" strokeWidth="1" />
        <text x="60" y="22" textAnchor="middle" fontSize="14" fontWeight="800" className="fill-rose-600 dark:fill-rose-400">O(N)</text>
        <text x="60" y="38" textAnchor="middle" fontSize="9" className={label}>exact result</text>
        <text x="60" y="51" textAnchor="middle" fontSize="9" className={label}>too slow at millions</text>
      </g>

      {/* ─────────────── BOTTOM: ANN INDEX ─────────────── */}
      <rect x="24" y="240" width="712" height="184" rx="16" className="fill-emerald-500/[0.06] stroke-emerald-500/40" strokeWidth="1.2" />
      <text x="44" y="264" fontSize="12.5" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">ANN index (HNSW) — hop through a graph</text>
      <text x="44" y="280" fontSize="9.5" className={label}>a navigable small-world graph; greedily walk edges toward the query</text>

      {/* query enters from the left */}
      <circle cx="300" cy="330" r="9" className="fill-brand-500" />
      <text x="300" y="334" textAnchor="middle" fontSize="9" fontWeight="800" className="fill-white">q</text>
      <text x="300" y="358" textAnchor="middle" fontSize="9" className={label}>query enters</text>

      {/* target cluster halo */}
      <circle cx="662" cy="150" r="46" className="fill-emerald-500/10 stroke-emerald-500/40" strokeWidth="1" strokeDasharray="4 4" transform="translate(0 200)" />
      <text x="662" y="404" textAnchor="middle" fontSize="9" className="fill-emerald-600 dark:fill-emerald-400">nearest cluster</text>

      {/* graph edges (shifted into the bottom panel: +200 on y) */}
      {EDGES.map(([a, b], i) => (
        <line key={i} x1={NODES[a].x} y1={NODES[a].y + 200} x2={NODES[b].x} y2={NODES[b].y + 200}
          className="stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="1.2" />
      ))}

      {/* entry link from the query into the graph entry point */}
      <line x1="309" y1="330" x2={NODES[0].x} y2={NODES[0].y + 200} className="stroke-emerald-400/60" strokeWidth="1.4" strokeDasharray="3 4" />

      {/* highlight the greedy hop path */}
      {PATH.slice(0, -1).map((_, i) => (
        <line key={i} x1={hop(i).x} y1={hop(i).y + 200} x2={hop(i + 1).x} y2={hop(i + 1).y + 200}
          className="stroke-emerald-500" strokeWidth="2.4">
          <animate attributeName="opacity" values="0.25;1;0.25" dur="2.4s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
        </line>
      ))}

      {/* graph nodes */}
      {NODES.map((n) => {
        const inCluster = n.id >= 4
        return (
          <circle key={n.id} cx={n.x} cy={n.y + 200} r={n.id === 0 ? 7 : 6}
            className={n.id === 0 ? 'fill-brand-500' : inCluster ? 'fill-emerald-500' : 'fill-zinc-400/80 dark:fill-zinc-500/80'} />
        )
      })}
      <text x={NODES[0].x} y={NODES[0].y + 182} textAnchor="middle" fontSize="8" className={label}>entry</text>

      {/* the search token hopping along the path */}
      <circle r="5.5" className="fill-brand-500 stroke-white dark:stroke-zinc-900" strokeWidth="1.4">
        <animate attributeName="cx" dur="2.4s" repeatCount="indefinite"
          values={`${hop(0).x};${hop(1).x};${hop(2).x};${hop(3).x};${hop(4).x};${hop(4).x}`}
          keyTimes="0;0.2;0.4;0.6;0.8;1" />
        <animate attributeName="cy" dur="2.4s" repeatCount="indefinite"
          values={`${hop(0).y + 200};${hop(1).y + 200};${hop(2).y + 200};${hop(3).y + 200};${hop(4).y + 200};${hop(4).y + 200}`}
          keyTimes="0;0.2;0.4;0.6;0.8;1" />
        <animate attributeName="opacity" values="0;1;1;1;1;0" keyTimes="0;0.05;0.3;0.6;0.85;1" dur="2.4s" repeatCount="indefinite" />
      </circle>

      <g transform="translate(44 372)">
        <rect x="0" y="0" width="150" height="40" rx="10" className="fill-white/70 stroke-emerald-500/40 dark:fill-zinc-900/60" strokeWidth="1" />
        <text x="12" y="18" fontSize="12.5" fontWeight="800" className="fill-emerald-600 dark:fill-emerald-400">~99% recall</text>
        <text x="12" y="32" fontSize="9" className={label}>a few hops, not N compares</text>
      </g>

      {/* ── footer ── */}
      <text x="380" y="446" textAnchor="middle" fontSize="10.5" className={label}>ANN trades a tiny bit of recall for a huge speedup — the reason semantic search is practical at scale.</text>
      <text x="380" y="462" textAnchor="middle" fontSize="9.5" className="fill-zinc-400 dark:fill-zinc-500">How Pinecone, pgvector, Qdrant, and Chroma scale nearest-neighbor search to millions of vectors.</text>
    </svg>
  )
}
