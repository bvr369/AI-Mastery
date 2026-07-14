import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useStore } from './store'

// Saved prompts + run history for the Prompt Playground. Its own persist key
// so "reset progress" leaves the user's prompt library intact.

const uid = () => `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`

export const usePlayground = create(
  persist(
    (set, get) => ({
      saved: {},     // { id: { id, name, system, user, temperature, topP, maxTokens, createdAt } }
      history: [],   // recent runs (capped), newest first

      savePrompt: ({ name, system, user, temperature, topP, maxTokens }) => {
        const id = uid()
        set((s) => ({
          saved: { ...s.saved, [id]: { id, name: name || 'Untitled prompt', system, user, temperature, topP, maxTokens, createdAt: new Date().toISOString() } },
        }))
        useStore.getState().bumpCounter('promptsSaved')
        return id
      },

      deletePrompt: (id) =>
        set((s) => {
          const next = { ...s.saved }
          delete next[id]
          return { saved: next }
        }),

      pushHistory: (entry) =>
        set((s) => ({
          history: [{ id: uid(), at: new Date().toISOString(), ...entry }, ...s.history].slice(0, 25),
        })),

      clearHistory: () => set({ history: [] }),
    }),
    { name: 'ai-mastery-playground-v1', version: 1 }
  )
)

export const selectSavedPrompts = (saved) =>
  Object.values(saved).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

// Starter templates — static, always available.
export const TEMPLATES = [
  {
    name: 'Zero-shot classifier',
    system: 'You are a precise text classifier. Respond with exactly one word: positive, negative, or neutral. No explanation.',
    user: 'Classify the sentiment: "The delivery was late but the product is fantastic and support was kind."',
    temperature: 0, topP: 1, maxTokens: 20,
  },
  {
    name: 'JSON extractor',
    system: 'Extract structured data. Respond ONLY with JSON, no prose, no code fences.',
    user: 'Extract name, email, intent, priority (1-5) from: "Hi, Aisha Kumar here (aisha@example.com), my order is broken, need a refund ASAP!!"',
    temperature: 0, topP: 1, maxTokens: 200,
  },
  {
    name: 'Role + tone persona',
    system: 'You are a blunt senior engineer pairing with a junior. Diagnose most-likely-cause first. No pleasantries. Use precise technical terms.',
    user: 'My React component re-renders infinitely. Where do I look first?',
    temperature: 0.4, topP: 1, maxTokens: 300,
  },
  {
    name: 'Creative brainstorm',
    system: 'You are an imaginative brand strategist. Offer surprising, memorable ideas.',
    user: 'Suggest names for a startup that makes AI tools for gardeners.',
    temperature: 1, topP: 0.9, maxTokens: 200,
  },
  {
    name: 'Chain-of-thought',
    system: 'Think step by step before giving a final answer. Show your reasoning, then a line starting with "Answer:".',
    user: 'A shirt costs $40 after a 20% discount. What was the original price?',
    temperature: 0.2, topP: 1, maxTokens: 300,
  },
  {
    name: 'Empty canvas',
    system: 'You are a helpful assistant.',
    user: 'Explain what a context window is, using an analogy.',
    temperature: 0.7, topP: 1, maxTokens: 300,
  },
]
