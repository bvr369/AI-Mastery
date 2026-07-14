/** Exponential backoff timeline vs naive hammering. */

export default function DiagramBackoff() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'

  const naive = [0, 30, 60, 90, 120, 150]
  const backoff = [
    { x: 0, ok: false, note: 'fail' },
    { x: 60, ok: false, note: '+1s' },
    { x: 180, ok: false, note: '+2s' },
    { x: 420, ok: true, note: '+4s ✓' },
  ]

  return (
    <svg viewBox="0 0 760 250" className="w-full" role="img" aria-label="Naive instant retries keep hitting the rate limit; exponential backoff with growing waits succeeds">
      <text x="380" y="24" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-zinc-800 dark:fill-zinc-100">Two ways to retry a 429</text>

      {/* naive row */}
      <text x="30" y="80" fontSize="11" fontWeight="700" className="fill-rose-500">Naive: retry instantly</text>
      <line x1="220" y1="76" x2="700" y2="76" className="stroke-zinc-300 dark:stroke-zinc-700" />
      {naive.map((x, i) => (
        <g key={i}>
          <circle cx={230 + x} cy="76" r="9" className="fill-rose-500/20 stroke-rose-500" strokeWidth="1.5">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
          </circle>
          <text x={230 + x} y="80" textAnchor="middle" fontSize="9" fontWeight="700" className="fill-rose-500">✗</text>
        </g>
      ))}
      <text x="230" y="108" fontSize="9.5" className="fill-rose-400">hammers the limiter → every retry ALSO 429s → and you look like an attack</text>

      {/* backoff row */}
      <text x="30" y="160" fontSize="11" fontWeight="700" className="fill-emerald-500">Exponential backoff + jitter</text>
      <line x1="220" y1="156" x2="700" y2="156" className="stroke-zinc-300 dark:stroke-zinc-700" />
      {backoff.map((r, i) => (
        <g key={i}>
          <circle cx={230 + r.x} cy="156" r="9" className={r.ok ? 'fill-emerald-500/25 stroke-emerald-500' : 'fill-amber-500/20 stroke-amber-500'} strokeWidth="1.5" />
          <text x={230 + r.x} y="160" textAnchor="middle" fontSize="9" fontWeight="700" className={r.ok ? 'fill-emerald-500' : 'fill-amber-500'}>{r.ok ? '✓' : '✗'}</text>
          <text x={230 + r.x} y="182" textAnchor="middle" fontSize="8.5" className={label}>{r.note}</text>
          {i < backoff.length - 1 && (
            <path d={`M ${239 + r.x} 148 Q ${230 + (r.x + backoff[i + 1].x) / 2} 130, ${221 + backoff[i + 1].x} 148`} fill="none" className="stroke-emerald-500/50" strokeWidth="1.2" strokeDasharray="3 3" />
          )}
        </g>
      ))}
      <text x="230" y="210" fontSize="9.5" className="fill-emerald-600 dark:fill-emerald-400">waits double each time (1s → 2s → 4s) + random jitter so all your servers don't retry in sync</text>

      <text x="380" y="240" textAnchor="middle" fontSize="10" className={label}>Same idea cures 429 rate limits, 529 overloaded, and transient network errors. It's ~10 lines of code — you'll write it in this lesson.</text>
    </svg>
  )
}
