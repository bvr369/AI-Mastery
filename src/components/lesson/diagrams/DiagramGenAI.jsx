/**
 * Animated diagram: Traditional software vs Generative AI.
 * Pure SVG + SMIL — no JS, loops forever.
 */

const NET = [
  { x: 0, nodes: 3 },
  { x: 44, nodes: 4 },
  { x: 88, nodes: 3 },
]

export default function DiagramGenAI() {
  const box = 'fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700'
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const strong = 'fill-zinc-800 dark:fill-zinc-100'

  const nodeY = (count, cy) => Array.from({ length: count }, (_, i) => cy + (i - (count - 1) / 2) * 24)

  return (
    <svg viewBox="0 0 760 320" className="w-full" role="img" aria-label="Traditional software returns the same output every time; generative AI creates new outputs each run">
      {/* ---------- Panel A: Traditional ---------- */}
      <text x="185" y="28" textAnchor="middle" fontSize="14" fontWeight="700" className={strong}>Traditional software</text>

      <rect x="110" y="46" width="150" height="34" rx="10" className={box} />
      <text x="185" y="67" textAnchor="middle" fontSize="12" className={label}>input: 2 + 2</text>

      <line x1="185" y1="84" x2="185" y2="106" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" />
      <circle r="3" className="fill-zinc-400">
        <animate attributeName="cy" values="86;104" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="cx" values="185;185" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="1.6s" repeatCount="indefinite" />
      </circle>

      <rect x="95" y="108" width="180" height="78" rx="12" className={box} />
      <text x="185" y="130" textAnchor="middle" fontSize="12" fontWeight="600" className={strong}>rules written by devs</text>
      <text x="185" y="150" textAnchor="middle" fontSize="10" fontFamily="monospace" className={label}>if (a === 2 &amp;&amp; b === 2)</text>
      <text x="185" y="166" textAnchor="middle" fontSize="10" fontFamily="monospace" className={label}>return 4</text>

      <line x1="185" y1="190" x2="185" y2="212" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" />
      <circle r="3" className="fill-zinc-400">
        <animate attributeName="cy" values="192;210" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="cx" values="185;185" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="1.6s" repeatCount="indefinite" />
      </circle>

      <rect x="110" y="214" width="150" height="34" rx="10" className="fill-zinc-100 stroke-zinc-300 dark:fill-zinc-800 dark:stroke-zinc-700" />
      <text x="185" y="235" textAnchor="middle" fontSize="12" fontWeight="600" className={strong}>4</text>

      <text x="185" y="286" textAnchor="middle" fontSize="11" className={label}>same input → same output, forever</text>

      {/* divider */}
      <line x1="380" y1="30" x2="380" y2="290" className="stroke-zinc-200 dark:stroke-zinc-800" strokeDasharray="4 6" />

      {/* ---------- Panel B: Generative AI ---------- */}
      <text x="570" y="28" textAnchor="middle" fontSize="14" fontWeight="700" className={strong}>Generative AI</text>

      <rect x="475" y="46" width="190" height="34" rx="10" className={box} />
      <text x="570" y="67" textAnchor="middle" fontSize="12" className={label}>prompt: “a poem about rain”</text>

      <line x1="570" y1="84" x2="570" y2="106" className="stroke-brand-400" strokeWidth="1.5" />
      <circle r="3" className="fill-brand-500">
        <animate attributeName="cy" values="86;104" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="cx" values="570;570" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite" />
      </circle>

      {/* neural net */}
      <rect x="480" y="108" width="180" height="78" rx="12" className="fill-brand-500/5 stroke-brand-400/50" />
      {NET.map((layer, li) =>
        nodeY(layer.nodes, 147).map((y, ni) => (
          <circle key={`${li}-${ni}`} cx={526 + layer.x} cy={y} r="6" className="fill-brand-500">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" begin={`${(li * 0.3 + ni * 0.12).toFixed(2)}s`} repeatCount="indefinite" />
          </circle>
        ))
      )}
      {NET.slice(0, -1).map((layer, li) =>
        nodeY(layer.nodes, 147).map((y1, a) =>
          nodeY(NET[li + 1].nodes, 147).map((y2, b) => (
            <line key={`${li}-${a}-${b}`} x1={526 + layer.x + 6} y1={y1} x2={526 + NET[li + 1].x - 6} y2={y2} className="stroke-brand-400/25" strokeWidth="1" />
          ))
        )
      )}

      <line x1="570" y1="190" x2="570" y2="212" className="stroke-brand-400" strokeWidth="1.5" />
      <circle r="3" className="fill-brand-500">
        <animate attributeName="cy" values="192;210" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="cx" values="570;570" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite" />
      </circle>

      {/* cycling outputs */}
      {[
        { text: '“Rain taps the window, soft and slow…”', begin: '0s' },
        { text: '“Grey skies hum a silver song…”', begin: '2s' },
        { text: '“The clouds spill secrets on the street…”', begin: '4s' },
      ].map((o, i) => (
        <g key={i} opacity="0">
          <rect x="460" y="214" width="220" height="34" rx="10" className="fill-emerald-500/10 stroke-emerald-500/50" />
          <text x="570" y="235" textAnchor="middle" fontSize="10.5" className="fill-emerald-600 dark:fill-emerald-400">{o.text}</text>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.3;0.36" dur="6s" begin={o.begin} repeatCount="indefinite" />
        </g>
      ))}

      <text x="570" y="286" textAnchor="middle" fontSize="11" className={label}>same prompt → something new, every time</text>
    </svg>
  )
}
