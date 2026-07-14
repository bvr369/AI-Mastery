import { useState } from 'react'
import { Sun, Moon, Download, Trash2, Info } from 'lucide-react'
import { useStore } from '../store/store'
import Modal from '../components/ui/Modal'
import { downloadJSON, cn } from '../lib/utils'

const PHASES = [
  ['Phase 1', 'Core app, dashboard, gamification, lesson engine, Module 1 start', 'live'],
  ['Phase 2', 'Full Module 1 (8 lessons) + Module 2 (9 lessons, LLM APIs) + in-lesson code playground + notes system', 'live'],
  ['Phase 3', 'Standalone Prompt Playground (compare models, save prompts) + Module 3 + prompt-injection simulator', 'next'],
  ['Phase 4', 'Python bridge + Inside the Transformer + attention/tokenizer/sampling simulators'],
  ['Phase 5', 'Embeddings + RAG modules + vector search simulator + Projects hub (first 15)'],
  ['Phase 6', 'Agents + multi-agent modules + Agent Visualizer + 15 more projects'],
  ['Phase 7', 'Evals, fine-tuning, production modules + interview prep hub + 50+ projects total'],
  ['Phase 8', 'AI Mentor, deep analytics, knowledge graph, mock interviews, polish'],
]

export default function Settings() {
  const theme = useStore((s) => s.settings.theme)
  const setTheme = useStore((s) => s.setTheme)
  const resetAll = useStore((s) => s.resetAll)
  const [confirmReset, setConfirmReset] = useState(false)

  const exportProgress = () => {
    const state = useStore.getState()
    downloadJSON(`ai-mastery-progress-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedAt: new Date().toISOString(),
      xp: state.xp, streak: state.streak, activity: state.activity,
      lessons: state.lessons, cards: state.cards, achievements: state.achievements,
      counters: state.counters, awarded: state.awarded,
    })
  }

  return (
    <div className="animate-fade-up mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight txt-1">Settings</h1>
        <p className="mt-1 text-sm txt-2">Everything is stored locally in your browser — no account, no server.</p>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-bold txt-1">Appearance</h2>
        <div className="flex gap-2">
          {[
            { id: 'dark', icon: Moon, label: 'Dark' },
            { id: 'light', icon: Sun, label: 'Light' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn('btn flex-1 border', theme === t.id ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-zinc-300 txt-2 dark:border-zinc-700')}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-bold txt-1">Your data</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportProgress} className="btn-outline"><Download size={14} /> Export progress (JSON)</button>
          <button onClick={() => setConfirmReset(true)} className="btn border border-rose-500/40 text-rose-500 hover:bg-rose-500/10">
            <Trash2 size={14} /> Reset all progress
          </button>
        </div>
        <p className="mt-3 text-xs txt-3">Progress lives in <code className="inline-code">localStorage</code>. Export before clearing browser data.</p>
      </div>

      <div className="card p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-bold txt-1"><Info size={14} className="text-brand-500 dark:text-brand-300" /> Build phases</h2>
        <p className="mb-3 text-xs txt-3">AI Mastery ships incrementally. Here's the full plan:</p>
        <div className="space-y-2">
          {PHASES.map(([phase, desc, status]) => (
            <div key={phase} className="flex items-start gap-3 text-xs">
              <span className={cn('mt-0.5 shrink-0', status === 'live' ? 'chip-green' : status === 'next' ? 'chip-brand' : 'chip-zinc')}>
                {phase}{status === 'live' ? ' ✓' : ''}
              </span>
              <span className="pt-0.5 leading-relaxed txt-2">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all progress?"
        footer={
          <>
            <button onClick={() => setConfirmReset(false)} className="btn-ghost">Cancel</button>
            <button
              onClick={() => { resetAll(); setConfirmReset(false) }}
              className="btn bg-rose-600 text-white hover:bg-rose-500"
            >
              Yes, wipe everything
            </button>
          </>
        }
      >
        This permanently deletes your XP, streak, lesson progress, flashcard schedule, and achievements on this device. Consider exporting first.
      </Modal>
    </div>
  )
}
