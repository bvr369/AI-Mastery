/** Why hallucination is structural: the loop must emit SOMETHING plausible. */

export default function DiagramHallucination() {
  const box = 'fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700'
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const strong = 'fill-zinc-800 dark:fill-zinc-100'

  return (
    <svg viewBox="0 0 760 300" className="w-full" role="img" aria-label="When the model has knowledge it answers correctly; when it lacks knowledge it still produces plausible text — a hallucination">
      <rect x="280" y="18" width="200" height="38" rx="10" className={box} />
      <text x="380" y="41" textAnchor="middle" fontSize="12" className={strong}>“Who wrote library X?”</text>

      <line x1="380" y1="56" x2="380" y2="86" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" />
      <rect x="300" y="88" width="160" height="44" rx="12" className="fill-brand-500/10 stroke-brand-400/60" />
      <text x="380" y="108" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-brand-600 dark:fill-brand-300">Predict next token</text>
      <text x="380" y="124" textAnchor="middle" fontSize="9" className={label}>(must output something)</text>

      {/* two branches */}
      <path d="M 340 132 C 300 160, 240 160, 200 176" fill="none" className="stroke-emerald-500/70" strokeWidth="1.5" />
      <path d="M 420 132 C 460 160, 520 160, 560 176" fill="none" className="stroke-rose-500/70" strokeWidth="1.5" />

      <g>
        <rect x="60" y="180" width="280" height="58" rx="12" className="fill-emerald-500/10 stroke-emerald-500/50" />
        <text x="200" y="201" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">Pattern seen in training many times</text>
        <text x="200" y="220" textAnchor="middle" fontSize="10" className={label}>strong signal → “React was created at Facebook” ✓</text>
      </g>

      <g>
        <rect x="420" y="180" width="280" height="58" rx="12" className="fill-rose-500/10 stroke-rose-500/50">
          <animate attributeName="opacity" values="1;0.6;1" dur="2.4s" repeatCount="indefinite" />
        </rect>
        <text x="560" y="201" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-rose-500">Pattern missing or rare</text>
        <text x="560" y="220" textAnchor="middle" fontSize="10" className={label}>weak signal → invents a plausible author ✗</text>
      </g>

      <text x="200" y="262" textAnchor="middle" fontSize="10" className="fill-emerald-600 dark:fill-emerald-400">looks confident</text>
      <text x="560" y="262" textAnchor="middle" fontSize="10" className="fill-rose-500">looks EXACTLY as confident</text>
      <text x="380" y="290" textAnchor="middle" fontSize="11" className={label}>Same fluent tone in both branches — that's what makes hallucination dangerous.</text>
    </svg>
  )
}
