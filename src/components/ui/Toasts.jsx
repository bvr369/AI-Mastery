import { Zap, Trophy, Award, X } from 'lucide-react'
import { useUI } from '../../store/ui'

function Toast({ t, onDismiss }) {
  if (t.type === 'level') {
    return (
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 p-4 text-white shadow-glow">
        <Trophy size={24} className="shrink-0" />
        <div>
          <div className="text-sm font-bold">Level {t.level} reached!</div>
          <div className="text-xs opacity-90">You are now a {t.title}</div>
        </div>
        <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
      </div>
    )
  }
  if (t.type === 'achievement') {
    return (
      <div className="card pointer-events-auto flex items-center gap-3 border-brand-400/40 p-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
          <Award size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">Achievement unlocked</div>
          <div className="text-sm font-bold txt-1">{t.title} <span className="font-medium text-brand-500 dark:text-brand-300">+{t.xp} XP</span></div>
          <div className="truncate text-xs txt-3">{t.desc}</div>
        </div>
        <button onClick={onDismiss} className="ml-1 txt-3 hover:txt-1"><X size={14} /></button>
      </div>
    )
  }
  // default: xp
  return (
    <div className="card pointer-events-auto flex items-center gap-2.5 p-3">
      <Zap size={16} className="shrink-0 text-brand-500 dark:text-brand-300" fill="currentColor" />
      <div className="text-sm">
        <span className="font-bold txt-1">+{t.amount} XP</span>
        {t.reason && <span className="ml-1.5 txt-3">{t.reason}</span>}
      </div>
      <button onClick={onDismiss} className="ml-1 txt-3 hover:txt-1"><X size={13} /></button>
    </div>
  )
}

export default function Toasts() {
  const toasts = useUI((s) => s.toasts)
  const dismiss = useUI((s) => s.dismiss)
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="animate-slide-in">
          <Toast t={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  )
}
