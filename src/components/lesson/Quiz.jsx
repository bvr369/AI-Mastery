import { useState } from 'react'
import { CheckCircle2, XCircle, RotateCcw, Trophy, ArrowRight } from 'lucide-react'
import { useStore } from '../../store/store'
import RichText from '../ui/RichText'
import ProgressBar from '../ui/ProgressBar'
import { cn } from '../../lib/utils'

export default function Quiz({ lessonId, questions }) {
  const recordQuiz = useStore((s) => s.recordQuiz)
  const best = useStore((s) => s.lessons[lessonId]?.quizBest ?? 0)

  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)

  const q = questions[idx]
  const isLast = idx === questions.length - 1

  const pick = (i) => {
    if (picked !== null) return
    setPicked(i)
    if (i === q.answer) setCorrectCount((c) => c + 1)
  }

  const next = () => {
    if (isLast) {
      const pct = Math.round((correctCount / questions.length) * 100)
      recordQuiz(lessonId, pct)
      setFinished(true)
    } else {
      setIdx((i) => i + 1)
      setPicked(null)
    }
  }

  const retry = () => {
    setIdx(0)
    setPicked(null)
    setCorrectCount(0)
    setFinished(false)
  }

  if (finished) {
    const pct = Math.round((correctCount / questions.length) * 100)
    const passed = pct >= 70
    return (
      <div className="card animate-pop-in p-6 text-center">
        <div className={cn('mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl', passed ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500')}>
          <Trophy size={26} />
        </div>
        <div className="text-2xl font-bold txt-1">{pct}%</div>
        <div className="mt-1 text-sm txt-2">
          {pct === 100 ? 'Perfect score. Absolutely flawless. 🎯' : passed ? 'Passed! You can complete this lesson now.' : 'Not yet — 70% needed. Review and try again.'}
        </div>
        <div className="mt-1 text-xs txt-3">{correctCount} of {questions.length} correct · best: {Math.max(best, pct)}%</div>
        <button onClick={retry} className="btn-outline mt-4">
          <RotateCcw size={14} /> {passed ? 'Retake for fun' : 'Try again'}
        </button>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="chip-brand">Question {idx + 1} / {questions.length}</span>
        {best > 0 && <span className="chip-zinc">Best: {best}%</span>}
        <div className="flex-1" />
        <ProgressBar value={(idx / questions.length) * 100} className="w-24" />
      </div>

      <div className="mb-4 text-[15px] font-semibold leading-snug txt-1">
        <RichText text={q.q} />
      </div>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const chosen = picked === i
          const revealCorrect = picked !== null && i === q.answer
          const wrongPick = chosen && i !== q.answer
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all',
                picked === null && 'border-zinc-200 hover:border-brand-400 hover:bg-brand-500/5 dark:border-zinc-700',
                revealCorrect && 'border-emerald-500 bg-emerald-500/10',
                wrongPick && 'border-rose-500 bg-rose-500/10',
                picked !== null && !revealCorrect && !wrongPick && 'border-zinc-200 opacity-50 dark:border-zinc-800'
              )}
            >
              <span className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold',
                revealCorrect ? 'border-emerald-500 text-emerald-500' : wrongPick ? 'border-rose-500 text-rose-500' : 'border-zinc-300 txt-3 dark:border-zinc-600'
              )}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 txt-1"><RichText text={opt} /></span>
              {revealCorrect && <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />}
              {wrongPick && <XCircle size={18} className="shrink-0 text-rose-500" />}
            </button>
          )
        })}
      </div>

      {picked !== null && (
        <div className="mt-4 animate-fade-up">
          <div className={cn('rounded-xl p-3.5 text-sm leading-relaxed', picked === q.answer ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300')}>
            <strong>{picked === q.answer ? 'Correct! ' : 'Not quite. '}</strong>
            <span className="txt-2"><RichText text={q.explain} /></span>
          </div>
          <button onClick={next} className="btn-primary mt-3 w-full">
            {isLast ? 'See results' : 'Next question'} <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
