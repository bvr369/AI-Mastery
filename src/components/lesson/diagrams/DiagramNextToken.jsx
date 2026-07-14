/**
 * Animated diagram: the next-token prediction loop.
 * One 6s SMIL master cycle: context → model → probabilities → sample → append → repeat.
 */

const CTX = ['The', 'robot', 'learned', 'to']
const BARS = [
  { t: 'dance', p: 58, w: 180, pick: true },
  { t: 'sing', p: 22, w: 68 },
  { t: 'code', p: 12, w: 37 },
  { t: 'sleep', p: 8, w: 25 },
]

export default function DiagramNextToken() {
  const label = 'fill-zinc-500 dark:fill-zinc-400'
  const strong = 'fill-zinc-800 dark:fill-zinc-100'
  const chip = 'fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700'

  return (
    <svg viewBox="0 0 760 310" className="w-full" role="img" aria-label="An LLM reads its context, outputs a probability for every possible next token, one is sampled, appended, and the loop repeats">
      <text x="20" y="26" fontSize="12" fontWeight="700" className={strong}>1 · Context (what the model has so far)</text>

      {/* context chips */}
      {CTX.map((t, i) => (
        <g key={t}>
          <rect x={20 + i * 82} y="38" width="74" height="30" rx="9" className={chip} />
          <text x={57 + i * 82} y="57" textAnchor="middle" fontSize="12" fontFamily="monospace" className={strong}>{t}</text>
        </g>
      ))}

      {/* the appended token — appears late in the cycle */}
      <g opacity="0">
        <rect x={20 + 4 * 82} y="38" width="74" height="30" rx="9" className="fill-emerald-500/15 stroke-emerald-500" />
        <text x={57 + 4 * 82} y="57" textAnchor="middle" fontSize="12" fontFamily="monospace" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">dance</text>
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.72;0.78;0.97;1" dur="6s" repeatCount="indefinite" />
      </g>

      {/* arrow: context → model */}
      <path d="M 120 76 C 120 100, 130 108, 150 116" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" strokeDasharray="3 4" />
      <circle r="3.5" className="fill-brand-500">
        <animateMotion dur="6s" keyPoints="0;1;1" keyTimes="0;0.15;1" calcMode="linear" repeatCount="indefinite" path="M 120 76 C 120 100, 130 108, 150 116" />
        <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.14;0.16;1" dur="6s" repeatCount="indefinite" />
      </circle>

      {/* model box */}
      <text x="20" y="112" fontSize="12" fontWeight="700" className={strong}>2 · The model</text>
      <rect x="20" y="122" width="200" height="86" rx="14" className="fill-brand-500/5 stroke-brand-400/60" />
      <text x="120" y="147" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-brand-600 dark:fill-brand-300">LLM</text>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={44} y={158 + i * 13} width="152" height="7" rx="3.5" className="fill-brand-500/40">
          <animate attributeName="opacity" values="0.25;1;0.25" dur="1.5s" begin={`${i * 0.25}s`} repeatCount="indefinite" />
        </rect>
      ))}
      <text x="120" y="222" textAnchor="middle" fontSize="10" className={label}>reads everything, scores every token</text>

      {/* arrow: model → probabilities */}
      <line x1="228" y1="165" x2="286" y2="165" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" strokeDasharray="3 4" />
      <circle r="3.5" className="fill-brand-500">
        <animateMotion dur="6s" keyPoints="0;0;1;1" keyTimes="0;0.18;0.3;1" calcMode="linear" repeatCount="indefinite" path="M 228 165 L 286 165" />
        <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.18;0.28;0.31;1" dur="6s" repeatCount="indefinite" />
      </circle>

      {/* probability panel */}
      <text x="296" y="112" fontSize="12" fontWeight="700" className={strong}>3 · Probabilities for the next token</text>
      <rect x="296" y="122" width="300" height="140" rx="14" className="fill-white stroke-zinc-300 dark:fill-zinc-900/60 dark:stroke-zinc-700" />
      {BARS.map((b, i) => {
        const y = 138 + i * 30
        return (
          <g key={b.t}>
            <text x="312" y={y + 12} fontSize="11" fontFamily="monospace" className={strong}>{b.t}</text>
            <rect x="366" y={y} width="190" height="16" rx="8" className="fill-zinc-200/60 dark:fill-zinc-800" />
            <rect x="366" y={y} height="16" rx="8" className={b.pick ? 'fill-emerald-500' : 'fill-brand-500/60'} width="0">
              <animate attributeName="width" values={`0;${b.w};${b.w};0`} keyTimes="0;0.42;0.95;1" dur="6s" repeatCount="indefinite" />
            </rect>
            <text x="588" y={y + 12} textAnchor="end" fontSize="10" className={label}>{b.p}%</text>
          </g>
        )
      })}
      {/* sampled marker */}
      <g opacity="0">
        <text x="596" y="132" textAnchor="end" fontSize="10" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">sampled ✓</text>
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.5;0.56;0.95;1" dur="6s" repeatCount="indefinite" />
      </g>

      {/* loop arrow back to context */}
      <path id="loopPath" d="M 596 150 C 700 130, 700 54, 420 52" fill="none" className="stroke-emerald-500/70" strokeWidth="1.5" strokeDasharray="4 5" />
      <circle r="4" className="fill-emerald-500">
        <animateMotion dur="6s" keyPoints="0;0;1;1" keyTimes="0;0.56;0.74;1" calcMode="linear" repeatCount="indefinite" path="M 596 150 C 700 130, 700 54, 420 52" />
        <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.56;0.72;0.76;1" dur="6s" repeatCount="indefinite" />
      </circle>

      <text x="380" y="296" textAnchor="middle" fontSize="11.5" className={label}>4 · Append the token, feed the longer context back in, repeat — one word at a time</text>
    </svg>
  )
}
