import { create } from 'zustand'

// Ephemeral UI state — never persisted.
let toastId = 0

export const useUI = create((set, get) => ({
  toasts: [],
  paletteOpen: false,
  mobileNav: false,

  toast: (t) => {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts, { id, ...t }] }))
    const ttl = t.type === 'xp' ? 3200 : 5000
    setTimeout(() => get().dismiss(id), ttl)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setPalette: (open) => set({ paletteOpen: open }),
  setMobileNav: (open) => set({ mobileNav: open }),
}))
