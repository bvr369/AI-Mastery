/** Closed API models vs open-weights self-hosting, side by side. */

export default function DiagramOpenClosed() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const strong = 'fill-zinc-800 dark:fill-zinc-100'
  const box = 'fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700'

  return (
    <svg viewBox="0 0 760 300" className="w-full" role="img" aria-label="Closed models are rented through an API; open-weight models run on infrastructure you manage">
      {/* Closed side */}
      <text x="190" y="30" textAnchor="middle" fontSize="14" fontWeight="700" className={strong}>Closed (API)</text>
      <rect x="60" y="46" width="260" height="70" rx="14" className="fill-brand-500/10 stroke-brand-400/60" />
      <text x="190" y="74" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-brand-600 dark:fill-brand-300">☁️ Provider's cloud</text>
      <text x="190" y="94" textAnchor="middle" fontSize="10" className={label}>Claude · GPT · Gemini — weights secret</text>

      <line x1="190" y1="116" x2="190" y2="150" className="stroke-brand-400" strokeWidth="1.5" strokeDasharray="3 4">
        <animate attributeName="stroke-dashoffset" values="14;0" dur="1s" repeatCount="indefinite" />
      </line>
      <rect x="110" y="152" width="160" height="40" rx="10" className={box} />
      <text x="190" y="172" textAnchor="middle" fontSize="11" fontWeight="600" className={strong}>your app + API key</text>
      <text x="190" y="186" textAnchor="middle" fontSize="9" className={label}>pay per token</text>

      <text x="190" y="218" fontSize="10" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400">✓ best quality  ✓ zero ops  ✓ start in minutes</text>
      <text x="190" y="236" fontSize="10" textAnchor="middle" className="fill-rose-500">✗ per-token bills  ✗ data leaves you  ✗ vendor rules</text>

      <line x1="380" y1="30" x2="380" y2="250" className="stroke-zinc-200 dark:stroke-zinc-800" strokeDasharray="4 6" />

      {/* Open side */}
      <text x="570" y="30" textAnchor="middle" fontSize="14" fontWeight="700" className={strong}>Open weights (self-hosted)</text>
      <rect x="440" y="46" width="260" height="70" rx="14" className="fill-emerald-500/10 stroke-emerald-500/50" />
      <text x="570" y="74" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">📦 Weights file you download</text>
      <text x="570" y="94" textAnchor="middle" fontSize="10" className={label}>Llama · Mistral · Qwen — yours to run</text>

      <line x1="570" y1="116" x2="570" y2="150" className="stroke-emerald-500" strokeWidth="1.5" strokeDasharray="3 4">
        <animate attributeName="stroke-dashoffset" values="14;0" dur="1s" repeatCount="indefinite" />
      </line>
      <rect x="490" y="152" width="160" height="40" rx="10" className={box} />
      <text x="570" y="172" textAnchor="middle" fontSize="11" fontWeight="600" className={strong}>your GPU server</text>
      <text x="570" y="186" textAnchor="middle" fontSize="9" className={label}>pay for hardware/hosting</text>

      <text x="570" y="218" fontSize="10" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400">✓ full control  ✓ private data  ✓ flat cost at scale</text>
      <text x="570" y="236" fontSize="10" textAnchor="middle" className="fill-rose-500">✗ ops burden  ✗ usually weaker  ✗ GPUs aren't cheap</text>

      <text x="380" y="282" textAnchor="middle" fontSize="11" className={label}>Most real products start closed (speed to market), and add open models later where cost, privacy, or control demands it.</text>
    </svg>
  )
}
