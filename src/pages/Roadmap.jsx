import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, Plug, PenTool, FileCode2, Cpu, Compass, Database, Bot, Network,
  FlaskConical, Wrench, Rocket, ChevronDown, CheckCircle2, Play, Lock, Clock, Zap,
} from 'lucide-react'
import { MODULES, COURSE_STATS, ALL_LESSONS, nextUp } from '../data/curriculum'
import { useStore } from '../store/store'
import ProgressBar from '../components/ui/ProgressBar'
import { fmtMinutes, fmtNumber, cn } from '../lib/utils'

const ICONS = { Sparkles, Plug, PenTool, FileCode2, Cpu, Compass, Database, Bot, Network, FlaskConical, Wrench, Rocket }

const DIFF_CLS = { Beginner: 'chip-green', Intermediate: 'chip-amber', Advanced: 'chip-rose' }

function LessonRow({ lesson, status }) {
  const done = status === 'completed'
  const row = (
    <div className={cn(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
      lesson.live ? 'hover:bg-brand-500/5' : 'opacity-50'
    )}>
      {done ? (
        <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
      ) : lesson.live ? (
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-brand-500/15"><Play size={9} className="ml-px text-brand-500 dark:text-brand-300" /></span>
      ) : (
        <Lock size={16} className="shrink-0 txt-3" />
      )}
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-sm font-medium', done ? 'txt-3 line-through decoration-emerald-500/50' : 'txt-1')}>{lesson.title}</span>
        <span className="block truncate text-xs txt-3">{lesson.desc}</span>
      </span>
      <span className="hidden items-center gap-2 sm:flex">
        <span className={DIFF_CLS[lesson.difficulty]}>{lesson.difficulty}</span>
        <span className="chip-zinc"><Clock size={10} /> {lesson.minutes}m</span>
        <span className="chip-brand"><Zap size={10} /> {lesson.xp}</span>
      </span>
    </div>
  )
  return lesson.live ? <Link to={`/learn/${lesson.id}`}>{row}</Link> : row
}

export default function Roadmap() {
  const lessons = useStore((s) => s.lessons)
  const next = nextUp(lessons)
  const [open, setOpen] = useState(() => new Set([next?.moduleId ?? 'm1']))

  const toggle = (id) =>
    setOpen((prev) => {
      const nx = new Set(prev)
      nx.has(id) ? nx.delete(id) : nx.add(id)
      return nx
    })

  const completedTotal = ALL_LESSONS.filter((l) => lessons[l.id]?.status === 'completed').length

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight txt-1">Your roadmap to <span className="grad-text">AI Engineer</span></h1>
        <p className="mt-1 text-sm txt-2">
          {COURSE_STATS.modules} modules · {COURSE_STATS.lessons} lessons · ~{fmtMinutes(COURSE_STATS.minutes)} of guided building · {fmtNumber(COURSE_STATS.xp)} XP up for grabs
        </p>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={(completedTotal / COURSE_STATS.lessons) * 100} className="h-2 max-w-md" />
          <span className="text-xs font-medium txt-3">{completedTotal}/{COURSE_STATS.lessons}</span>
        </div>
        <p className="mt-2 text-xs txt-3">
          {COURSE_STATS.liveLessons} lessons are live now — the rest roll out phase by phase, in order.
        </p>
      </div>

      <div className="relative space-y-4">
        {/* timeline spine */}
        <div className="absolute bottom-6 left-[26px] top-6 hidden w-px bg-gradient-to-b from-brand-500/60 via-zinc-300 to-zinc-200 dark:via-zinc-700 dark:to-zinc-800 sm:block" />

        {MODULES.map((m) => {
          const Icon = ICONS[m.icon] ?? Sparkles
          const isOpen = open.has(m.id)
          const liveCnt = m.lessons.filter((l) => l.live).length
          const done = m.lessons.filter((l) => lessons[l.id]?.status === 'completed').length
          const available = liveCnt > 0
          const totalMin = m.lessons.reduce((a, l) => a + l.minutes, 0)

          return (
            <div key={m.id} className="relative sm:pl-14">
              <div className={cn(
                'absolute left-0 top-4 hidden h-[52px] w-[52px] items-center justify-center rounded-2xl border sm:flex',
                available ? 'border-brand-400/50 bg-brand-500/10 text-brand-500 shadow-glow dark:text-brand-300' : 'border-zinc-200 bg-white txt-3 dark:border-zinc-800 dark:bg-zinc-900'
              )}>
                <Icon size={22} />
              </div>

              <div className={cn('card overflow-hidden', available && 'border-brand-400/30')}>
                <button onClick={() => toggle(m.id)} className="flex w-full items-center gap-4 p-4 text-left sm:p-5">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest txt-3">Module {m.num}</span>
                      {available
                        ? <span className="chip-green">● live now</span>
                        : <span className="chip-zinc"><Lock size={10} /> Phase {m.phase}</span>}
                    </span>
                    <span className="mt-0.5 block text-base font-bold tracking-tight txt-1">{m.title}</span>
                    <span className="block text-xs txt-3">{m.tagline}</span>
                  </span>
                  <span className="hidden shrink-0 text-right text-xs txt-3 md:block">
                    <span className="block">{m.lessons.length} lessons · {fmtMinutes(totalMin)}</span>
                    {available && <span className="block font-medium text-emerald-500">{done}/{m.lessons.length} completed</span>}
                  </span>
                  <ChevronDown size={18} className={cn('shrink-0 txt-3 transition-transform duration-200', isOpen && 'rotate-180')} />
                </button>

                {available && <div className="px-4 pb-1 sm:px-5"><ProgressBar value={(done / m.lessons.length) * 100} /></div>}

                {isOpen && (
                  <div className="animate-fade-up space-y-0.5 border-t border-zinc-200 p-2 dark:border-zinc-800">
                    {m.lessons.map((l) => (
                      <LessonRow key={l.id} lesson={l} status={lessons[l.id]?.status} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
