// Achievement definitions. `check` receives the full progress store state.
// Streak checks use `longest` so achievements never "un-earn" after a broken streak.
import { MODULES } from './curriculum'

const moduleDone = (s, moduleId) => {
  const m = MODULES.find((x) => x.id === moduleId)
  return m.lessons.every((l) => s.lessons[l.id]?.status === 'completed')
}

export const ACHIEVEMENTS = [
  { id: 'first-lesson', title: 'First Steps', desc: 'Complete your first lesson', xp: 25, icon: 'GraduationCap', check: (s) => s.counters.lessonsCompleted >= 1 },
  { id: 'scholar', title: 'Scholar', desc: 'Complete 5 lessons', xp: 50, icon: 'BookOpen', check: (s) => s.counters.lessonsCompleted >= 5 },
  { id: 'sharpshooter', title: 'Sharpshooter', desc: 'Score 100% on a quiz', xp: 25, icon: 'Target', check: (s) => s.counters.perfectQuizzes >= 1 },
  { id: 'perfectionist', title: 'Perfectionist', desc: 'Score 100% on 3 quizzes', xp: 50, icon: 'Star', check: (s) => s.counters.perfectQuizzes >= 3 },
  { id: 'streak-3', title: 'On Fire', desc: 'Reach a 3-day streak', xp: 25, icon: 'Flame', check: (s) => s.streak.longest >= 3 },
  { id: 'streak-7', title: 'Unstoppable', desc: 'Reach a 7-day streak', xp: 75, icon: 'Flame', check: (s) => s.streak.longest >= 7 },
  { id: 'streak-30', title: 'Habit Formed', desc: 'Reach a 30-day streak', xp: 200, icon: 'Trophy', check: (s) => s.streak.longest >= 30 },
  { id: 'hands-on', title: 'Button Pusher', desc: 'Play with 3 interactive demos', xp: 25, icon: 'MousePointerClick', check: (s) => s.counters.demosUsed >= 3 },
  { id: 'card-shark', title: 'Card Shark', desc: 'Review 20 flashcards', xp: 25, icon: 'Layers', check: (s) => s.counters.cardsReviewed >= 20 },
  { id: 'memory-athlete', title: 'Memory Athlete', desc: 'Review 100 flashcards', xp: 75, icon: 'Brain', check: (s) => s.counters.cardsReviewed >= 100 },
  { id: 'xp-500', title: 'Level Grinder', desc: 'Earn 500 XP', xp: 25, icon: 'Zap', check: (s) => s.xp >= 500 },
  { id: 'xp-2500', title: 'XP Machine', desc: 'Earn 2,500 XP', xp: 75, icon: 'Rocket', check: (s) => s.xp >= 2500 },
  { id: 'night-owl', title: 'Night Owl', desc: 'Learn between midnight and 5 AM', xp: 15, icon: 'Moon', check: (s) => !!s.flags.nightOwl },
  { id: 'early-bird', title: 'Early Bird', desc: 'Learn before 8 AM', xp: 15, icon: 'Sunrise', check: (s) => !!s.flags.earlyBird },
  { id: 'foundation-laid', title: 'Foundation Laid', desc: 'Complete all of Module 1', xp: 100, icon: 'Trophy', check: (s) => moduleDone(s, 'm1') },
  { id: 'wired-in', title: 'Wired In', desc: 'Complete all of Module 2 — you can ship AI features now', xp: 150, icon: 'Trophy', check: (s) => moduleDone(s, 'm2') },
  { id: 'note-taker', title: 'Note Taker', desc: 'Write 3 notes', xp: 15, icon: 'StickyNote', check: (s) => (s.counters.notesCreated ?? 0) >= 3 },
  { id: 'code-runner', title: 'Code Runner', desc: 'Run playground code 10 times', xp: 25, icon: 'Terminal', check: (s) => (s.counters.playgroundRuns ?? 0) >= 10 },
  { id: 'prompt-smith', title: 'Prompt Smith', desc: 'Save 3 prompts in the Playground', xp: 20, icon: 'PenTool', check: (s) => (s.counters.promptsSaved ?? 0) >= 3 },
  { id: 'red-teamer', title: 'Red Teamer', desc: 'Defeat the prompt-injection sandbox', xp: 40, icon: 'ShieldAlert', check: (s) => (s.counters.injectionsDefeated ?? 0) >= 1 },
  { id: 'python-bridge', title: 'Bilingual', desc: 'Complete all of Module 4 — Python for JS devs', xp: 120, icon: 'FileCode2', check: (s) => moduleDone(s, 'm4') },
  { id: 'under-the-hood', title: 'Under the Hood', desc: 'Complete all of Module 5 — Inside the Transformer', xp: 150, icon: 'Cpu', check: (s) => moduleDone(s, 'm5') },
  { id: 'demo-master', title: 'Simulator Savant', desc: 'Play with 15 interactive demos', xp: 60, icon: 'FlaskConical', check: (s) => (s.counters.demosUsed ?? 0) >= 15 },
]

export const getAchievement = (id) => ACHIEVEMENTS.find((a) => a.id === id)
