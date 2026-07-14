import { useState } from 'react'
import { RotateCcw, Layers, CheckCircle2 } from 'lucide-react'
import { useStore } from '../../store/store'
import RichText from '../ui/RichText'
import { cn } from '../../lib/utils'

/**
 * Shared flashcard deck. Used inside lessons and on the Review page.
 * cards: [{ id, front, back, lessonId }]
 * Grades feed the SM-2-lite scheduler in the store.
 */
export function FlashcardDeck({ cards, onFinished }) {
  const reviewCard = useStore((s) => s.reviewCard)
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [graded, setGraded] = useState({ again: 0, good: 0, easy: 0 })

  const card = cards[i]

  const grade = (g) => {
    reviewCard(card.id, card.lessonId, g)
    setGraded((prev) => ({ ...prev, [g]: prev[g] + 1 }))
    setFlipped(false)
    if (i + 1 >= cards.length) {
      setDone(true)
      onFinished?.()
    } else {
      // small delay so the card flips back before content swaps
      setTimeout(() => setI((x) => x + 1), 180)
    }
  }

  const restart = () => {
    setI(0)
    setFlipped(false)
    setDone(false)
    setGraded({ again: 0, good: 0, easy: 0 })
  }

  if (!cards.length) return null

  if (done) {
    return (
      <div className="card animate-pop-in p-6 text-center">
        <CheckCircle2 size={30} className="mx-auto mb-2 text-emerald-500" />
        <div className="text-lg font-bold txt-1">Deck reviewed!</div>
        <div className="mt-1 text-sm txt-2">
          {graded.easy} easy · {graded.good} good · {graded.again} to see again
        </div>
        <p className="mt-2 text-xs txt-3">Cards you graded come back on a spaced-repetition schedule — check the Review tab.</p>
        <button onClick={restart} className="btn-outline mt-4"><RotateCcw size={14} /> Go through again</button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs txt-3">
        <span className="flex items-center gap-1.5"><Layers size={13} /> Card {i + 1} of {cards.length}</span>
        <span>{flipped ? 'How well did you know it?' : 'Think, then click to flip'}</span>
      </div>

      <div className="flip-scene cursor-pointer select-none" onClick={() => setFlipped((f) => !f)}>
        <div className={cn('flip-inner relative h-56', flipped && 'flipped')}>
          <div className="flip-face card absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-brand-500 dark:text-brand-300">Question</div>
              <div className="text-lg font-semibold leading-snug txt-1"><RichText text={card.front} /></div>
            </div>
          </div>
          <div className="flip-face flip-back card absolute inset-0 flex items-center justify-center border-brand-400/40 p-6">
            <div className="text-center">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-500">Answer</div>
              <div className="text-sm leading-relaxed txt-1"><RichText text={card.back} /></div>
            </div>
          </div>
        </div>
      </div>

      <div className={cn('mt-4 grid grid-cols-3 gap-2 transition-opacity', !flipped && 'pointer-events-none opacity-30')}>
        <button onClick={() => grade('again')} className="btn border border-rose-500/40 text-rose-500 hover:bg-rose-500/10">Again</button>
        <button onClick={() => grade('good')} className="btn border border-brand-500/40 text-brand-500 hover:bg-brand-500/10 dark:text-brand-300">Good</button>
        <button onClick={() => grade('easy')} className="btn border border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10">Easy</button>
      </div>
    </div>
  )
}

/** Lesson block wrapper: stamps lessonId onto each card. */
export default function Flashcards({ lessonId, cards }) {
  const deck = cards.map((c) => ({ ...c, lessonId }))
  return <FlashcardDeck cards={deck} />
}
