/** Anatomy of an LLM API call: annotated request → response. */

export default function DiagramRequestAnatomy() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const strong = 'fill-zinc-800 dark:fill-zinc-100'
  const mono = { fontFamily: 'monospace' }

  return (
    <svg viewBox="0 0 760 320" className="w-full" role="img" aria-label="An LLM API request contains auth headers, model choice, and messages; the response contains generated content and token usage">
      {/* request card */}
      <rect x="30" y="40" width="320" height="230" rx="14" className="fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700" />
      <text x="190" y="28" textAnchor="middle" fontSize="13" fontWeight="700" className={strong}>REQUEST (what you send)</text>
      <text x="50" y="70" fontSize="11" style={mono} className="fill-brand-600 dark:fill-brand-300">POST /v1/messages</text>
      <text x="50" y="98" fontSize="10" style={mono} className={strong}>x-api-key: sk-ant-…</text>
      <text x="50" y="126" fontSize="10" style={mono} className={strong}>"model": "claude-sonnet-5"</text>
      <text x="50" y="154" fontSize="10" style={mono} className={strong}>"max_tokens": 500</text>
      <text x="50" y="182" fontSize="10" style={mono} className={strong}>"messages": [ …conversation ]</text>
      <text x="50" y="210" fontSize="10" style={mono} className={strong}>"temperature": 0.7</text>

      {/* annotations */}
      {[
        [98, 'auth — NEVER ships to the browser', 'fill-rose-500'],
        [126, 'which brain (tier routing!)', 'fill-brand-500 dark:fill-brand-300'],
        [154, 'output budget = cost brake', 'fill-amber-500'],
        [182, 'ALL state lives here', 'fill-emerald-600 dark:fill-emerald-400'],
        [210, 'sampling knob', 'fill-sky-500'],
      ].map(([y, note, cls]) => (
        <text key={y} x="362" y={y} fontSize="9.5" className={cls}>← {note}</text>
      ))}

      {/* arrow */}
      <line x1="380" y1="240" x2="520" y2="240" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" strokeDasharray="4 4" />
      <circle r="4" cy="240" className="fill-brand-500">
        <animate attributeName="cx" values="385;515" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <text x="450" y="228" textAnchor="middle" fontSize="9" className={label}>HTTPS</text>

      {/* response card */}
      <rect x="530" y="40" width="210" height="230" rx="14" className="fill-emerald-500/5 stroke-emerald-500/50" />
      <text x="635" y="28" textAnchor="middle" fontSize="13" fontWeight="700" className={strong}>RESPONSE</text>
      <text x="548" y="76" fontSize="10" style={mono} className={strong}>"content": [{'{'}</text>
      <text x="560" y="96" fontSize="10" style={mono} className="fill-emerald-600 dark:fill-emerald-400">"text": "Hooks let…"</text>
      <text x="548" y="116" fontSize="10" style={mono} className={strong}>{'}'}]</text>
      <text x="548" y="152" fontSize="10" style={mono} className={strong}>"stop_reason": "end_turn"</text>
      <text x="548" y="188" fontSize="10" style={mono} className={strong}>"usage": {'{'}</text>
      <text x="560" y="208" fontSize="10" style={mono} className="fill-amber-500">"input_tokens": 214,</text>
      <text x="560" y="228" fontSize="10" style={mono} className="fill-amber-500">"output_tokens": 187</text>
      <text x="548" y="248" fontSize="10" style={mono} className={strong}>{'}'}</text>

      <text x="380" y="302" textAnchor="middle" fontSize="11" className={label}>It's just HTTPS + JSON. The `usage` block is your bill — log it on every call from day one.</text>
    </svg>
  )
}
