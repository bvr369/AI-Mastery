/**
 * The knowledge-vs-behavior decision tree: given a need to improve a model's
 * answers, walk four plain-English questions to the right tool —
 * Prompt/context, RAG (the module's thesis), Fine-tuning, or a Bigger model.
 * A dot rides the "No" spine downward (SMIL) to show the fall-through path.
 */

const label = 'fill-zinc-500 dark:fill-zinc-400'
const strong = 'fill-zinc-800 dark:fill-zinc-100'
const CX = 200 // spine + diamond center
const HW = 150 // diamond half-width
const HH = 52  // diamond half-height

// one diamond per decision, with the outcome box it points to on a "Yes"
const STEPS = [
  {
    cy: 150,
    q: ['Small, static facts', 'you could just paste in?'],
    out: 'Prompt / context',
    sub: 'Drop it straight into the prompt',
    box: 'fill-sky-500/10 stroke-sky-500/50', tx: 'fill-sky-600 dark:fill-sky-400',
  },
  {
    cy: 270, star: true,
    q: ['Needs FRESH or PRIVATE', 'knowledge it doesn’t have?'],
    out: 'RAG',
    sub: 'Retrieve the right chunks into context',
    box: 'fill-brand-500/12 stroke-brand-400/70', tx: 'fill-brand-600 dark:fill-brand-300',
  },
  {
    cy: 390,
    q: ['Needs a consistent STYLE /', 'FORMAT or a narrow skill?'],
    out: 'Fine-tune',
    sub: 'Bake the behavior into the weights',
    box: 'fill-amber-500/10 stroke-amber-500/55', tx: 'fill-amber-600 dark:fill-amber-400',
  },
]

const diamond = (cy) => `M${CX} ${cy - HH} L${CX + HW} ${cy} L${CX} ${cy + HH} L${CX - HW} ${cy} Z`

export default function DiagramRAGDecision() {
  return (
    <svg viewBox="0 0 760 560" className="w-full" role="img" aria-label="A decision tree for improving a model's answers: if small static facts, paste them into the prompt; if it needs fresh or private knowledge it lacks, use RAG to retrieve them into context; if it needs a consistent style, format, or narrow skill, fine-tune; otherwise for a general capability gap use a bigger frontier model. Knowledge points to RAG, behavior to fine-tuning, capability to a bigger model, and they compose.">
      <defs>
        <marker id="rd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="fill-zinc-400 dark:fill-zinc-500" />
        </marker>
      </defs>

      {/* header */}
      <text x="380" y="22" textAnchor="middle" fontSize="14" fontWeight="700" className={strong}>Prompt vs RAG vs Fine-tune vs Bigger model</text>
      <text x="380" y="40" textAnchor="middle" fontSize="10.5" className={label}>You want better answers or new knowledge — which lever do you pull?</text>

      {/* start node */}
      <rect x="90" y="58" width="220" height="34" rx="10" className="fill-zinc-100 stroke-zinc-300 dark:fill-zinc-800 dark:stroke-zinc-700" strokeWidth="1.2" />
      <text x={CX} y="80" textAnchor="middle" fontSize="11.5" fontWeight="700" className={strong}>Start: what’s missing?</text>

      {/* "No" spine: start → D1 → D2 → D3 → bigger model */}
      <line x1={CX} y1="92" x2={CX} y2={150 - HH} className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" markerEnd="url(#rd-arrow)" />
      {STEPS.map((s, i) => {
        const nextTop = i < STEPS.length - 1 ? STEPS[i + 1].cy - HH : 470
        return (
          <line key={`no-${i}`} x1={CX} y1={s.cy + HH} x2={CX} y2={nextTop} className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#rd-arrow)" />
        )
      })}
      {STEPS.slice(1).map((s, i) => (
        <text key={`nolbl-${i}`} x={CX + 10} y={s.cy - HH - 6} fontSize="9" fontWeight="600" className={label}>No ↓</text>
      ))}
      <text x={CX + 10} y="466" fontSize="9" fontWeight="600" className={label}>No ↓</text>

      {/* dot riding the fall-through spine */}
      <circle cx={CX} r="4" className="fill-brand-500">
        <animate attributeName="cy" values="96;462" dur="3.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;0.06;0.5;0.94;1" dur="3.6s" repeatCount="indefinite" />
      </circle>

      {/* decision diamonds + their "Yes" outcome boxes */}
      {STEPS.map((s, i) => (
        <g key={`step-${i}`}>
          <path d={diamond(s.cy)} className="fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700" strokeWidth="1.3" />
          {s.q.map((line, j) => (
            <text key={j} x={CX} y={s.cy - 4 + j * 15} textAnchor="middle" fontSize="10.5" fontWeight="600" className={strong}>{line}</text>
          ))}

          {/* Yes arrow → outcome */}
          <line x1={CX + HW} y1={s.cy} x2="428" y2={s.cy} className="stroke-emerald-500/70" strokeWidth="1.5" markerEnd="url(#rd-arrow)" />
          <text x="388" y={s.cy - 8} textAnchor="middle" fontSize="9" fontWeight="700" className="fill-emerald-600 dark:fill-emerald-400">Yes</text>

          {/* outcome box */}
          <rect x="432" y={s.cy - 34} width="296" height="68" rx="13" className={s.box} strokeWidth={s.star ? 1.6 : 1.2} />
          <text x="450" y={s.cy - 8} fontSize="14" fontWeight="800" className={s.tx}>{s.out}</text>
          <text x="450" y={s.cy + 12} fontSize="10" className={label}>{s.sub}</text>
          {s.star && (
            <g>
              <rect x="640" y={s.cy - 30} width="80" height="19" rx="9" className="fill-brand-500" />
              <text x="680" y={s.cy - 17} textAnchor="middle" fontSize="9.5" fontWeight="700" className="fill-white">★ this module</text>
              <circle cx="680" cy={s.cy + 6} r="0" className="fill-brand-400/50">
                <animate attributeName="r" values="0;22;0" dur="2.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0" dur="2.6s" repeatCount="indefinite" />
              </circle>
            </g>
          )}
        </g>
      ))}

      {/* fall-through outcome: bigger model */}
      <rect x="70" y="472" width="260" height="60" rx="13" className="fill-emerald-500/10 stroke-emerald-500/55" strokeWidth="1.2" />
      <text x={CX} y="496" textAnchor="middle" fontSize="13" fontWeight="800" className="fill-emerald-600 dark:fill-emerald-400">Bigger / frontier model</text>
      <text x={CX} y="514" textAnchor="middle" fontSize="9.5" className={label}>General capability gap on hard reasoning</text>

      {/* footer takeaways */}
      <text x="470" y="474" fontSize="10.5" fontWeight="600" className={strong}>The one-line rule of thumb</text>
      <text x="470" y="494" fontSize="10" className={label}><tspan className="fill-brand-600 dark:fill-brand-300" fontWeight="700">Knowledge</tspan> → RAG · <tspan className="fill-amber-600 dark:fill-amber-400" fontWeight="700">behavior / style</tspan> → fine-tune</text>
      <text x="470" y="510" fontSize="10" className={label}><tspan className="fill-emerald-600 dark:fill-emerald-400" fontWeight="700">General capability</tspan> → bigger model</text>
      <text x="470" y="528" fontSize="9.5" className="fill-zinc-400 dark:fill-zinc-500">…and they compose: RAG a fine-tuned model on a frontier base.</text>
    </svg>
  )
}
