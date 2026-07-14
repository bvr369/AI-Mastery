/** Streaming vs waiting: same total time, wildly different felt latency. */

export default function DiagramStreaming() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const strong = 'fill-zinc-800 dark:fill-zinc-100'

  return (
    <svg viewBox="0 0 760 280" className="w-full" role="img" aria-label="Without streaming the user stares at a spinner then gets everything at once; with streaming tokens appear immediately as server-sent events">
      <text x="380" y="24" textAnchor="middle" fontSize="13" fontWeight="700" className={strong}>Same 6-second generation. Completely different experience.</text>

      {/* timeline axis */}
      <line x1="120" y1="245" x2="700" y2="245" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" />
      {[0, 2, 4, 6].map((s) => (
        <g key={s}>
          <line x1={120 + s * 95} y1="242" x2={120 + s * 95} y2="248" className="stroke-zinc-400 dark:stroke-zinc-600" />
          <text x={120 + s * 95} y="262" textAnchor="middle" fontSize="9" className={label}>{s}s</text>
        </g>
      ))}

      {/* without streaming */}
      <text x="30" y="85" fontSize="11" fontWeight="700" className="fill-rose-500">await json()</text>
      <text x="30" y="100" fontSize="9" className={label}>no streaming</text>
      <rect x="120" y="66" width="560" height="40" rx="8" className="fill-zinc-500/10 stroke-zinc-400/40 dark:stroke-zinc-600" strokeDasharray="4 4" />
      <text x="390" y="90" textAnchor="middle" fontSize="10" className={label}>😐 spinner… nothing… still nothing…</text>
      <rect x="628" y="66" width="52" height="40" rx="8" className="fill-rose-500/20 stroke-rose-500/60">
        <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.85;0.9;1" dur="6s" repeatCount="indefinite" />
      </rect>
      <text x="654" y="90" textAnchor="middle" fontSize="9" fontWeight="700" className="fill-rose-500">ALL AT
        <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.85;0.9;1" dur="6s" repeatCount="indefinite" />
      </text>

      {/* with streaming */}
      <text x="30" y="165" fontSize="11" fontWeight="700" className="fill-emerald-500">SSE stream</text>
      <text x="30" y="180" fontSize="9" className={label}>token by token</text>
      {Array.from({ length: 18 }, (_, i) => (
        <rect key={i} x={128 + i * 31} y="146" width="24" height="40" rx="6" className="fill-emerald-500/20 stroke-emerald-500/50">
          <animate attributeName="opacity" values="0;0;1;1" keyTimes={`0;${(0.06 + i * 0.05).toFixed(2)};${(0.1 + i * 0.05).toFixed(2)};1`} dur="6s" repeatCount="indefinite" />
        </rect>
      ))}
      <text x="128" y="205" fontSize="9" className="fill-emerald-600 dark:fill-emerald-400">😀 first token at ~0.4s (TTFT) — user starts READING while the rest generates</text>

      <text x="380" y="230" textAnchor="middle" fontSize="10" className={label}>Total latency identical. Perceived latency: ~15x better. This is why every serious chat product streams.</text>
    </svg>
  )
}
