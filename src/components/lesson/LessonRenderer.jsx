import { Lightbulb, Info, AlertTriangle, Wand2, ListChecks, Briefcase, Hammer, Swords, BookMarked, MessageSquare, AlertOctagon, FlaskConical } from 'lucide-react'
import RichText from '../ui/RichText'
import CodeBlock from './CodeBlock'
import CodePlayground from './CodePlayground'
import Quiz from './Quiz'
import Flashcards from './Flashcards'
import Accordion from './Accordion'
import { DIAGRAMS, DEMOS } from './registry'
import { useStore } from '../../store/store'

const CALLOUT = {
  tip: { icon: Lightbulb, cls: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400', label: 'Tip' },
  info: { icon: Info, cls: 'border-sky-500/30 bg-sky-500/5 text-sky-600 dark:text-sky-400', label: 'Good to know' },
  warn: { icon: AlertTriangle, cls: 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400', label: 'Watch out' },
  analogy: { icon: Wand2, cls: 'border-brand-500/30 bg-brand-500/5 text-brand-600 dark:text-brand-300', label: 'Analogy' },
}

function Callout({ variant = 'info', title, text }) {
  const v = CALLOUT[variant] ?? CALLOUT.info
  return (
    <div className={`rounded-xl border p-4 ${v.cls}`}>
      <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
        <v.icon size={14} /> {title || v.label}
      </div>
      <div className="text-sm leading-relaxed txt-2"><RichText text={text} /></div>
    </div>
  )
}

function BlockHeading({ icon: Icon, children, color = 'text-brand-500 dark:text-brand-300' }) {
  return (
    <div className={`mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${color}`}>
      <Icon size={16} /> {children}
    </div>
  )
}

function Block({ block, lessonId }) {
  const useDemo = useStore((s) => s.useDemo)
  const bumpCounter = useStore((s) => s.bumpCounter)

  switch (block.type) {
    case 'p':
      return <p className="lesson-p text-[15px]"><RichText text={block.text} /></p>

    case 'h':
      return <h3 className="pt-2 text-lg font-bold tracking-tight txt-1"><RichText text={block.text} /></h3>

    case 'list':
      return (
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed txt-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              <span><RichText text={item} /></span>
            </li>
          ))}
        </ul>
      )

    case 'callout':
      return <Callout {...block} />

    case 'code':
      return <CodeBlock {...block} />

    case 'table':
      return (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900">
                {block.headers.map((h, i) => <th key={i} className="px-4 py-2.5 text-left font-semibold txt-1">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-zinc-200/60 last:border-0 dark:border-zinc-800/60">
                  {row.map((cell, j) => <td key={j} className="px-4 py-2.5 txt-2"><RichText text={cell} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'diagram': {
      const D = DIAGRAMS[block.id]
      if (!D) return null
      return (
        <figure className="card overflow-hidden p-4">
          <D />
          {block.caption && <figcaption className="mt-3 text-center text-xs txt-3"><RichText text={block.caption} /></figcaption>}
        </figure>
      )
    }

    case 'demo': {
      const Demo = DEMOS[block.id]
      if (!Demo) return null
      return (
        <div className="card overflow-hidden border-brand-400/30 p-0">
          <div className="flex items-center gap-2 border-b border-zinc-200 bg-gradient-to-r from-brand-500/10 to-indigo-500/10 px-4 py-2.5 dark:border-zinc-800">
            <FlaskConical size={15} className="text-brand-500 dark:text-brand-300" />
            <span className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-300">Interactive demo</span>
            <span className="ml-auto chip-brand">+10 XP for playing</span>
          </div>
          <div className="p-4 sm:p-5">
            <Demo onInteract={() => useDemo(lessonId, block.id)} />
          </div>
        </div>
      )
    }

    case 'playground':
      return (
        <div>
          {block.title && (
            <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-500 dark:text-brand-300">
              <FlaskConical size={15} /> {block.title} <span className="chip-brand">+10 XP first run</span>
            </div>
          )}
          <CodePlayground
            initialCode={block.code}
            lang={block.lang ?? 'javascript'}
            height={block.height}
            solution={block.solution}
            onRun={() => {
              useDemo(lessonId, `pg:${block.id}`)
              bumpCounter('playgroundRuns')
            }}
          />
          {block.caption && <p className="mt-2 text-xs txt-3"><RichText text={block.caption} /></p>}
        </div>
      )

    case 'quiz':
      return <Quiz lessonId={lessonId} questions={block.questions} />

    case 'flashcards':
      return <Flashcards lessonId={lessonId} cards={block.cards} />

    case 'summary':
      return (
        <div className="card border-emerald-500/30 p-5">
          <BlockHeading icon={ListChecks} color="text-emerald-500">TL;DR — what you learned</BlockHeading>
          <ul className="space-y-2">
            {block.points.map((point, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed txt-2">
                <span className="font-bold text-emerald-500">✓</span>
                <span><RichText text={point} /></span>
              </li>
            ))}
          </ul>
        </div>
      )

    case 'mistakes':
      return (
        <div>
          <BlockHeading icon={AlertOctagon} color="text-rose-500">Common mistakes</BlockHeading>
          <Accordion items={block.items.map((m) => ({ title: `❌ ${m.title}`, body: m.text }))} />
        </div>
      )

    case 'interview':
      return (
        <div>
          <BlockHeading icon={MessageSquare} color="text-sky-500">Interview questions</BlockHeading>
          <Accordion items={block.items.map((it) => ({ title: it.q, body: it.a }))} />
        </div>
      )

    case 'usecases':
      return (
        <div>
          <BlockHeading icon={Briefcase} color="text-amber-500">Where this shows up in real products</BlockHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            {block.items.map((u, i) => (
              <div key={i} className="card card-hover p-4">
                <div className="mb-1 text-sm font-semibold txt-1">{u.title}</div>
                <div className="text-xs leading-relaxed txt-2"><RichText text={u.text} /></div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'project':
      return (
        <div className="card border-brand-400/40 p-5">
          <BlockHeading icon={Hammer}>Mini project: {block.title}</BlockHeading>
          <p className="mb-3 text-sm leading-relaxed txt-2"><RichText text={block.goal} /></p>
          <ol className="space-y-2.5">
            {block.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed txt-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-600 dark:text-brand-300">{i + 1}</span>
                <span className="pt-0.5"><RichText text={s} /></span>
              </li>
            ))}
          </ol>
          {block.deliverable && (
            <div className="mt-4 rounded-xl bg-zinc-100 p-3 text-xs txt-2 dark:bg-zinc-800/60">
              <strong className="txt-1">Deliverable: </strong><RichText text={block.deliverable} />
            </div>
          )}
        </div>
      )

    case 'challenge':
      return (
        <div className="card border-amber-500/40 p-5">
          <BlockHeading icon={Swords} color="text-amber-500">Challenge: {block.title}</BlockHeading>
          <p className="text-sm leading-relaxed txt-2"><RichText text={block.text} /></p>
          {block.hints?.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-brand-500 dark:text-brand-300">Need a hint?</summary>
              <ul className="mt-2 space-y-1.5">
                {block.hints.map((h, i) => (
                  <li key={i} className="text-xs leading-relaxed txt-3">💡 <RichText text={h} /></li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )

    case 'reading':
      return (
        <div>
          <BlockHeading icon={BookMarked} color="text-zinc-500 dark:text-zinc-400">Further reading</BlockHeading>
          <ul className="space-y-2">
            {block.links.map((l, i) => (
              <li key={i} className="text-sm">
                <a href={l.url} target="_blank" rel="noreferrer" className="font-medium text-brand-600 underline underline-offset-2 dark:text-brand-300">{l.label}</a>
                {l.note && <span className="ml-2 text-xs txt-3">— {l.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )

    default:
      return null
  }
}

export default function LessonRenderer({ content, lessonId }) {
  return (
    <div className="space-y-10">
      {content.sections.map((section, si) => (
        <section key={section.id} id={section.id} className="scroll-mt-24">
          {/* the compact heading carries the observer target: whole-section ratios never fire for sections taller than the viewport */}
          <div data-section={section.id} className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-600 dark:text-brand-300">{si + 1}</span>
            <h2 className="text-xl font-bold tracking-tight txt-1">{section.title}</h2>
          </div>
          <div className="space-y-5">
            {section.blocks.map((block, bi) => <Block key={bi} block={block} lessonId={lessonId} />)}
          </div>
        </section>
      ))}
    </div>
  )
}
