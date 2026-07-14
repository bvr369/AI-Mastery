import { useEffect, useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Zap, Lock, GraduationCap, Check } from 'lucide-react'
import { getLesson, adjacentLessons } from '../data/curriculum'
import { LESSON_CONTENT } from '../data/lessons'
import { useStore } from '../store/store'
import LessonRenderer from '../components/lesson/LessonRenderer'
import NotesDrawer from '../components/lesson/NotesDrawer'
import { cn } from '../lib/utils'

const DIFF_CLS = { Beginner: 'chip-green', Intermediate: 'chip-amber', Advanced: 'chip-rose' }

export default function Lesson() {
  const { lessonId } = useParams()
  const meta = getLesson(lessonId)
  const content = LESSON_CONTENT[lessonId]

  const startLesson = useStore((s) => s.startLesson)
  const markSection = useStore((s) => s.markSection)
  const completeLesson = useStore((s) => s.completeLesson)
  const progress = useStore((s) => s.lessons[lessonId])

  useEffect(() => {
    if (meta && content) startLesson(lessonId)
  }, [lessonId, meta, content, startLesson])

  // mark sections as "seen" while scrolling
  useEffect(() => {
    if (!content) return
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && markSection(lessonId, e.target.dataset.section)),
      { threshold: 0.6 }
    )
    document.querySelectorAll('[data-section]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [lessonId, content, markSection])

  const { prev, next } = useMemo(() => adjacentLessons(lessonId), [lessonId])

  if (!meta) return <Navigate to="/roadmap" replace />

  if (!content) {
    return (
      <div className="card mx-auto mt-10 max-w-md animate-pop-in p-8 text-center">
        <Lock size={28} className="mx-auto mb-3 txt-3" />
        <h1 className="text-lg font-bold txt-1">{meta.title}</h1>
        <p className="mt-2 text-sm txt-2">This lesson arrives in <strong>Phase {meta.modulePhase}</strong>. The course is built incrementally — finish the live lessons first!</p>
        <Link to="/roadmap" className="btn-primary mt-5">Back to roadmap</Link>
      </div>
    )
  }

  const quizBest = progress?.quizBest ?? 0
  const completed = progress?.status === 'completed'
  const canComplete = quizBest >= 70 && !completed
  const sectionsDone = progress?.sections ?? {}

  return (
    <div className="animate-fade-up">
      {/* header */}
      <div className="mb-8">
        <Link to="/roadmap" className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium txt-3 hover:text-brand-500">
          <ArrowLeft size={13} /> Roadmap · Module {meta.moduleNum} — {meta.moduleTitle}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight txt-1">{meta.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed txt-2">{meta.desc}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={DIFF_CLS[meta.difficulty]}>{meta.difficulty}</span>
          <span className="chip-zinc"><Clock size={11} /> ~{meta.minutes} min</span>
          <span className="chip-brand"><Zap size={11} /> +{meta.xp} XP on completion</span>
          <NotesDrawer lessonId={lessonId} lessonTitle={meta.title} />
          {completed && <span className="chip-green"><CheckCircle2 size={11} /> Completed</span>}
          {meta.prereqs?.length > 0 && (
            <span className="text-xs txt-3">
              Prerequisites: {meta.prereqs.map((p, i) => {
                const pl = getLesson(p)
                return <Link key={p} to={`/learn/${p}`} className="font-medium text-brand-500 hover:underline dark:text-brand-300">{i > 0 && ', '}{pl?.title}</Link>
              })}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_200px]">
        {/* content */}
        <div>
          <LessonRenderer content={content} lessonId={lessonId} />

          {/* completion */}
          <div className={cn('card mt-10 p-6 text-center', completed ? 'border-emerald-500/40' : 'border-brand-400/40')}>
            {completed ? (
              <>
                <CheckCircle2 size={30} className="mx-auto mb-2 text-emerald-500" />
                <div className="text-lg font-bold txt-1">Lesson completed 🎉</div>
                <p className="mt-1 text-sm txt-2">XP banked. Your flashcards are scheduled for review.</p>
              </>
            ) : (
              <>
                <GraduationCap size={30} className="mx-auto mb-2 text-brand-500 dark:text-brand-300" />
                <div className="text-lg font-bold txt-1">Finish this lesson</div>
                <p className="mt-1 text-sm txt-2">
                  {canComplete
                    ? `Quiz passed with ${quizBest}% — claim your +${meta.xp} XP.`
                    : `Pass the quiz (70%+) to unlock completion. ${quizBest > 0 ? `Current best: ${quizBest}%.` : ''}`}
                </p>
                <button
                  onClick={() => completeLesson(meta)}
                  disabled={!canComplete}
                  className="btn-primary mx-auto mt-4"
                >
                  <Zap size={15} /> Complete lesson · +{meta.xp} XP
                </button>
              </>
            )}
            {completed && next?.live && (
              <Link to={`/learn/${next.id}`} className="btn-outline mx-auto mt-3">
                Next: {next.title} <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {/* prev / next */}
          <div className="mt-6 flex items-center justify-between gap-3">
            {prev?.live ? (
              <Link to={`/learn/${prev.id}`} className="btn-ghost max-w-[45%]"><ArrowLeft size={14} /> <span className="truncate">{prev.title}</span></Link>
            ) : <span />}
            {next && (
              next.live ? (
                <Link to={`/learn/${next.id}`} className="btn-ghost ml-auto max-w-[55%] text-right"><span className="truncate">{next.title}</span> <ArrowRight size={14} /></Link>
              ) : (
                <span className="ml-auto flex items-center gap-1.5 text-xs txt-3"><Lock size={12} /> Next: {next.title} (Phase {next.modulePhase})</span>
              )
            )}
          </div>
        </div>

        {/* sticky table of contents */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest txt-3">On this page</div>
            <nav className="space-y-1 border-l border-zinc-200 dark:border-zinc-800">
              {content.sections.map((s, i) => {
                const seen = !!sectionsDone[s.id]
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }) }}
                    className={cn(
                      '-ml-px flex items-center gap-2 border-l-2 py-1.5 pl-3 text-xs transition-colors',
                      seen ? 'border-emerald-500/70 txt-2' : 'border-transparent txt-3 hover:border-brand-400 hover:text-brand-500'
                    )}
                  >
                    <span className="flex-1">{i + 1}. {s.title}</span>
                    {seen && <Check size={11} className="text-emerald-500" />}
                  </a>
                )
              })}
            </nav>
            <div className="mt-4 rounded-xl bg-zinc-100 p-3 text-[11px] leading-relaxed txt-3 dark:bg-zinc-900">
              Sections tick off as you read. Quiz gates completion; flashcards feed your Review deck.
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
