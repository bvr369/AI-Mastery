import { useMemo, useState } from 'react'
import {
  MessageSquare, FileText, Braces, Scale, FlaskConical, Search, Database, Headphones,
  FileCode2, ListChecks, Layers, Rocket, Hammer, ArrowLeft, Clock, CheckCircle2, Bookmark,
  Wrench, Puzzle, ChevronRight, Zap,
} from 'lucide-react'
import { PROJECTS, PROJECT_TAGS, PROJECT_STATS, getProject } from '../data/projects'
import { useProjects, STATUS_LABELS } from '../store/projects'
import { getModule } from '../data/curriculum'
import { cn } from '../lib/utils'

const ICONS = { MessageSquare, FileText, Braces, Scale, FlaskConical, Search, Database, Headphones, FileCode2, ListChecks, Layers, Rocket, Hammer, Puzzle }
const DIFF_CLS = { Beginner: 'chip-green', Intermediate: 'chip-amber', Advanced: 'chip-rose' }
const STATUS_CLS = { saved: 'chip-zinc', building: 'chip-amber', done: 'chip-green' }

function ProjectCard({ project, status, onOpen }) {
  const Icon = ICONS[project.icon] ?? Puzzle
  return (
    <button onClick={() => onOpen(project.id)} className="card card-hover flex flex-col p-4 text-left">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-indigo-500/20 text-brand-500 dark:text-brand-300">
          <Icon size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-bold txt-1">{project.title}</h3>
            {status && <span className={STATUS_CLS[status]}>{status === 'done' ? '✓' : ''}{STATUS_LABELS[status]}</span>}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed txt-2">{project.tagline}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className={DIFF_CLS[project.difficulty]}>{project.difficulty}</span>
        <span className="chip-zinc"><Clock size={10} /> ~{project.hours}h</span>
        {project.tags.slice(0, 2).map((t) => <span key={t} className="chip-brand">{t}</span>)}
      </div>
    </button>
  )
}

function Detail({ id, onBack }) {
  const project = getProject(id)
  const status = useProjects((s) => s.status[id])
  const setStatus = useProjects((s) => s.setStatus)
  const Icon = ICONS[project.icon] ?? Puzzle

  return (
    <div className="animate-fade-up">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium txt-3 hover:text-brand-500">
        <ArrowLeft size={13} /> All projects
      </button>

      <div className="card overflow-hidden">
        <div className="relative bg-gradient-to-r from-brand-500/10 to-indigo-500/10 p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-glow">
              <Icon size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight txt-1">{project.title}</h1>
              <p className="mt-1 text-sm txt-2">{project.tagline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={DIFF_CLS[project.difficulty]}>{project.difficulty}</span>
                <span className="chip-zinc"><Clock size={11} /> ~{project.hours} hours</span>
                {project.modules.map((m) => {
                  const mod = getModule('m' + m)
                  return <span key={m} className="chip-brand">Module {m}{mod ? `: ${mod.title.split(':')[0]}` : ''}</span>
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {['saved', 'building', 'done'].map((st) => (
              <button
                key={st}
                onClick={() => setStatus(id, status === st ? undefined : st)}
                className={cn('btn px-3 py-1.5 text-xs', status === st ? 'btn-primary' : 'btn-outline')}
              >
                {st === 'saved' && <Bookmark size={13} />}
                {st === 'building' && <Wrench size={13} />}
                {st === 'done' && <CheckCircle2 size={13} />}
                {STATUS_LABELS[st]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 p-6">
          <Section title="What you'll build">
            <p className="text-sm leading-relaxed txt-2">{project.overview}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {project.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs txt-2"><Zap size={12} className="mt-0.5 shrink-0 text-brand-500 dark:text-brand-300" /> {f}</div>
              ))}
            </div>
          </Section>

          <Section title="Architecture">
            <p className="text-sm leading-relaxed txt-2">{project.architecture}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.stack.map((s) => <span key={s} className="chip-zinc">{s}</span>)}
            </div>
          </Section>

          <Section title="Build milestones">
            <ol className="space-y-2.5">
              {project.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-600 dark:text-brand-300">{i + 1}</span>
                  <div>
                    <div className="text-sm font-semibold txt-1">{step.title}</div>
                    <div className="text-xs leading-relaxed txt-2">{step.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Folder structure">
            <pre className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed txt-2 dark:border-zinc-800 dark:bg-zinc-950/50">{project.structure}</pre>
          </Section>

          <Section title="Production focus">
            <div className="grid gap-2 sm:grid-cols-2">
              {project.focus.map((f, i) => (
                <div key={i} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="text-xs font-bold text-brand-600 dark:text-brand-300">{f.area}</div>
                  <div className="mt-0.5 text-xs leading-relaxed txt-2">{f.note}</div>
                </div>
              ))}
            </div>
          </Section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="Stretch goals">
              <ul className="space-y-1.5">
                {project.stretch.map((s, i) => <li key={i} className="flex gap-2 text-xs txt-2"><ChevronRight size={12} className="mt-0.5 shrink-0 text-brand-400" /> {s}</li>)}
              </ul>
            </Section>
            <Section title="Why it's portfolio-worthy">
              <p className="rounded-xl bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">{project.portfolio}</p>
            </Section>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-500 dark:text-brand-300">{title}</h2>
      {children}
    </div>
  )
}

export default function Projects() {
  const [openId, setOpenId] = useState(null)
  const [difficulty, setDifficulty] = useState('all')
  const [tag, setTag] = useState(null)
  const statusMap = useProjects((s) => s.status)

  const filtered = useMemo(() =>
    PROJECTS.filter((p) => (difficulty === 'all' || p.difficulty === difficulty) && (!tag || p.tags.includes(tag))),
    [difficulty, tag])

  const doneCount = Object.values(statusMap).filter((v) => v === 'done').length

  if (openId) return <div className="mx-auto max-w-3xl"><Detail id={openId} onBack={() => setOpenId(null)} /></div>

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight txt-1">Projects Hub</h1>
        <p className="mt-1 text-sm txt-2">
          {PROJECT_STATS.count} guided, portfolio-grade builds — architecture, milestones, and the production concerns real AI engineers handle. {doneCount > 0 && <span className="text-emerald-500">{doneCount} completed.</span>}
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {['all', 'Beginner', 'Intermediate', 'Advanced'].map((d) => (
          <button key={d} onClick={() => setDifficulty(d)} className={difficulty === d ? 'chip-brand' : 'chip-zinc'}>{d === 'all' ? 'All levels' : d}</button>
        ))}
        <span className="mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
        {PROJECT_TAGS.slice(0, 8).map((t) => (
          <button key={t} onClick={() => setTag(tag === t ? null : t)} className={tag === t ? 'chip-brand' : 'chip-zinc'}>{t}</button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => <ProjectCard key={p.id} project={p} status={statusMap[p.id]} onOpen={setOpenId} />)}
      </div>
      {filtered.length === 0 && <div className="card p-10 text-center text-sm txt-3">No projects match that filter.</div>}

      <p className="mt-6 text-center text-xs txt-3">More projects (agents, multi-agent systems, fine-tuning, deployment) arrive as later modules unlock. This is the first {PROJECT_STATS.count} of 50+.</p>
    </div>
  )
}
