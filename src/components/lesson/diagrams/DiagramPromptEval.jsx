/** The prompt evaluation loop: test cases score prompt variants objectively. */

export default function DiagramPromptEval() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const strong = 'fill-zinc-800 dark:fill-zinc-100'
  const box = 'fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700'

  return (
    <svg viewBox="0 0 760 280" className="w-full" role="img" aria-label="A test set runs against two prompt variants; a scorer grades outputs so you pick the winner by data, not vibes">
      <text x="380" y="24" textAnchor="middle" fontSize="13" fontWeight="700" className={strong}>Stop tuning prompts by vibes. Score them.</text>

      {/* test set */}
      <rect x="30" y="60" width="140" height="150" rx="12" className={box} />
      <text x="100" y="82" textAnchor="middle" fontSize="10.5" fontWeight="700" className={strong}>Test set</text>
      {['input → expected', '"slow ship" → neg', '"love it" → pos', '"it\'s fine" → neutral', '…20 cases'].map((t, i) => (
        <text key={i} x="44" y={104 + i * 20} fontSize="8.5" fontFamily="monospace" className={label}>{t}</text>
      ))}

      {/* two prompts */}
      <rect x="220" y="56" width="180" height="52" rx="10" className="fill-brand-500/8 stroke-brand-400/50" />
      <text x="310" y="78" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-brand-600 dark:fill-brand-300">Prompt A (v1)</text>
      <text x="310" y="94" textAnchor="middle" fontSize="8.5" className={label}>zero-shot</text>

      <rect x="220" y="162" width="180" height="52" rx="10" className="fill-sky-500/8 stroke-sky-500/50" />
      <text x="310" y="184" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-sky-600 dark:fill-sky-400">Prompt B (v2)</text>
      <text x="310" y="200" textAnchor="middle" fontSize="8.5" className={label}>few-shot + format rule</text>

      <line x1="172" y1="110" x2="218" y2="82" className="stroke-zinc-300 dark:stroke-zinc-700" strokeDasharray="3 3" />
      <line x1="172" y1="160" x2="218" y2="188" className="stroke-zinc-300 dark:stroke-zinc-700" strokeDasharray="3 3" />

      {/* scorer */}
      <rect x="430" y="98" width="120" height="76" rx="12" className="fill-amber-500/10 stroke-amber-500/60" />
      <text x="490" y="130" textAnchor="middle" fontSize="10.5" fontWeight="700" className="fill-amber-600 dark:fill-amber-400">Scorer</text>
      <text x="490" y="147" textAnchor="middle" fontSize="8" className={label}>exact match /</text>
      <text x="490" y="158" textAnchor="middle" fontSize="8" className={label}>LLM-as-judge</text>
      <line x1="400" y1="82" x2="428" y2="120" className="stroke-brand-400/60" strokeWidth="1.3" />
      <line x1="400" y1="188" x2="428" y2="150" className="stroke-sky-400/60" strokeWidth="1.3" />

      {/* results */}
      <rect x="580" y="70" width="160" height="60" rx="10" className="fill-brand-500/8 stroke-brand-400/50" />
      <text x="660" y="92" textAnchor="middle" fontSize="10" className="fill-brand-600 dark:fill-brand-300">Prompt A: 72%</text>
      <rect x="596" y="102" width="128" height="10" rx="5" className="fill-zinc-200 dark:fill-zinc-800" />
      <rect x="596" y="102" width="92" height="10" rx="5" className="fill-brand-500" />

      <rect x="580" y="150" width="160" height="60" rx="10" className="fill-emerald-500/10 stroke-emerald-500/60" />
      <text x="660" y="172" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">Prompt B: 94% ✓</text>
      <rect x="596" y="182" width="128" height="10" rx="5" className="fill-zinc-200 dark:fill-zinc-800" />
      <rect x="596" y="182" width="120" height="10" rx="5" className="fill-emerald-500" />

      <text x="380" y="248" textAnchor="middle" fontSize="10.5" className={label}>Now "B is better" is a measurement, not an opinion — and it becomes a regression test that catches quality drops forever.</text>
    </svg>
  )
}
