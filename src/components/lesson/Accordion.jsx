import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import RichText from '../ui/RichText'
import { cn } from '../../lib/utils'

/** Expandable list used for interview questions, mistakes, use cases. */
export default function Accordion({ items }) {
  const [open, setOpen] = useState(() => new Set())
  const toggle = (i) =>
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isOpen = open.has(i)
        return (
          <div key={i} className="card overflow-hidden">
            <button onClick={() => toggle(i)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
              <span className="flex-1 text-sm font-medium txt-1">
                <RichText text={item.title} />
              </span>
              <ChevronDown size={16} className={cn('shrink-0 txt-3 transition-transform duration-200', isOpen && 'rotate-180')} />
            </button>
            {isOpen && (
              <div className="animate-fade-up border-t border-zinc-200 px-4 py-3 text-sm leading-relaxed txt-2 dark:border-zinc-800">
                <RichText text={item.body} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
