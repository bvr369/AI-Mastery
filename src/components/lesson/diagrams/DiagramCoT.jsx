/** Chain-of-thought: reasoning steps between question and answer raise accuracy. */

export default function DiagramCoT() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const strong = 'fill-zinc-800 dark:fill-zinc-100'

  return (
    <svg viewBox="0 0 760 290" className="w-full" role="img" aria-label="Without chain-of-thought the model jumps straight to a wrong answer; with it, visible reasoning steps lead to the correct answer">
      <text x="380" y="24" textAnchor="middle" fontSize="13" fontWeight="700" className={strong}>"A bat and ball cost $1.10. The bat costs $1 more than the ball. How much is the ball?"</text>

      {/* without CoT */}
      <text x="180" y="60" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-rose-500">Straight to the answer</text>
      <rect x="70" y="72" width="220" height="40" rx="10" className="fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700" />
      <text x="180" y="97" textAnchor="middle" fontSize="12" fontFamily="monospace" className="fill-zinc-700 dark:fill-zinc-200">Q → "$0.10"</text>
      <text x="180" y="132" textAnchor="middle" fontSize="10" className="fill-rose-500">✗ the intuitive trap answer</text>

      {/* with CoT */}
      <text x="560" y="60" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-emerald-500">Chain-of-thought</text>
      <rect x="410" y="72" width="300" height="128" rx="12" className="fill-emerald-500/5 stroke-emerald-500/50" />
      {[
        'Let ball = x, bat = x + 1.00',
        'x + (x + 1.00) = 1.10',
        '2x = 0.10  →  x = 0.05',
      ].map((step, i) => (
        <text key={i} x="426" y={95 + i * 22} fontSize="10.5" fontFamily="monospace" className="fill-emerald-700 dark:fill-emerald-300">
          {i + 1}. {step}
          <animate attributeName="opacity" values="0;0;1;1" keyTimes={`0;${0.2 + i * 0.2};${0.35 + i * 0.2};1`} dur="4s" repeatCount="indefinite" />
        </text>
      ))}
      <text x="426" y="185" fontSize="11" fontFamily="monospace" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">
        Answer: $0.05 ✓
        <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.8;0.9;1" dur="4s" repeatCount="indefinite" />
      </text>

      <line x1="300" y1="92" x2="404" y2="92" className="stroke-zinc-300 dark:stroke-zinc-700" strokeDasharray="3 4" />
      <text x="352" y="86" textAnchor="middle" fontSize="8.5" className={label}>same model</text>

      <text x="380" y="235" textAnchor="middle" fontSize="11" className={label}>Giving the model room to reason BEFORE answering turns hard problems into easy sequential steps.</text>
      <text x="380" y="255" textAnchor="middle" fontSize="10.5" className={label}>Trigger it with "think step by step", by showing worked examples, or use a reasoning model that does it internally.</text>
    </svg>
  )
}
