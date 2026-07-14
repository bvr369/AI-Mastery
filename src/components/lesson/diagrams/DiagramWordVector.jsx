/**
 * Animated diagram: a word becomes a vector of numbers, and that vector is a
 * point in space where similar meanings land near each other.
 * word "cat" → column of numbers → 2D map with cat near dog/kitten, far from car/bread.
 */

const NUMS = [0.21, -0.68, 0.90, 0.14, -0.33]

// points in the little 2D map (svg coords), grouped by meaning
const POINTS = [
  { t: 'cat', x: 632, y: 150, self: true },
  { t: 'kitten', x: 600, y: 128 },
  { t: 'dog', x: 668, y: 174 },
  { t: 'car', x: 560, y: 232 },
  { t: 'bread', x: 690, y: 250 },
]

export default function DiagramWordVector() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const strong = 'fill-zinc-800 dark:fill-zinc-100'
  const chip = 'fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700'

  return (
    <svg viewBox="0 0 760 300" className="w-full" role="img" aria-label="A word becomes a vector of numbers, which is a point in space where similar meanings such as cat, dog, and kitten sit close together and unrelated words like car and bread sit far away">
      <text x="380" y="24" textAnchor="middle" fontSize="13.5" fontWeight="700" className={strong}>A word becomes numbers — and numbers have neighbors</text>

      {/* ── 1 · the word ── */}
      <text x="70" y="70" textAnchor="middle" fontSize="11" fontWeight="700" className={label}>1 · a word</text>
      <rect x="26" y="120" width="88" height="46" rx="12" className="fill-brand-500/10 stroke-brand-400/60" strokeWidth="1.2" />
      <text x="70" y="149" textAnchor="middle" fontSize="17" fontWeight="700" fontFamily="monospace" className="fill-brand-600 dark:fill-brand-300">cat</text>

      {/* arrow: word → vector */}
      <line x1="120" y1="143" x2="182" y2="143" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" strokeDasharray="3 4" />
      <text x="151" y="134" textAnchor="middle" fontSize="9" className={label}>embed</text>
      <circle r="3.5" cy="143" className="fill-brand-500">
        <animate attributeName="cx" values="122;180" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="2.4s" repeatCount="indefinite" />
      </circle>

      {/* ── 2 · the vector ── */}
      <text x="245" y="70" textAnchor="middle" fontSize="11" fontWeight="700" className={label}>2 · a vector (list of numbers)</text>
      <rect x="196" y="84" width="98" height="132" rx="12" className={chip} strokeWidth="1.2" />
      <text x="203" y="100" fontSize="12" className={label}>[</text>
      {NUMS.map((n, i) => (
        <text key={i} x="245" y={106 + i * 21} textAnchor="middle" fontSize="12.5" fontFamily="monospace" className={strong}>
          {n > 0 ? ' ' : ''}{n.toFixed(2)}
          <animate attributeName="opacity" values="0.35;1;0.35" dur="2.4s" begin={`${i * 0.18}s`} repeatCount="indefinite" />
        </text>
      ))}
      <text x="287" y="212" textAnchor="end" fontSize="12" className={label}>]</text>
      <text x="245" y="234" textAnchor="middle" fontSize="9.5" className="fill-zinc-400 dark:fill-zinc-500">(really hundreds of numbers)</text>

      {/* arrow: vector → space */}
      <line x1="300" y1="150" x2="380" y2="150" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" strokeDasharray="3 4" />
      <text x="340" y="141" textAnchor="middle" fontSize="9" className={label}>= a point</text>
      <circle r="3.5" cy="150" className="fill-brand-500">
        <animate attributeName="cx" values="302;378" dur="2.4s" begin="0.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="2.4s" begin="0.5s" repeatCount="indefinite" />
      </circle>

      {/* ── 3 · the space ── */}
      <text x="590" y="70" textAnchor="middle" fontSize="11" fontWeight="700" className={label}>3 · a point in “meaning space”</text>
      <rect x="392" y="80" width="352" height="176" rx="14" className="fill-white stroke-zinc-300 dark:fill-zinc-900/60 dark:stroke-zinc-700" strokeWidth="1.2" />
      {/* axes */}
      <line x1="420" y1="236" x2="720" y2="236" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" />
      <line x1="420" y1="236" x2="420" y2="96" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" />

      {/* similarity halo around the animals */}
      <circle cx="633" cy="150" r="58" className="fill-brand-500/5 stroke-brand-400/40" strokeWidth="1" strokeDasharray="4 5">
        <animate attributeName="r" values="52;60;52" dur="3.2s" repeatCount="indefinite" />
      </circle>
      <text x="633" y="98" textAnchor="middle" fontSize="9" className="fill-brand-500 dark:fill-brand-300">similar meanings cluster</text>

      {/* points */}
      {POINTS.map((p, i) => (
        <g key={p.t}>
          <circle cx={p.x} cy={p.y} r={p.self ? 6 : 4.5} className={p.self ? 'fill-brand-500' : 'fill-zinc-400 dark:fill-zinc-500'}>
            {p.self && <animate attributeName="r" values="6;7.5;6" dur="1.8s" repeatCount="indefinite" />}
          </circle>
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontFamily="monospace" fontWeight={p.self ? 700 : 500} className={p.self ? 'fill-brand-600 dark:fill-brand-300' : strong}>{p.t}</text>
        </g>
      ))}

      <text x="380" y="284" textAnchor="middle" fontSize="11" className={label}>Similar meanings get similar vectors — so nearness here = similarity in meaning. That is the whole trick behind semantic search.</text>
    </svg>
  )
}
