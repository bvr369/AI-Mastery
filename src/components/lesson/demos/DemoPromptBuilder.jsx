import { useState } from 'react'
import { cn } from '../../../lib/utils'

/**
 * Build a prompt part-by-part and watch output quality climb.
 * Each toggle adds one of the five anatomy parts; a canned "output"
 * and a heuristic quality score reflect the improvement.
 */

const PARTS = [
  { id: 'role', label: 'Role', add: 'You are a senior financial analyst.', score: 15 },
  { id: 'context', label: 'Context', add: 'The user runs a small SaaS with $40k MRR, 8% monthly churn.', score: 25 },
  { id: 'task', label: 'Task', add: 'Identify the single biggest risk to their business.', score: 30 },
  { id: 'format', label: 'Format', add: 'Answer in exactly 3 bullet points, each one sentence.', score: 20 },
  { id: 'examples', label: 'Example', add: 'Example bullet: "• Churn: at 8%/mo you lose half your customers yearly."', score: 10 },
]

const OUTPUTS = {
  0: 'Well, there are many things a business should consider. Financial health depends on numerous factors including revenue, costs, market conditions, competition, and more. Could you tell me more about what you\'d like to know?',
  15: 'As an analyst, I\'d say businesses face many risks — cash flow, competition, and operations are all important areas to monitor carefully over time.',
  40: 'For a SaaS at your stage, key risks include churn, customer acquisition cost, and runway. Churn especially compounds — losing customers monthly erodes your base faster than new sales replace it.',
  70: 'The biggest risk is churn. At 8% monthly, you lose ~63% of customers annually, forcing acquisition just to stand still. This caps growth and inflates CAC payback. Everything else is secondary until churn is under control.',
  90: '• Churn is the killer: 8%/mo means ~63% of customers gone in a year — you\'re refilling a leaking bucket.\n• Growth is capped: new sales fund replacement, not expansion, so MRR plateaus.\n• Fix retention first: a 2-point churn drop beats any acquisition campaign at your scale.',
  100: '• Churn is the killer: at 8%/mo you lose ~63% of customers yearly — a leaking bucket.\n• Growth stalls: new sales replace churned users instead of adding to MRR.\n• Retention beats acquisition: cutting churn to 6% extends runway more than any ad spend.',
}

export default function DemoPromptBuilder({ onInteract }) {
  const [active, setActive] = useState(new Set())

  const toggle = (id) => {
    onInteract?.()
    setActive((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const score = Math.min(100, PARTS.filter((p) => active.has(p.id)).reduce((a, p) => a + p.score, 0))
  const outKey = Object.keys(OUTPUTS).map(Number).filter((k) => k <= score).sort((a, b) => b - a)[0] ?? 0
  const output = OUTPUTS[outKey]
  const promptText = PARTS.filter((p) => active.has(p.id)).map((p) => p.add).join('\n')

  return (
    <div>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest txt-3">Add prompt parts — watch the output sharpen</div>
      <div className="mb-3 flex flex-wrap gap-2">
        {PARTS.map((p) => (
          <button key={p.id} onClick={() => toggle(p.id)}
            className={cn('rounded-xl border px-3 py-1.5 text-xs font-medium transition-all', active.has(p.id) ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700')}>
            {active.has(p.id) ? '✓ ' : '+ '}{p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest txt-3">Your prompt</div>
          <div className="min-h-[120px] rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-950/50">
            {promptText ? <span className="txt-1">{promptText}</span> : <span className="italic txt-3">Add parts above to build a prompt…</span>}
            {active.size > 0 && <div className="mt-2 txt-3">"What should I worry about?"</div>}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest txt-3">Model output</div>
          <div className="min-h-[120px] whitespace-pre-wrap rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs leading-relaxed txt-1">{output}</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[10px] txt-3">
          <span>prompt quality</span>
          <span>{score}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className={cn('h-full rounded-full transition-all duration-500', score >= 80 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${Math.max(4, score)}%` }} />
        </div>
      </div>
      <p className="mt-3 text-xs txt-3">Notice the leap when <strong className="txt-2">Task</strong> and <strong className="txt-2">Format</strong> go on — vague "what should I worry about?" becomes a specific, parseable answer. That's prompt engineering in one screen.</p>
    </div>
  )
}
