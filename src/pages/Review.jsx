import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, CheckCircle2, Layers, CalendarClock } from 'lucide-react'
import { useStore } from '../store/store'
import { CARD_INDEX } from '../data/lessons'
import { getLesson } from '../data/curriculum'
import { FlashcardDeck } from '../components/lesson/Flashcards'
import { todayKey } from '../lib/utils'

export default function Review() {
  const cards = useStore((s) => s.cards)
  // derive due cards with useMemo — passing an array-building selector to useStore
  // would return a fresh reference every snapshot and re-render on every store change
  const due = useMemo(
    () => Object.entries(cards).filter(([, c]) => c.due <= todayKey()).map(([id, c]) => ({ id, ...c })),
    [cards]
  )
  const [session, setSession] = useState(null) // snapshot of due cards for this run

  const tracked = Object.keys(cards).length
  const mature = Object.values(cards).filter((c) => c.interval >= 7).length

  // resolve due card ids -> actual card content
  const resolveDeck = () =>
    due
      .map((d) => {
        const c = CARD_INDEX[d.id]
        return c ? { id: d.id, front: c.front, back: c.back, lessonId: c.lessonId } : null
      })
      .filter(Boolean)

  const nextDue = Object.values(cards)
    .map((c) => c.due)
    .filter((d) => d > todayKey())
    .sort()[0]

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight txt-1">Review</h1>
        <p className="mt-1 text-sm txt-2">
          Spaced repetition keeps knowledge from evaporating. Cards you grade in lessons come back right before you'd forget them.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { icon: RefreshCw, label: 'Due now', value: due.length, tone: 'text-brand-500 dark:text-brand-300' },
          { icon: Layers, label: 'Cards tracked', value: tracked, tone: 'text-sky-500' },
          { icon: CheckCircle2, label: 'Mature (7d+)', value: mature, tone: 'text-emerald-500' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <s.icon size={16} className={`mx-auto mb-1 ${s.tone}`} />
            <div className="text-xl font-bold txt-1">{s.value}</div>
            <div className="text-[10px] uppercase tracking-wide txt-3">{s.label}</div>
          </div>
        ))}
      </div>

      {session ? (
        <div className="mx-auto max-w-lg">
          <FlashcardDeck cards={session} onFinished={() => {}} />
          <button onClick={() => setSession(null)} className="btn-ghost mx-auto mt-4 block">End session</button>
        </div>
      ) : due.length > 0 ? (
        <div className="card mx-auto max-w-lg p-8 text-center">
          <RefreshCw size={28} className="mx-auto mb-3 animate-floaty text-brand-500 dark:text-brand-300" />
          <div className="text-lg font-bold txt-1">{due.length} card{due.length > 1 ? 's' : ''} ready for review</div>
          <p className="mt-1 text-sm txt-2">A quick session now beats re-reading a lesson next month.</p>
          <button onClick={() => setSession(resolveDeck())} className="btn-primary mx-auto mt-4">Start review session</button>
        </div>
      ) : (
        <div className="card mx-auto max-w-lg p-8 text-center">
          <CheckCircle2 size={28} className="mx-auto mb-3 text-emerald-500" />
          <div className="text-lg font-bold txt-1">All caught up!</div>
          <p className="mt-1 text-sm txt-2">
            {tracked === 0
              ? 'No cards tracked yet. Grade flashcards inside a lesson and they\'ll start appearing here on a schedule.'
              : nextDue
                ? <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} /> Next review due {nextDue}</span>
                : 'Grade more flashcards in lessons to grow your deck.'}
          </p>
          {tracked === 0 && <Link to="/roadmap" className="btn-outline mx-auto mt-4">Find a lesson</Link>}
        </div>
      )}

      {tracked > 0 && !session && (
        <div className="mx-auto mt-6 max-w-lg">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest txt-3">Your deck by lesson</div>
          <div className="card divide-y divide-zinc-200 p-0 dark:divide-zinc-800">
            {Object.entries(
              Object.entries(cards).reduce((acc, [id, c]) => {
                acc[c.lessonId] = acc[c.lessonId] || { total: 0, due: 0 }
                acc[c.lessonId].total++
                if (c.due <= todayKey()) acc[c.lessonId].due++
                return acc
              }, {})
            ).map(([lessonId, stats]) => (
              <div key={lessonId} className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1 truncate text-sm font-medium txt-1">{getLesson(lessonId)?.title ?? lessonId}</span>
                <span className="text-xs txt-3">{stats.total} cards</span>
                {stats.due > 0 && <span className="chip-brand">{stats.due} due</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
