import { dateKey, addDays } from '../../lib/utils'

/**
 * GitHub-style activity heatmap (last ~17 weeks).
 * Sequential single-hue ramp, monotonic in both themes; exact values on hover.
 */

const LEVEL_CLS = [
  'bg-zinc-200/80 dark:bg-zinc-800/70',              // 0 XP
  'bg-brand-300 dark:bg-brand-900',                  // 1–24
  'bg-brand-400 dark:bg-brand-700',                  // 25–59
  'bg-brand-500 dark:bg-brand-500',                  // 60–119
  'bg-brand-600 dark:bg-brand-400',                  // 120+
]

const levelFor = (xp) => (xp >= 120 ? 4 : xp >= 60 ? 3 : xp >= 25 ? 2 : xp >= 1 ? 1 : 0)

export default function Heatmap({ activity }) {
  const today = new Date()
  const firstDay = addDays(today, -118)
  const pad = firstDay.getDay() // align grid to Sunday columns
  const gridStart = addDays(firstDay, -pad)
  const totalCells = pad + 119

  const weeks = []
  for (let w = 0; w < Math.ceil(totalCells / 7); w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(gridStart, w * 7 + d)
      col.push(date > today ? null : date)
    }
    weeks.push(col)
  }

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((col, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {col.map((date, di) => {
              if (!date) return <span key={di} className="h-3 w-3" />
              const key = dateKey(date)
              const xp = activity[key] || 0
              return (
                <span
                  key={di}
                  title={`${key} — ${xp} XP`}
                  className={`h-3 w-3 rounded-[3px] ${LEVEL_CLS[levelFor(xp)]} transition-transform hover:scale-125`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] txt-3">
        <span>Last 4 months — hover a square for exact XP</span>
        <span className="flex items-center gap-1">
          less
          {LEVEL_CLS.map((cls, i) => <i key={i} className={`h-2.5 w-2.5 rounded-[3px] ${cls}`} />)}
          more
        </span>
      </div>
    </div>
  )
}
