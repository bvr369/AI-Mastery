import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Map, RefreshCw, BookOpen, Puzzle, SlidersHorizontal,
  MessageSquare, Briefcase, Settings, Sparkles, StickyNote, X,
} from 'lucide-react'
import { useStore, selectDueCards } from '../../store/store'
import { useUI } from '../../store/ui'
import { levelInfo } from '../../lib/levels'
import LevelRing from '../ui/LevelRing'
import { cn } from '../../lib/utils'

const SECTIONS = [
  {
    label: 'Learn',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/roadmap', icon: Map, label: 'Roadmap' },
      { to: '/review', icon: RefreshCw, label: 'Review', badge: 'due' },
      { to: '/notes', icon: StickyNote, label: 'Notes' },
      { to: '/glossary', icon: BookOpen, label: 'Glossary' },
    ],
  },
  {
    label: 'Build',
    items: [
      { to: '/playground', icon: SlidersHorizontal, label: 'Playground' },
      { to: '/projects', icon: Puzzle, label: 'Projects', soon: 5 },
    ],
  },
  {
    label: 'Grow',
    items: [
      { to: '/interview', icon: Briefcase, label: 'Interview Prep', soon: 7 },
      { to: '/mentor', icon: MessageSquare, label: 'AI Mentor', soon: 8 },
    ],
  },
]

function NavContent() {
  const xp = useStore((s) => s.xp)
  const dueCount = useStore((s) => selectDueCards(s).length)
  const setMobileNav = useUI((s) => s.setMobileNav)
  const info = levelInfo(xp)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 shadow-glow">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <div className="text-[15px] font-bold tracking-tight txt-1">AI Mastery</div>
          <div className="text-[10px] font-medium uppercase tracking-widest txt-3">Dev → AI Engineer</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {SECTIONS.map((sec) => (
          <div key={sec.label}>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest txt-3">{sec.label}</div>
            <div className="space-y-0.5">
              {sec.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileNav(false)}
                  className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active')}
                >
                  <item.icon size={17} strokeWidth={2} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge === 'due' && dueCount > 0 && (
                    <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{dueCount}</span>
                  )}
                  {item.soon && <span className="chip-zinc">P{item.soon}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <div className="card flex items-center gap-3 p-3">
          <LevelRing size={44} stroke={4} progress={info.progress}>
            <span className="text-xs font-bold txt-1">{info.level}</span>
          </LevelRing>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold txt-1">{info.title}</div>
            <div className="text-[10px] txt-3">
              {info.isMax ? 'Max level!' : `${info.toNext} XP to ${info.nextTitle}`}
            </div>
          </div>
        </div>
        <NavLink
          to="/settings"
          onClick={() => setMobileNav(false)}
          className={({ isActive }) => cn('nav-item mt-2', isActive && 'nav-item-active')}
        >
          <Settings size={17} />
          <span>Settings</span>
        </NavLink>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const mobileNav = useUI((s) => s.mobileNav)
  const setMobileNav = useUI((s) => s.setMobileNav)

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 lg:block">
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileNav && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-slide-in bg-white dark:bg-zinc-950">
            <button
              onClick={() => setMobileNav(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 txt-3 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
