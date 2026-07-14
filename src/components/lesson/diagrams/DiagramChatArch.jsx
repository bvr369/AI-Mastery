/** The checkpoint-project architecture: browser → your server → provider. */

export default function DiagramChatArch() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const box = 'fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700'

  return (
    <svg viewBox="0 0 760 290" className="w-full" role="img" aria-label="The browser talks to your server which holds the API key and proxies streaming responses from the model provider">
      <text x="380" y="24" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-zinc-800 dark:fill-zinc-100">The only sane chat architecture (and the checkpoint project)</text>

      {/* browser */}
      <rect x="40" y="70" width="180" height="130" rx="14" className={box} />
      <text x="130" y="94" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-zinc-800 dark:fill-zinc-100">🖥 React app</text>
      <text x="130" y="116" textAnchor="middle" fontSize="9.5" className={label}>messages state</text>
      <text x="130" y="132" textAnchor="middle" fontSize="9.5" className={label}>streaming renderer</text>
      <text x="130" y="148" textAnchor="middle" fontSize="9.5" className={label}>token-by-token UI</text>
      <text x="130" y="176" textAnchor="middle" fontSize="9" fontWeight="700" className="fill-rose-500">🚫 NO API KEY HERE</text>

      {/* your server */}
      <rect x="290" y="70" width="180" height="130" rx="14" className="fill-brand-500/8 stroke-brand-400/60" />
      <text x="380" y="94" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-brand-600 dark:fill-brand-300">🔐 Your server</text>
      <text x="380" y="116" textAnchor="middle" fontSize="9.5" className={label}>holds the API key (env)</text>
      <text x="380" y="132" textAnchor="middle" fontSize="9.5" className={label}>system prompt lives here</text>
      <text x="380" y="148" textAnchor="middle" fontSize="9.5" className={label}>rate limits · logging · auth</text>
      <text x="380" y="176" textAnchor="middle" fontSize="9" className={label}>Node / Next.js route / worker</text>

      {/* provider */}
      <rect x="540" y="70" width="180" height="130" rx="14" className="fill-emerald-500/8 stroke-emerald-500/50" />
      <text x="630" y="94" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">☁️ Provider API</text>
      <text x="630" y="116" textAnchor="middle" fontSize="9.5" className={label}>api.anthropic.com</text>
      <text x="630" y="132" textAnchor="middle" fontSize="9.5" className={label}>runs the model</text>
      <text x="630" y="148" textAnchor="middle" fontSize="9.5" className={label}>streams SSE back</text>

      {/* arrows out */}
      <line x1="224" y1="105" x2="286" y2="105" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" strokeDasharray="3 4" />
      <circle r="3.5" cy="105" className="fill-brand-500"><animate attributeName="cx" values="228;282" dur="1.6s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;1;0" dur="1.6s" repeatCount="indefinite" /></circle>
      <line x1="474" y1="105" x2="536" y2="105" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" strokeDasharray="3 4" />
      <circle r="3.5" cy="105" className="fill-brand-500"><animate attributeName="cx" values="478;532" dur="1.6s" begin="0.4s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;1;0" dur="1.6s" begin="0.4s" repeatCount="indefinite" /></circle>

      {/* streaming back */}
      <line x1="536" y1="165" x2="474" y2="165" className="stroke-emerald-500/60" strokeWidth="1.5" strokeDasharray="2 3" />
      <line x1="286" y1="165" x2="224" y2="165" className="stroke-emerald-500/60" strokeWidth="1.5" strokeDasharray="2 3" />
      {[0, 0.3, 0.6].map((d, i) => (
        <g key={i}>
          <circle r="3" cy="165" className="fill-emerald-500"><animate attributeName="cx" values="532;478" dur="1.2s" begin={`${d}s`} repeatCount="indefinite" /><animate attributeName="opacity" values="0;1;0" dur="1.2s" begin={`${d}s`} repeatCount="indefinite" /></circle>
          <circle r="3" cy="165" className="fill-emerald-500"><animate attributeName="cx" values="282;228" dur="1.2s" begin={`${d + 0.15}s`} repeatCount="indefinite" /><animate attributeName="opacity" values="0;1;0" dur="1.2s" begin={`${d + 0.15}s`} repeatCount="indefinite" /></circle>
        </g>
      ))}
      <text x="380" y="222" textAnchor="middle" fontSize="10" className="fill-emerald-600 dark:fill-emerald-400">← tokens stream back through both hops (SSE piped through your server)</text>

      <text x="380" y="256" textAnchor="middle" fontSize="10.5" className={label}>Why the middle hop? Keys stay secret, prompts stay yours, and you get one place for auth, limits, logging, and model swaps.</text>
      <text x="380" y="274" textAnchor="middle" fontSize="9.5" className="fill-zinc-400 dark:fill-zinc-500">Calling providers directly from the browser = shipping your API key to every visitor's DevTools.</text>
    </svg>
  )
}
