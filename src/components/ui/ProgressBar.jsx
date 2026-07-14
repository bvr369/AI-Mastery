import { cn } from '../../lib/utils'

export default function ProgressBar({ value = 0, className, barClassName }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800', className)}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-500', barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
