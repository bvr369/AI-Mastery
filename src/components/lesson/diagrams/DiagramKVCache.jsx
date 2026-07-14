/**
 * Why long context costs more.
 * Top: no cache — each step re-processes every previous token (quadratic).
 * Bottom: KV cache — old K/V stored & reused, only the new token is computed,
 * but the cache grows with context so memory scales with length.
 */

const STEPS = [3, 4, 5, 6] // context length at each generation step
const CELL = 26
const GAP = 6
const cellX = (i) => 150 + i * (CELL + GAP)

export default function DiagramKVCache() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const strong = 'fill-zinc-800 dark:fill-zinc-100'

  return (
    <svg viewBox="0 0 760 340" className="w-full" role="img" aria-label="Without a KV cache the model re-processes every previous token each step (quadratic work); with a KV cache it stores and reuses past key/value vectors and only computes the new token, but the cache grows with context length so memory scales with context">
      <text x="20" y="26" fontSize="15" fontWeight="700" className={strong}>Why long context costs more</text>

      {/* ── Row 1: Without a cache ─────────────────────────── */}
      <text x="20" y="58" fontSize="12" fontWeight="700" className="fill-rose-600 dark:fill-rose-400">Without a cache</text>
      <text x="20" y="74" fontSize="9.5" className={label}>re-process every</text>
      <text x="20" y="86" fontSize="9.5" className={label}>token, every step</text>

      {STEPS.map((n, si) => {
        const y = 46 + si * 30
        return (
          <g key={`nc-${n}`}>
            <text x="140" y={y + 19} textAnchor="end" fontSize="10" className={label}>step {si + 1}</text>
            {Array.from({ length: n }).map((_, i) => (
              <rect key={i} x={cellX(i)} y={y} width={CELL} height="22" rx="5"
                className="fill-rose-500/15 stroke-rose-500/50" strokeWidth="1">
                <animate attributeName="opacity" values="0.15;1;1" keyTimes="0;0.5;1"
                  dur="2.4s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
              </rect>
            ))}
            <text x={cellX(n) + 8} y={y + 16} fontSize="10" fontWeight="600" className="fill-rose-600 dark:fill-rose-400">{n} recomputed</text>
          </g>
        )
      })}
      <text x="150" y="180" fontSize="10.5" className={label}>work per step grows with length → total is <tspan fontWeight="700" className="fill-rose-600 dark:fill-rose-400">quadratic</tspan></text>

      {/* divider */}
      <line x1="20" y1="196" x2="740" y2="196" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="1" />

      {/* ── Row 2: With a KV cache ─────────────────────────── */}
      <text x="20" y="222" fontSize="12" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">With a KV cache</text>
      <text x="20" y="238" fontSize="9.5" className={label}>reuse stored K/V,</text>
      <text x="20" y="250" fontSize="9.5" className={label}>compute only the new</text>

      {STEPS.map((n, si) => {
        const y = 210 + si * 30
        return (
          <g key={`kv-${n}`}>
            <text x="140" y={y + 19} textAnchor="end" fontSize="10" className={label}>step {si + 1}</text>
            {/* cached (reused) cells — grayed */}
            {Array.from({ length: n - 1 }).map((_, i) => (
              <rect key={i} x={cellX(i)} y={y} width={CELL} height="22" rx="5"
                className="fill-zinc-200/70 stroke-zinc-300 dark:fill-zinc-800 dark:stroke-zinc-700" strokeWidth="1" />
            ))}
            {/* the single new token actually computed */}
            <rect x={cellX(n - 1)} y={y} width={CELL} height="22" rx="5"
              className="fill-emerald-500/25 stroke-emerald-500" strokeWidth="1.2">
              <animate attributeName="opacity" values="0.2;1;1" keyTimes="0;0.4;1"
                dur="2.4s" begin={`${si * 0.3}s`} repeatCount="indefinite" />
            </rect>
            <text x={cellX(n) + 8} y={y + 16} fontSize="10" className={label}>
              <tspan fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">1</tspan> new · <tspan className="fill-zinc-400 dark:fill-zinc-500">{n - 1} cached</tspan>
            </text>
          </g>
        )
      })}

      {/* growing cache bracket */}
      <line x1="150" y1="332" x2={cellX(STEPS[STEPS.length - 1]) - GAP} y2="332" className="stroke-emerald-500/50" strokeWidth="1.5" strokeDasharray="3 4" />
      <text x="150" y="328" fontSize="10.5" className={label}>constant work per step, but the <tspan fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">cache grows</tspan> → memory scales with context</text>

      {/* legend */}
      <g fontSize="9.5">
        <rect x="560" y="18" width="14" height="12" rx="3" className="fill-emerald-500/25 stroke-emerald-500" strokeWidth="1" />
        <text x="580" y="28" className={label}>computed now</text>
        <rect x="560" y="34" width="14" height="12" rx="3" className="fill-zinc-200/70 stroke-zinc-300 dark:fill-zinc-800 dark:stroke-zinc-700" strokeWidth="1" />
        <text x="580" y="44" className={label}>cached / reused</text>
      </g>
    </svg>
  )
}
