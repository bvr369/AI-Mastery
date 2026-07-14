import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StickyNote, Plus, X, Trash2, ArrowUpRight } from 'lucide-react'
import { useNotes, notesForLesson } from '../../store/notes'
import { cn } from '../../lib/utils'

/**
 * Slide-in notes panel scoped to the current lesson.
 * Quick capture: title + autosaving markdown textarea per note.
 */
export default function NotesDrawer({ lessonId, lessonTitle }) {
  const [open, setOpen] = useState(false)
  const notes = useNotes((s) => s.notes)
  const addNote = useNotes((s) => s.addNote)
  const updateNote = useNotes((s) => s.updateNote)
  const removeNote = useNotes((s) => s.removeNote)

  const lessonNotes = notesForLesson(notes, lessonId)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-outline"
        title="Notes for this lesson"
      >
        <StickyNote size={14} />
        Notes{lessonNotes.length > 0 && <span className="chip-brand">{lessonNotes.length}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in flex-col border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <StickyNote size={15} className="text-brand-500 dark:text-brand-300" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold txt-1">Lesson notes</div>
                <div className="truncate text-[11px] txt-3">{lessonTitle}</div>
              </div>
              <Link to="/notes" className="btn-ghost px-2 py-1.5 text-xs" title="All notes">
                All notes <ArrowUpRight size={12} />
              </Link>
              <button onClick={() => setOpen(false)} className="btn-ghost px-2 py-1.5"><X size={15} /></button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {lessonNotes.length === 0 && (
                <p className="pt-8 text-center text-sm txt-3">
                  Nothing yet. Notes you take here stay attached to this lesson — perfect for "aha" moments and quiz mistakes.
                </p>
              )}
              {lessonNotes.map((n) => (
                <div key={n.id} className="card p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <input
                      value={n.title}
                      onChange={(e) => updateNote(n.id, { title: e.target.value })}
                      placeholder="Title…"
                      className="flex-1 bg-transparent text-sm font-semibold txt-1 placeholder-zinc-400 focus:outline-none"
                    />
                    <button onClick={() => removeNote(n.id)} className="txt-3 hover:text-rose-500" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <textarea
                    value={n.body}
                    onChange={(e) => updateNote(n.id, { body: e.target.value })}
                    placeholder="Markdown supported…"
                    rows={Math.min(10, Math.max(3, n.body.split('\n').length + 1))}
                    className="w-full resize-none bg-transparent font-mono text-xs leading-relaxed txt-2 placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
              <button onClick={() => addNote({ lessonId })} className={cn('btn-primary w-full')}>
                <Plus size={15} /> New note for this lesson
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
