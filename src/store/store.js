import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { todayKey, yesterdayKey, dateKey, addDays } from '../lib/utils'
import { levelInfo } from '../lib/levels'
import { ACHIEVEMENTS } from '../data/achievements'
import { useUI } from './ui'

const initialState = {
  xp: 0,
  streak: { current: 0, longest: 0, lastActive: null },
  activity: {},            // { 'YYYY-MM-DD': xpEarnedThatDay }
  lessons: {},             // { lessonId: { status, quizBest, sections: {}, completedAt } }
  cards: {},               // { cardId: { reps, ease, interval, due, lessonId } }  (SM-2-lite)
  awarded: {},             // dedupe registry so XP is never double-granted
  achievements: [],        // earned achievement ids
  counters: { lessonsCompleted: 0, perfectQuizzes: 0, cardsReviewed: 0, demosUsed: 0, playgroundRuns: 0, notesCreated: 0, promptsSaved: 0, injectionsDefeated: 0, projectsStarted: 0, projectsCompleted: 0 },
  flags: {},               // one-off facts for achievements (nightOwl, earlyBird)
  settings: { theme: 'dark' },
}

const toast = (t) => useUI.getState().toast(t)

export const useStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      /* ---------- internal: raw XP grant (streak/level/toast handling) ---------- */
      _gain: (amount, reason, opts = {}) => {
        if (amount <= 0) return
        const before = levelInfo(get().xp).level
        const day = todayKey()
        set((s) => ({
          xp: s.xp + amount,
          activity: { ...s.activity, [day]: (s.activity[day] || 0) + amount },
        }))
        if (!opts.silent && reason) toast({ type: 'xp', amount, reason })
        const after = levelInfo(get().xp)
        if (after.level > before) toast({ type: 'level', level: after.level, title: after.title })
      },

      /* ---------- streak: called before any XP-earning activity ---------- */
      touch: () => {
        const s = get()
        const today = todayKey()
        const hour = new Date().getHours()
        const flags = { ...s.flags }
        if (hour < 5) flags.nightOwl = true
        else if (hour < 8) flags.earlyBird = true

        if (s.streak.lastActive !== today) {
          const current = s.streak.lastActive === yesterdayKey() ? s.streak.current + 1 : 1
          set({
            streak: { current, longest: Math.max(current, s.streak.longest), lastActive: today },
            flags,
          })
          get()._gain(10, 'Daily check-in')
        } else if (flags.nightOwl !== s.flags.nightOwl || flags.earlyBird !== s.flags.earlyBird) {
          set({ flags })
        }
        get().evaluateAchievements()
      },

      /* ---------- dedupe-guarded XP: safe to call repeatedly ---------- */
      awardOnce: (key, amount, reason, opts) => {
        if (get().awarded[key]) return false
        get().touch()
        set((s) => ({ awarded: { ...s.awarded, [key]: true } }))
        get()._gain(amount, reason, opts)
        return true
      },

      /* ---------- lessons ---------- */
      startLesson: (lessonId) =>
        set((s) => {
          const cur = s.lessons[lessonId]
          if (cur?.status === 'completed' || cur?.status === 'in-progress') return {}
          return { lessons: { ...s.lessons, [lessonId]: { status: 'in-progress', quizBest: cur?.quizBest ?? 0, sections: cur?.sections ?? {} } } }
        }),

      markSection: (lessonId, sectionId) =>
        set((s) => {
          const cur = s.lessons[lessonId] ?? { status: 'in-progress', quizBest: 0, sections: {} }
          if (cur.sections[sectionId]) return {}
          return { lessons: { ...s.lessons, [lessonId]: { ...cur, sections: { ...cur.sections, [sectionId]: true } } } }
        }),

      recordQuiz: (lessonId, scorePct) => {
        get().touch()
        set((s) => {
          const cur = s.lessons[lessonId] ?? { status: 'in-progress', quizBest: 0, sections: {} }
          return { lessons: { ...s.lessons, [lessonId]: { ...cur, quizBest: Math.max(cur.quizBest ?? 0, scorePct) } } }
        })
        if (scorePct >= 70) get().awardOnce(`quiz:${lessonId}`, 40, 'Quiz passed')
        if (scorePct === 100 && get().awardOnce(`quiz100:${lessonId}`, 20, 'Perfect quiz!')) {
          set((s) => ({ counters: { ...s.counters, perfectQuizzes: s.counters.perfectQuizzes + 1 } }))
        }
        get().evaluateAchievements()
      },

      completeLesson: (lesson) => {
        const cur = get().lessons[lesson.id]
        if (!cur || (cur.quizBest ?? 0) < 70 || cur.status === 'completed') return false
        set((s) => ({
          lessons: { ...s.lessons, [lesson.id]: { ...cur, status: 'completed', completedAt: new Date().toISOString() } },
          counters: { ...s.counters, lessonsCompleted: s.counters.lessonsCompleted + 1 },
        }))
        get().awardOnce(`lesson:${lesson.id}`, lesson.xp, `Lesson complete: ${lesson.title}`)
        get().evaluateAchievements()
        return true
      },

      /* ---------- interactive demos: small one-time hands-on bonus ---------- */
      useDemo: (lessonId, demoId) => {
        if (get().awardOnce(`demo:${lessonId}:${demoId}`, 10, 'Hands-on bonus')) {
          set((s) => ({ counters: { ...s.counters, demosUsed: s.counters.demosUsed + 1 } }))
          get().evaluateAchievements()
        }
      },

      /* ---------- flashcards: simplified SM-2 spaced repetition ---------- */
      reviewCard: (cardId, lessonId, grade) => {
        get().touch()
        const prev = get().cards[cardId] ?? { reps: 0, ease: 2.5, interval: 0, lessonId }
        let { reps, ease, interval } = prev
        if (grade === 'again') {
          reps = 0
          ease = Math.max(1.3, ease - 0.2)
          interval = 0
        } else if (grade === 'good') {
          reps += 1
          interval = interval === 0 ? 1 : Math.round(interval * ease)
        } else {
          reps += 1
          ease = ease + 0.1
          interval = interval === 0 ? 3 : Math.round(interval * ease * 1.3)
        }
        const due = interval === 0 ? todayKey() : dateKey(addDays(new Date(), interval))
        set((s) => ({
          cards: { ...s.cards, [cardId]: { reps, ease, interval, due, lessonId } },
          counters: { ...s.counters, cardsReviewed: s.counters.cardsReviewed + 1 },
        }))
        get()._gain(2, null, { silent: true })
        get().evaluateAchievements()
      },

      /* ---------- achievements ---------- */
      evaluateAchievements: () => {
        const s = get()
        for (const a of ACHIEVEMENTS) {
          if (s.achievements.includes(a.id)) continue
          if (a.check(s)) {
            set((st) => ({ achievements: [...st.achievements, a.id] }))
            set((st) => ({ awarded: { ...st.awarded, [`ach:${a.id}`]: true } }))
            get()._gain(a.xp, null, { silent: true })
            toast({ type: 'achievement', title: a.title, desc: a.desc, icon: a.icon, xp: a.xp })
          }
        }
      },

      /* ---------- generic counter (playground runs, notes, …) ---------- */
      bumpCounter: (key, by = 1) => {
        set((s) => ({ counters: { ...s.counters, [key]: (s.counters[key] ?? 0) + by } }))
        get().evaluateAchievements()
      },

      /* ---------- settings / lifecycle ---------- */
      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      resetAll: () => set({ ...initialState, settings: get().settings }),
    }),
    {
      name: 'ai-mastery-v1',
      version: 2,
      // fill counters added after a user's first save so `?? 0` math never sees NaN
      migrate: (persisted) => ({
        ...persisted,
        counters: { ...initialState.counters, ...(persisted?.counters ?? {}) },
      }),
    }
  )
)

/* ---------- derived selectors (plain functions over state) ---------- */

export const selectDueCards = (s) => {
  const today = todayKey()
  return Object.entries(s.cards)
    .filter(([, c]) => c.due <= today)
    .map(([id, c]) => ({ id, ...c }))
}

export const lessonStatus = (s, lessonId) => s.lessons[lessonId]?.status ?? 'not-started'
