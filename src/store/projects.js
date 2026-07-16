import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useStore } from './store'

/**
 * Tracks which guided projects the user has bookmarked / started / completed.
 * Separate persisted store so "reset progress" (main store) leaves the project
 * library state alone unless the user explicitly wants it gone.
 */

export const useProjects = create(
  persist(
    (set, get) => ({
      status: {}, // { projectId: 'saved' | 'building' | 'done' }

      setStatus: (id, status) => {
        const prev = get().status[id]
        set((s) => ({ status: { ...s.status, [id]: status } }))
        // count first-time "done" transitions for gamification
        if (status === 'done' && prev !== 'done') {
          useStore.getState().bumpCounter('projectsCompleted')
        }
        if (status === 'building' && !prev) {
          useStore.getState().bumpCounter('projectsStarted')
        }
      },

      clearStatus: (id) =>
        set((s) => {
          const next = { ...s.status }
          delete next[id]
          return { status: next }
        }),
    }),
    { name: 'ai-mastery-projects-v1', version: 1 }
  )
)

export const STATUS_LABELS = {
  saved: 'Saved',
  building: 'Building',
  done: 'Completed',
}
