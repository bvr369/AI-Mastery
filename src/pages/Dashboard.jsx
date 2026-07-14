import { Link } from 'react-router-dom'
import {
  Play, Flame, Zap, GraduationCap, Layers, Trophy, ArrowRight, Clock,
  Award, Lock, Map, Sparkles,
} from 'lucide-react'
import { useStore, selectDueCards } from '../store/store'
import { levelInfo } from '../lib/levels'
import { MODULES, LIVE_LESSONS, ALL_LESSONS, nextUp, COURSE_STATS } from '../data/curriculum'
import { ACHIEVEMENTS } from '../data/achievements'
import { greeting, fmtNumber, dateKey, addDays, todayKey, cn } from '../lib/utils'
import LevelRing from '../components/ui/LevelRing'
import ProgressBar from '../components/ui/ProgressBar'
import Heatmap from '../components/dashboard/Heatmap'

function StatCard({ icon: Icon, label, value, sub, tone = 'text-brand-500 dark:text-brand-300' }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs font-medium txt-3">
        <Icon size={14} className={tone} /> {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold tracking-tight txt-1">{value}</div>
      {sub && <div className="mt-0.5 text-xs txt-3">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const xp = useStore((s) => s.xp)
  const streak = useStore((s) => s.streak)
  const activity = useStore((s) => s.activity)
  const lessons = useStore((s) => s.lessons)
  const earned = useStore((s) => s.achievements)
  const dueCount = useStore((s) => selectDueCards(s).length)

  const info = levelInfo(xp)
  const next = nextUp(lessons)
  const completedCount = ALL_LESSONS.filter((l) => lessons[l.id]?.status === 'completed').length
  const quizScores = Object.values(lessons).map((l) => l.quizBest).filter((b) => b > 0)
  const quizAvg = quizScores.length ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : null
  const started = next && lessons[next.id]?.status === 'in-progress'

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i - 6)
    return { key: dateKey(d), active: (activity[dateKey(d)] || 0) > 0, label: d.toLocaleDateString('en', { weekday: 'narrow' }) }
  })

  const recentAch = earned.slice(-3).reverse().map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean)
  const lockedAch = ACHIEVEMENTS.filter((a) => !earned.includes(a.id)).slice(0, 3)

  return (
    <div className="animate-fade-up space-y-5">
      {/* ---------- hero ---------- */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card relative overflow-hidden p-6 lg:col-span-2">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="flex items-start gap-5">
            <div className="min-w-0 flex-1">
              <div className="text-sm txt-3">{greeting()}, future AI Engineer 👋</div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight txt-1">
                {completedCount === 0 ? <>Ready to <span className="grad-text">start building</span>?</> : <>Keep the momentum going.</>}
              </h1>
              {next ? (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-brand-500 dark:text-brand-300">
                    {started ? 'Continue learning' : 'Up next'} · Module {next.moduleNum}
                  </div>
                  <div className="mt-1 font-semibold txt-1">{next.title}</div>
                  <div className="mt-0.5 line-clamp-1 text-xs txt-3">{next.desc}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link to={`/learn/${next.id}`} className="btn-primary">
                      <Play size={15} /> {started ? 'Resume lesson' : 'Start lesson'}
                    </Link>
                    <span className="chip-zinc"><Clock size={11} /> {next.minutes}m</span>
                    <span className="chip-brand"><Zap size={11} /> +{next.xp} XP</span>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm txt-2">You've finished every live lesson! Phase 2 adds the rest of Module 1 + all of Module 2.</p>
              )}
            </div>
            <div className="hidden shrink-0 flex-col items-center sm:flex">
              <LevelRing size={96} stroke={8} progress={info.progress}>
                <div className="text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wider txt-3">LVL</div>
                  <div className="text-2xl font-bold txt-1">{info.level}</div>
                </div>
              </LevelRing>
              <div className="mt-2 text-center">
                <div className="text-xs font-bold txt-1">{info.title}</div>
                {!info.isMax && <div className="text-[10px] txt-3">{info.toNext} XP → {info.nextTitle}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* streak */}
        <div className="card flex flex-col p-6">
          <div className="flex items-center gap-2 text-xs font-medium txt-3"><Flame size={14} className="text-amber-500" /> Daily streak</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={cn('text-4xl font-bold tracking-tight txt-1', streak.current > 0 && 'grad-text')}>{streak.current}</span>
            <span className="text-sm txt-3">day{streak.current === 1 ? '' : 's'}</span>
            {streak.lastActive === todayKey() && <Flame size={22} className="animate-flame text-amber-500" fill="currentColor" />}
          </div>
          <div className="mt-1 text-xs txt-3">Longest: {streak.longest} · earn any XP today to keep it alive</div>
          <div className="mt-auto flex justify-between pt-4">
            {last7.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold', d.active ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-zinc-200/70 txt-3 dark:bg-zinc-800')}>
                  {d.active ? '✓' : ''}
                </span>
                <span className="text-[9px] txt-3">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- stats ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Zap} label="Total XP" value={fmtNumber(xp)} sub={`Level ${info.level} — ${info.title}`} />
        <StatCard icon={GraduationCap} label="Lessons done" value={`${completedCount}/${LIVE_LESSONS.length}`} sub={`${COURSE_STATS.lessons} total in the course`} tone="text-emerald-500" />
        <StatCard icon={Trophy} label="Quiz average" value={quizAvg === null ? '—' : `${quizAvg}%`} sub={quizScores.length ? `across ${quizScores.length} quiz${quizScores.length > 1 ? 'zes' : ''}` : 'no quizzes yet'} tone="text-amber-500" />
        <StatCard icon={Layers} label="Cards due" value={dueCount} sub={dueCount > 0 ? 'review to keep them fresh' : 'all caught up'} tone="text-sky-500" />
      </div>

      {/* ---------- progress + heatmap ---------- */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold txt-1"><Map size={15} className="text-brand-500 dark:text-brand-300" /> Course progress</h2>
            <Link to="/roadmap" className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:underline dark:text-brand-300">Full roadmap <ArrowRight size={12} /></Link>
          </div>
          <div className="space-y-3">
            {MODULES.slice(0, 6).map((m) => {
              const done = m.lessons.filter((l) => lessons[l.id]?.status === 'completed').length
              const liveCnt = m.lessons.filter((l) => l.live).length
              const isLive = liveCnt > 0
              return (
                <div key={m.id} className={cn(!isLive && 'opacity-55')}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium txt-1">{m.num}. {m.title}</span>
                    <span className="txt-3">{isLive ? `${done}/${m.lessons.length}` : <span className="flex items-center gap-1"><Lock size={10} /> Phase {m.phase}</span>}</span>
                  </div>
                  <ProgressBar value={(done / m.lessons.length) * 100} />
                </div>
              )
            })}
            <div className="pt-1 text-center text-xs txt-3">+ {MODULES.length - 6} more modules on the roadmap</div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold txt-1"><Sparkles size={15} className="text-brand-500 dark:text-brand-300" /> Learning activity</h2>
          <Heatmap activity={activity} />
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-200 pt-4 text-center dark:border-zinc-800">
            <div>
              <div className="text-lg font-bold txt-1">{Object.keys(activity).length}</div>
              <div className="text-[10px] uppercase tracking-wide txt-3">active days</div>
            </div>
            <div>
              <div className="text-lg font-bold txt-1">{fmtNumber(Object.values(activity).reduce((a, b) => a + b, 0))}</div>
              <div className="text-[10px] uppercase tracking-wide txt-3">lifetime XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- achievements ---------- */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold txt-1"><Award size={15} className="text-amber-500" /> Achievements</h2>
          <span className="text-xs txt-3">{earned.length} / {ACHIEVEMENTS.length} unlocked</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {recentAch.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Trophy size={16} /></span>
              <span>
                <span className="block text-xs font-bold txt-1">{a.title}</span>
                <span className="block text-[10px] txt-3">{a.desc}</span>
              </span>
            </div>
          ))}
          {lockedAch.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 opacity-60 dark:border-zinc-800">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-200 txt-3 dark:bg-zinc-800"><Lock size={14} /></span>
              <span>
                <span className="block text-xs font-bold txt-2">{a.title}</span>
                <span className="block text-[10px] txt-3">{a.desc} · +{a.xp} XP</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
