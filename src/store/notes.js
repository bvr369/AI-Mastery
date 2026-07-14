import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useStore } from './store'

/**
 * Notes live in their own persisted store so "Reset progress" never wipes them.
 * Markdown-lite bodies, optionally scoped to a lesson.
 */

const uid = () => `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`

export const useNotes = create(
  persist(
    (set, get) => ({
      notes: {}, // { id: { id, title, body, lessonId, pinned, createdAt, updatedAt } }

      addNote: ({ lessonId = null, title = '', body = '' } = {}) => {
        const id = uid()
        const now = new Date().toISOString()
        set((s) => ({ notes: { ...s.notes, [id]: { id, title, body, lessonId, pinned: false, createdAt: now, updatedAt: now } } }))
        useStore.getState().bumpCounter('notesCreated')
        return id
      },

      updateNote: (id, patch) =>
        set((s) => {
          const cur = s.notes[id]
          if (!cur) return {}
          return { notes: { ...s.notes, [id]: { ...cur, ...patch, updatedAt: new Date().toISOString() } } }
        }),

      removeNote: (id) =>
        set((s) => {
          const next = { ...s.notes }
          delete next[id]
          return { notes: next }
        }),

      togglePin: (id) =>
        set((s) => {
          const cur = s.notes[id]
          if (!cur) return {}
          return { notes: { ...s.notes, [id]: { ...cur, pinned: !cur.pinned } } }
        }),
    }),
    { name: 'ai-mastery-notes-v1', version: 1 }
  )
)

/** Sorted list: pinned first, then most recently updated. */
export const selectSortedNotes = (notes) =>
  Object.values(notes).sort((a, b) => (b.pinned - a.pinned) || b.updatedAt.localeCompare(a.updatedAt))

export const notesForLesson = (notes, lessonId) =>
  selectSortedNotes(notes).filter((n) => n.lessonId === lessonId)

/** Export every note as a single markdown document. */
export const notesToMarkdown = (notes, lessonTitleFor = () => null) =>
  selectSortedNotes(notes)
    .map((n) => {
      const scope = n.lessonId ? ` _(${lessonTitleFor(n.lessonId) ?? n.lessonId})_` : ''
      return `## ${n.title || 'Untitled note'}${scope}\n\n${n.body}\n`
    })
    .join('\n---\n\n')
