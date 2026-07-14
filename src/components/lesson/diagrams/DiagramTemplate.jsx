/** Prompt templates: a versioned function with variable slots. */

export default function DiagramTemplate() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const strong = 'fill-zinc-800 dark:fill-zinc-100'
  const mono = { fontFamily: 'monospace' }

  return (
    <svg viewBox="0 0 760 280" className="w-full" role="img" aria-label="A prompt template is a function with variable slots; runtime data is injected to produce the final prompt sent to the model">
      <text x="380" y="24" textAnchor="middle" fontSize="13" fontWeight="700" className={strong}>Prompts are functions: a versioned template + injected variables</text>

      {/* template */}
      <rect x="30" y="46" width="280" height="150" rx="12" className="fill-brand-500/5 stroke-brand-400/60" />
      <text x="46" y="66" fontSize="10" style={mono} fontWeight="700" className="fill-brand-600 dark:fill-brand-300">supportPrompt(v3)</text>
      <text x="46" y="90" fontSize="9.5" style={mono} className="fill-zinc-600 dark:fill-zinc-300">You are {'{'}company{'}'}'s bot.</text>
      <text x="46" y="108" fontSize="9.5" style={mono} className="fill-zinc-600 dark:fill-zinc-300">Today is {'{'}date{'}'}.</text>
      <text x="46" y="126" fontSize="9.5" style={mono} className="fill-zinc-600 dark:fill-zinc-300">User plan: {'{'}plan{'}'}.</text>
      <text x="46" y="150" fontSize="9.5" style={mono} className="fill-zinc-600 dark:fill-zinc-300">Answer: {'{'}question{'}'}</text>
      <text x="170" y="182" textAnchor="middle" fontSize="8.5" className={label}>in git · reviewed · testable</text>

      {/* variables */}
      <rect x="330" y="70" width="130" height="100" rx="10" className="fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700" />
      <text x="395" y="88" textAnchor="middle" fontSize="9.5" fontWeight="700" className={strong}>runtime data</text>
      <text x="344" y="108" fontSize="8.5" style={mono} className="fill-amber-600 dark:fill-amber-400">company: "Acme"</text>
      <text x="344" y="124" fontSize="8.5" style={mono} className="fill-amber-600 dark:fill-amber-400">date: "2026-07-14"</text>
      <text x="344" y="140" fontSize="8.5" style={mono} className="fill-amber-600 dark:fill-amber-400">plan: "Pro"</text>
      <text x="344" y="156" fontSize="8.5" style={mono} className="fill-amber-600 dark:fill-amber-400">question: "refund?"</text>

      {/* inject arrow */}
      <line x1="312" y1="120" x2="328" y2="120" className="stroke-zinc-400" strokeWidth="1.5" />
      <text x="475" y="124" fontSize="14" className="fill-brand-500">→</text>

      {/* final prompt */}
      <rect x="500" y="46" width="230" height="150" rx="12" className="fill-emerald-500/5 stroke-emerald-500/50" />
      <text x="516" y="66" fontSize="9.5" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">final prompt → model</text>
      <text x="516" y="90" fontSize="9" style={mono} className="fill-zinc-700 dark:fill-zinc-200">You are Acme's bot.</text>
      <text x="516" y="108" fontSize="9" style={mono} className="fill-zinc-700 dark:fill-zinc-200">Today is 2026-07-14.</text>
      <text x="516" y="126" fontSize="9" style={mono} className="fill-zinc-700 dark:fill-zinc-200">User plan: Pro.</text>
      <text x="516" y="150" fontSize="9" style={mono} className="fill-zinc-700 dark:fill-zinc-200">Answer: refund?</text>
      <circle cx="690" cy="120" r="4" className="fill-emerald-500"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" /></circle>

      <text x="380" y="230" textAnchor="middle" fontSize="10.5" className={label}>Never concatenate strings inline across your codebase. One template module = one place to review, test, A/B, and roll back.</text>
      <text x="380" y="252" textAnchor="middle" fontSize="9.5" className="fill-rose-500">⚠ Injecting untrusted user text into a template is exactly where prompt injection enters — next lesson.</text>
    </svg>
  )
}
