import { useState } from 'react'
import { ShieldAlert, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '../../../lib/utils'

/** Spot-the-hallucination game: both answers sound right; one is fabricated. */

const ROUNDS = [
  {
    q: '“How do I debounce a search input in React?”',
    answers: [
      { text: 'Use a useEffect with a setTimeout that fires 300ms after the query changes, and clear the timeout in the cleanup function. Libraries like lodash.debounce also work.', fake: false },
      { text: 'React ships a built-in useDebounce hook since v17 — just call const debounced = useDebounce(query, 300) and pass it to your fetch.', fake: true },
    ],
    explain: 'React has NO built-in useDebounce hook — but thousands of blog posts define a custom one with that exact name, so the model has seen the pattern “useDebounce” next to “React” countless times. Perfect conditions for a fluent fabrication.',
  },
  {
    q: '“What does the HTTP 418 status code mean?”',
    answers: [
      { text: "418 means 'Too Early' — the server refuses to process a request that might be replayed. It was introduced alongside HTTP/2 to handle 0-RTT data.", fake: true },
      { text: "418 is 'I'm a teapot' — an April Fools joke from 1998's Hyper Text Coffee Pot Control Protocol that stuck around as an easter egg.", fake: false },
    ],
    explain: "The fake blends two REAL things: status 425 actually is 'Too Early' and does relate to replays. Hallucinations are rarely pure fiction — they're plausible remixes of true fragments, which is what makes them slippery.",
  },
  {
    q: '“Cite a paper on transformer attention.”',
    answers: [
      { text: '“Attention Is All You Need” (Vaswani et al., 2017), the paper that introduced the transformer architecture.', fake: false },
      { text: '“Scaled Contextual Attention Networks for Sequence Modeling” (Chen & Rodriguez, 2019), published at NeurIPS, which first proposed multi-head attention.', fake: true },
    ],
    explain: 'Fabricated citations are the classic hallucination: the title, author names, venue, and year are all *statistically plausible* — models have seen thousands of real citations shaped exactly like this. Always verify citations exist.',
  },
]

export default function DemoHallucinationGame({ onInteract }) {
  const [round, setRound] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const r = ROUNDS[round]

  const pick = (i) => {
    if (picked !== null) return
    onInteract?.()
    setPicked(i)
    if (r.answers[i].fake) setScore((s) => s + 1)
  }

  const next = () => {
    if (round + 1 >= ROUNDS.length) setDone(true)
    else {
      setRound((x) => x + 1)
      setPicked(null)
    }
  }

  const restart = () => { setRound(0); setPicked(null); setScore(0); setDone(false) }

  if (done) {
    return (
      <div className="p-4 text-center">
        <ShieldAlert size={26} className="mx-auto mb-2 text-amber-500" />
        <div className="text-lg font-bold txt-1">{score}/{ROUNDS.length} hallucinations caught</div>
        <p className="mx-auto mt-1 max-w-md text-sm txt-2">
          {score === ROUNDS.length
            ? 'Perfect. Notice HOW you caught them: you verified against knowledge, not vibes. Your users mostly can\'t — that\'s why your systems must.'
            : 'The ones that got past you looked exactly as confident as the truth. That\'s the entire problem — and why production AI needs grounding and evals.'}
        </p>
        <button onClick={restart} className="btn-outline mx-auto mt-3"><RotateCcw size={13} /> Play again</button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs txt-3">
        <span className="chip-amber">Round {round + 1} / {ROUNDS.length}</span>
        <span>One answer is fabricated. Which?</span>
      </div>
      <div className="mb-3 rounded-xl bg-zinc-100 p-3 text-sm font-medium txt-1 dark:bg-zinc-800/60">{r.q}</div>
      <div className="space-y-2">
        {r.answers.map((a, i) => {
          const revealed = picked !== null
          const isFake = a.fake
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={revealed}
              className={cn(
                'w-full rounded-xl border p-3.5 text-left text-sm leading-relaxed transition-all',
                !revealed && 'border-zinc-300 txt-2 hover:border-amber-400 hover:bg-amber-500/5 dark:border-zinc-700',
                revealed && isFake && 'border-rose-500 bg-rose-500/10 txt-1',
                revealed && !isFake && 'border-emerald-500 bg-emerald-500/10 txt-1'
              )}
            >
              <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                {revealed ? (
                  isFake ? <><XCircle size={12} className="text-rose-500" /> <span className="text-rose-500">Fabricated {picked === i && '— you picked it ✓'}</span></>
                         : <><CheckCircle2 size={12} className="text-emerald-500" /> <span className="text-emerald-500">Real {picked === i && '— you picked the true one ✗'}</span></>
                ) : (
                  <span className="txt-3">Model answer {i + 1}</span>
                )}
              </span>
              {a.text}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <div className="mt-3 animate-fade-up">
          <div className="rounded-xl bg-amber-500/10 p-3.5 text-sm leading-relaxed text-amber-700 dark:text-amber-300">{r.explain}</div>
          <button onClick={next} className="btn-primary mt-3 w-full">{round + 1 >= ROUNDS.length ? 'See score' : 'Next round'}</button>
        </div>
      )}
    </div>
  )
}
