import { useState } from 'react'
import { Wand2 } from 'lucide-react'
import { cn } from '../../../lib/utils'

/** Same user message, different system prompts → visibly different behavior. */

const USER_MSG = '"my checkout button broke after the last deploy, customers are angry!!"'

const PERSONAS = [
  {
    id: 'default', label: 'No system prompt',
    system: '(none)',
    reply: "I'm sorry to hear that! There could be several causes: a JavaScript error, a failed API call, a CSS issue hiding the button, or a broken event handler. Could you share more details about your setup, framework, and any console errors? I'd also recommend checking your deployment logs, rolling back if possible, and…",
    note: 'Helpful but generic and long — the model guesses at what kind of help you want.',
  },
  {
    id: 'support', label: 'Support agent',
    system: 'You are Acme\'s support engineer. Triage first: ask for the error, link the status page, offer rollback steps. Max 4 sentences. Always end with the escalation option.',
    reply: "Let's triage fast. Please open DevTools (F12) → Console and paste the red error you see when clicking checkout. Meanwhile, check status.acme.dev — if the deploy is flagged there, Settings → Deploys → Rollback restores the last working build in ~2 min. If neither resolves it, reply 'escalate' and I'll page the on-call engineer.",
    note: 'Process, brevity, escalation path — all from the system prompt. Same model.',
  },
  {
    id: 'senior', label: 'Senior dev pair',
    system: 'You are a blunt senior engineer pairing with the user. Diagnose by hypothesis, most-likely-first. Use their stack: React + Stripe. No pleasantries.',
    reply: "Most likely: the deploy changed your Stripe publishable key or broke the client bundle. Check in order: 1) console — if `stripe is not defined`, your env vars didn't ship; 2) network tab — a 401 from api.stripe.com confirms it; 3) diff the deploy: `git diff HEAD~1 -- .env.example webpack.config.js`. It's env vars 80% of the time.",
    note: 'Hypothesis-driven, stack-aware, zero fluff — persona AND method were configured in English.',
  },
]

export default function DemoSystemPrompt({ onInteract }) {
  const [active, setActive] = useState(0)
  const p = PERSONAS[active]

  return (
    <div>
      <div className="mb-3 rounded-xl bg-zinc-100 p-3 text-sm dark:bg-zinc-800/60">
        <span className="text-[10px] font-bold uppercase tracking-widest txt-3">user message (identical every time)</span>
        <div className="mt-1 font-medium txt-1">{USER_MSG}</div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {PERSONAS.map((persona, i) => (
          <button
            key={persona.id}
            onClick={() => { onInteract?.(); setActive(i) }}
            className={cn('rounded-xl border px-3 py-1.5 text-xs font-medium transition-all', i === active ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-zinc-300 txt-2 hover:border-brand-400 dark:border-zinc-700')}
          >
            <Wand2 size={11} className="mr-1 inline" />{persona.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-up space-y-2" key={active}>
        <div className="rounded-xl border border-brand-400/40 bg-brand-500/5 p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand-500 dark:text-brand-300">system prompt</div>
          <div className="mt-1 font-mono text-xs leading-relaxed txt-2">{p.system}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">model reply</div>
          <div className="mt-1 text-xs leading-relaxed txt-1">{p.reply}</div>
        </div>
        <p className="text-xs italic txt-3">{p.note}</p>
      </div>
    </div>
  )
}
