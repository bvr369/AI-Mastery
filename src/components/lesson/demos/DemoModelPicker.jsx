import { useState } from 'react'
import { Cloud, Package, Scale, RotateCcw } from 'lucide-react'
import { cn } from '../../../lib/utils'

/** Scenario drill: closed API vs open weights — plus a cost crossover calculator. */

const SCENARIOS = [
  {
    s: 'Solo founder validating an AI writing tool. Needs to launch in 2 weeks.',
    best: 'closed',
    why: 'Speed to market beats everything pre-validation. An API key gets you the best model in 10 minutes; GPUs and ops would eat your two weeks.',
  },
  {
    s: 'Hospital wants to summarize patient records. Data may not leave their network.',
    best: 'open',
    why: 'Hard data-residency requirement → self-hosted open weights inside their network (or a specialized private cloud deployment). Compliance beats convenience.',
  },
  {
    s: 'Startup translates 50M short product descriptions monthly. Quality bar: "good enough".',
    best: 'open',
    why: 'Huge volume + modest quality needs = classic open-model economics. A fine-tuned small model on rented GPUs beats per-token pricing at this scale.',
  },
  {
    s: 'Agency builds a complex coding agent for enterprise clients. Quality is the product.',
    best: 'closed',
    why: 'Agentic coding is frontier-model territory — the capability gap is the product. Clients pay for results, so per-token cost is a rounding error.',
  },
]

const API_PER_MTOK = 3 + 15 // $ in + out, mid-tier
const GPU_MONTHLY = 1400 // one decent inference GPU node, monthly

export default function DemoModelPicker({ onInteract }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [mTok, setMTok] = useState(50) // millions of tokens per month

  const sc = SCENARIOS[i]
  const pick = (choice) => {
    if (picked) return
    onInteract?.()
    setPicked(choice)
    if (choice === sc.best) setScore((s) => s + 1)
  }
  const next = () => {
    if (i + 1 >= SCENARIOS.length) setDone(true)
    else { setI(i + 1); setPicked(null) }
  }
  const restart = () => { setI(0); setPicked(null); setScore(0); setDone(false) }

  const apiCost = mTok * API_PER_MTOK
  const openWins = apiCost > GPU_MONTHLY * 1.5 // ops overhead fudge

  return (
    <div>
      {!done ? (
        <>
          <div className="mb-2 flex items-center justify-between text-xs txt-3">
            <span className="chip-brand">Scenario {i + 1} / {SCENARIOS.length}</span>
            <span>What would a senior AI engineer choose?</span>
          </div>
          <div className="mb-3 rounded-xl bg-zinc-100 p-3.5 text-sm font-medium leading-relaxed txt-1 dark:bg-zinc-800/60">{sc.s}</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['closed', Cloud, 'Closed API', 'rent the frontier'],
              ['open', Package, 'Open weights', 'own the stack'],
            ].map(([id, Icon, title, sub]) => {
              const isBest = picked && id === sc.best
              const isWrongPick = picked === id && id !== sc.best
              return (
                <button
                  key={id}
                  onClick={() => pick(id)}
                  disabled={!!picked}
                  className={cn(
                    'rounded-xl border p-4 text-center transition-all',
                    !picked && 'border-zinc-300 hover:border-brand-400 hover:bg-brand-500/5 dark:border-zinc-700',
                    isBest && 'border-emerald-500 bg-emerald-500/10',
                    isWrongPick && 'border-rose-500 bg-rose-500/10'
                  )}
                >
                  <Icon size={20} className={cn('mx-auto mb-1', id === 'open' ? 'text-emerald-500' : 'text-brand-500 dark:text-brand-300')} />
                  <div className="text-sm font-bold txt-1">{title}</div>
                  <div className="text-[10px] txt-3">{sub}</div>
                </button>
              )
            })}
          </div>
          {picked && (
            <div className="mt-3 animate-fade-up">
              <div className={cn('rounded-xl p-3.5 text-sm leading-relaxed', picked === sc.best ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300')}>
                <strong>{picked === sc.best ? 'Agreed. ' : `Most seniors would pick ${sc.best}. `}</strong>
                <span className="txt-2">{sc.why}</span>
              </div>
              <button onClick={next} className="btn-primary mt-3 w-full">{i + 1 >= SCENARIOS.length ? 'Finish' : 'Next scenario'}</button>
            </div>
          )}
        </>
      ) : (
        <div className="p-2 text-center">
          <Scale size={24} className="mx-auto mb-2 text-brand-500 dark:text-brand-300" />
          <div className="text-base font-bold txt-1">{score}/{SCENARIOS.length} matched senior judgment</div>
          <p className="mt-1 text-xs txt-2">The pattern: constraints pick the model. Speed → closed. Privacy/scale → open. Quality-is-the-product → closed frontier.</p>
          <button onClick={restart} className="btn-outline mx-auto mt-3"><RotateCcw size={13} /> Replay</button>
        </div>
      )}

      {/* cost crossover calculator */}
      <div className="mt-4 rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest txt-3">💰 Cost crossover calculator</div>
        <div className="mb-2 flex items-center justify-between text-xs txt-2">
          <span>Monthly volume: <strong className="txt-1">{mTok}M tokens</strong></span>
          <span className={cn('font-bold', openWins ? 'text-emerald-500' : 'text-brand-500 dark:text-brand-300')}>{openWins ? 'open weights wins' : 'closed API wins'}</span>
        </div>
        <input type="range" min="1" max="500" value={mTok} onChange={(e) => { onInteract?.(); setMTok(+e.target.value) }} className="w-full accent-brand-500" aria-label="Monthly token volume in millions" />
        <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs">
          <div className={cn('rounded-lg p-2', !openWins ? 'bg-brand-500/10' : 'bg-zinc-100 dark:bg-zinc-800/60')}>
            <div className="font-bold tabular-nums txt-1">${apiCost.toLocaleString()}</div>
            <div className="text-[10px] txt-3">API @ ~${API_PER_MTOK}/M tokens</div>
          </div>
          <div className={cn('rounded-lg p-2', openWins ? 'bg-emerald-500/10' : 'bg-zinc-100 dark:bg-zinc-800/60')}>
            <div className="font-bold tabular-nums txt-1">${(GPU_MONTHLY * 1.5).toLocaleString()}</div>
            <div className="text-[10px] txt-3">GPU node + ops overhead</div>
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed txt-3">Toy numbers for intuition — real math includes model quality needs, traffic spikiness, and eng time. The shape holds: APIs win small, self-hosting wins huge-and-steady.</p>
      </div>
    </div>
  )
}
