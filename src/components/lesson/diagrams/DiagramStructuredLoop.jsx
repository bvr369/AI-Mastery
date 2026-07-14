/** The generate → validate → retry-with-errors loop for structured output. */

export default function DiagramStructuredLoop() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const box = 'fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700'

  return (
    <svg viewBox="0 0 760 270" className="w-full" role="img" aria-label="Model output is validated against a schema; failures are fed back to the model for a retry until valid JSON emerges">
      <text x="380" y="24" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-zinc-800 dark:fill-zinc-100">Never trust, always validate: the structured-output loop</text>

      <rect x="30" y="90" width="150" height="60" rx="12" className={box} />
      <text x="105" y="115" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-zinc-800 dark:fill-zinc-100">Prompt + schema</text>
      <text x="105" y="133" textAnchor="middle" fontSize="9" fontFamily="monospace" className={label}>"reply ONLY in JSON…"</text>

      <line x1="184" y1="120" x2="246" y2="120" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" strokeDasharray="3 4" />

      <rect x="250" y="90" width="120" height="60" rx="12" className="fill-brand-500/10 stroke-brand-400/60" />
      <text x="310" y="125" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-brand-600 dark:fill-brand-300">LLM</text>

      <line x1="374" y1="120" x2="436" y2="120" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" strokeDasharray="3 4" />
      <circle r="3.5" cy="120" className="fill-brand-500">
        <animate attributeName="cx" values="378;432" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="1.6s" repeatCount="indefinite" />
      </circle>

      <rect x="440" y="90" width="140" height="60" rx="12" className="fill-amber-500/10 stroke-amber-500/60" />
      <text x="510" y="113" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-amber-600 dark:fill-amber-400">Validator</text>
      <text x="510" y="131" textAnchor="middle" fontSize="9" fontFamily="monospace" className={label}>JSON.parse + schema</text>

      {/* pass path */}
      <line x1="584" y1="120" x2="646" y2="120" className="stroke-emerald-500/70" strokeWidth="1.5" />
      <rect x="650" y="90" width="90" height="60" rx="12" className="fill-emerald-500/10 stroke-emerald-500/60" />
      <text x="695" y="115" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">✓ valid</text>
      <text x="695" y="133" textAnchor="middle" fontSize="9" className={label}>into your code</text>

      {/* retry path */}
      <path d="M 510 154 C 510 210, 310 210, 310 154" fill="none" className="stroke-rose-500/70" strokeWidth="1.5" strokeDasharray="4 4" />
      <circle r="3.5" className="fill-rose-500">
        <animateMotion dur="2.6s" begin="0.8s" repeatCount="indefinite" path="M 510 154 C 510 210, 310 210, 310 154" />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="2.6s" begin="0.8s" repeatCount="indefinite" />
      </circle>
      <text x="410" y="222" textAnchor="middle" fontSize="10" fontWeight="600" className="fill-rose-500">✗ invalid → retry WITH the error message:</text>
      <text x="410" y="238" textAnchor="middle" fontSize="9" fontFamily="monospace" className={label}>"Your JSON failed: missing field ‘priority’. Fix and resend only JSON."</text>

      <text x="380" y="264" textAnchor="middle" fontSize="10" className={label}>1-2 retries with error feedback fix ~95% of malformed outputs. Cap retries; log failures.</text>
    </svg>
  )
}
