import { Menu, Search, Flame, Zap, Sun, Moon } from 'lucide-react'
import { useStore } from '../../store/store'
import { useUI } from '../../store/ui'
import { levelInfo } from '../../lib/levels'
import { fmtNumber, todayKey } from '../../lib/utils'

export default function TopBar() {
  const xp = useStore((s) => s.xp)
  const streak = useStore((s) => s.streak)
  const theme = useStore((s) => s.settings.theme)
  const setTheme = useStore((s) => s.setTheme)
  const setPalette = useUI((s) => s.setPalette)
  const setMobileNav = useUI((s) => s.setMobileNav)
  const info = levelInfo(xp)
  const activeToday = streak.lastActive === todayKey()

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/70 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <button className="btn-ghost -ml-2 p-2 lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>

        <button
          onClick={() => setPalette(true)}
          className="flex flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100/70 px-3 py-2 text-sm txt-3 transition-colors hover:border-brand-400/50 dark:border-zinc-800 dark:bg-zinc-900/70 sm:max-w-xs"
        >
          <Search size={15} />
          <span className="flex-1 text-left">Search lessons, terms…</span>
          <span className="kbd hidden sm:inline">Ctrl K</span>
        </button>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div
            className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-2.5 py-1.5"
            title={activeToday ? `${streak.current}-day streak — you showed up today!` : 'Do a lesson or review to keep your streak alive'}
          >
            <Flame size={16} className={activeToday ? 'animate-flame text-amber-500' : 'text-zinc-400'} fill={activeToday ? 'currentColor' : 'none'} />
            <span className="text-sm font-bold txt-1">{streak.current}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-brand-500/10 px-2.5 py-1.5" title={`Level ${info.level}: ${info.title}`}>
            <Zap size={15} className="text-brand-500 dark:text-brand-300" fill="currentColor" />
            <span className="text-sm font-bold txt-1">{fmtNumber(xp)}</span>
            <span className="hidden text-[11px] txt-3 sm:inline">XP</span>
          </div>

          <button
            className="btn-ghost p-2"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  )
}
