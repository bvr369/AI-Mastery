import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pin, Trash2, Download, StickyNote, Eye, Pencil, X } from 'lucide-react'
import { useNotes, selectSortedNotes, notesToMarkdown } from '../store/notes'
import { getLesson } from '../data/curriculum'
import MarkdownView from '../components/ui/MarkdownView'
import { cn } from '../lib/utils'

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function NoteEditor({ note, onClose }) {
  const updateNote = useNotes((s) => s.updateNote)
  const removeNote = useNotes((s) => s.removeNote)
  const [preview, setPreview] = useState(false)

  if (!note) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative flex max-h-[85vh] w-full max-w-2xl animate-pop-in flex-col p-0">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <input
            value={note.title}
            onChange={(e) => updateNote(note.id, { title: e.target.value })}
            placeholder="Note title…"
            className="flex-1 bg-transparent text-base font-semibold txt-1 placeholder-zinc-400 focus:outline-none"
          />
          <button onClick={() => setPreview((p) => !p)} className="btn-ghost px-2.5 py-1.5 text-xs">
            {preview ? <><Pencil size={13} /> Edit</> : <><Eye size={13} /> Preview</>}
          </button>
          <button
            onClick={() => { removeNote(note.id); onClose() }}
            className="btn-ghost px-2 py-1.5 text-rose-500"
            title="Delete note"
          >
            <Trash2 size={14} />
          </button>
          <button onClick={onClose} className="btn-ghost px-2 py-1.5"><X size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {preview ? (
            <MarkdownView text={note.body} />
          ) : (
            <textarea
              value={note.body}
              onChange={(e) => updateNote(note.id, { body: e.target.value })}
              placeholder={'Write in markdown…\n\n# Heading\n- bullet\n**bold** `code`\n```\ncode block\n```'}
              className="h-72 w-full resize-y bg-transparent font-mono text-sm txt-1 placeholder-zinc-500 focus:outline-none"
            />
          )}
        </div>
        {note.lessonId && (
          <div className="border-t border-zinc-200 px-4 py-2 text-xs txt-3 dark:border-zinc-800">
            Attached to: <Link to={`/learn/${note.lessonId}`} className="font-medium text-brand-500 hover:underline dark:text-brand-300">{getLesson(note.lessonId)?.title ?? note.lessonId}</Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Notes() {
  const notes = useNotes((s) => s.notes)
  const addNote = useNotes((s) => s.addNote)
  const togglePin = useNotes((s) => s.togglePin)
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState(null)

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    return selectSortedNotes(notes).filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
  }, [notes, query])

  const exportAll = () => {
    const md = notesToMarkdown(notes, (id) => getLesson(id)?.title)
    const blob = new Blob([`# AI Mastery — My Notes\n\n${md}`], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-mastery-notes.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const editing = editingId ? notes[editingId] : null

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight txt-1">Notes</h1>
          <p className="mt-1 text-sm txt-2">Your second brain — markdown supported, attached to lessons or free-standing.</p>
        </div>
        <div className="flex gap-2">
          {Object.keys(notes).length > 0 && (
            <button onClick={exportAll} className="btn-outline"><Download size={14} /> Export .md</button>
          )}
          <button onClick={() => setEditingId(addNote())} className="btn-primary"><Plus size={15} /> New note</button>
        </div>
      </div>

      {Object.keys(notes).length > 3 && (
        <div className="relative mb-5 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 txt-3" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes…" className="input pl-9" />
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="card mx-auto max-w-md p-10 text-center">
          <StickyNote size={28} className="mx-auto mb-3 txt-3" />
          <div className="text-base font-bold txt-1">{query ? 'No matches' : 'No notes yet'}</div>
          <p className="mt-1 text-sm txt-2">
            {query ? `Nothing contains “${query}”.` : 'Capture ideas while you learn — every lesson page has a notes drawer, or start one here.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((n) => (
            <div key={n.id} className={cn('card card-hover flex cursor-pointer flex-col p-4', n.pinned && 'border-amber-400/50')} onClick={() => setEditingId(n.id)}>
              <div className="mb-1.5 flex items-start gap-2">
                <span className="flex-1 truncate text-sm font-bold txt-1">{n.title || 'Untitled note'}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); togglePin(n.id) }}
                  className={cn('shrink-0 rounded p-1', n.pinned ? 'text-amber-500' : 'txt-3 opacity-40 hover:opacity-100')}
                  title={n.pinned ? 'Unpin' : 'Pin'}
                >
                  <Pin size={13} fill={n.pinned ? 'currentColor' : 'none'} />
                </button>
              </div>
              <p className="line-clamp-4 flex-1 whitespace-pre-wrap text-xs leading-relaxed txt-2">{n.body || 'Empty…'}</p>
              <div className="mt-3 flex items-center justify-between text-[10px] txt-3">
                <span>{timeAgo(n.updatedAt)}</span>
                {n.lessonId && <span className="chip-brand max-w-[60%] truncate">{getLesson(n.lessonId)?.title ?? 'lesson'}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <NoteEditor note={editing} onClose={() => setEditingId(null)} />}
    </div>
  )
}
