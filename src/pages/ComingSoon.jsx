import { Link } from 'react-router-dom'
import { SlidersHorizontal, Puzzle, MessageSquare, Briefcase, Map } from 'lucide-react'

const FEATURES = {
  playground: {
    icon: SlidersHorizontal, phase: 3, title: 'Standalone Prompt Playground',
    blurb: 'A dedicated prompt lab. Note: runnable code playgrounds with a simulated llm() API are ALREADY live inside every Module 2 lesson — this is the standalone, model-comparison version.',
    bullets: [
      'Side-by-side model + parameter comparison',
      'Prompt history, saving & templates',
      'Bring-your-own-API-key mode',
      'Meanwhile: try the code playgrounds in Module 2 lessons',
    ],
  },
  projects: {
    icon: Puzzle, phase: 5, title: 'Projects Hub',
    blurb: '50+ guided builds — from a streaming chatbot to a full AI SaaS — each with architecture, prompts, deployment and security notes.',
    bullets: [
      'Architecture diagrams & folder structures',
      'Step-by-step build guides with checkpoints',
      'Deployment, scaling & security sections',
      'Portfolio-ready capstones',
    ],
  },
  mentor: {
    icon: MessageSquare, phase: 8, title: 'AI Mentor',
    blurb: 'A tutor that answers questions, explains your quiz mistakes, generates custom challenges, and recommends what to learn next.',
    bullets: [
      'Chat about any lesson',
      'Weakness tracking from quiz history',
      'AI-generated quizzes & challenges',
      'Personalized next-topic recommendations',
    ],
  },
  interview: {
    icon: Briefcase, phase: 7, title: 'Interview Prep',
    blurb: 'AI Engineer interview training: concept questions, system design scenarios, coding tasks, and behavioral prep.',
    bullets: [
      'Question bank by topic & difficulty',
      'AI system design scenarios',
      'Mock interview mode',
      'Salary & role landscape guide',
    ],
  },
}

export default function ComingSoon({ feature }) {
  const f = FEATURES[feature]
  if (!f) return null
  return (
    <div className="card mx-auto mt-8 max-w-lg animate-pop-in overflow-hidden p-0">
      <div className="bg-gradient-to-r from-brand-500/15 to-indigo-500/15 p-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 animate-floaty items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-glow">
          <f.icon size={24} />
        </div>
        <div className="chip-brand mx-auto">Arriving in Phase {f.phase}</div>
        <h1 className="mt-2 text-xl font-bold tracking-tight txt-1">{f.title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed txt-2">{f.blurb}</p>
      </div>
      <div className="p-6">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest txt-3">What's coming</div>
        <ul className="space-y-2">
          {f.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm txt-2"><span className="text-brand-500 dark:text-brand-300">→</span> {b}</li>
          ))}
        </ul>
        <Link to="/roadmap" className="btn-primary mt-5 w-full"><Map size={15} /> Keep learning meanwhile</Link>
      </div>
    </div>
  )
}
