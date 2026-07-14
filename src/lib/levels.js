// XP → level curve and level titles.
// Total course XP is ~13,000, so level 20 ("AI Mastery") lands at course completion.

const TITLES = [
  'Curious Coder',      // 1
  'Prompt Apprentice',  // 2
  'Token Tinkerer',     // 3
  'API Wrangler',       // 4
  'Prompt Engineer',    // 5
  'Context Crafter',    // 6
  'Embedding Explorer', // 7
  'RAG Builder',        // 8
  'Agent Summoner',     // 9
  'Tool Master',        // 10
  'Pipeline Architect', // 11
  'Eval Scientist',     // 12
  'Fine-Tuner',         // 13
  'Latency Slayer',     // 14
  'Production Pilot',   // 15
  'AI Engineer',        // 16
  'Systems Architect',  // 17
  'GenAI Strategist',   // 18
  'Model Whisperer',    // 19
  'AI Mastery',         // 20
]

/** Cumulative XP required to REACH a given level (level 1 = 0 XP). */
export const xpForLevel = (level) => 30 * (level - 1) ** 2 + 70 * (level - 1)

export const MAX_LEVEL = TITLES.length

export const LEVELS = TITLES.map((title, i) => ({
  level: i + 1,
  title,
  xp: xpForLevel(i + 1),
}))

/** Everything the UI needs to render level state from raw XP. */
export const levelInfo = (xp) => {
  let level = 1
  for (const l of LEVELS) if (xp >= l.xp) level = l.level
  const isMax = level >= MAX_LEVEL
  const floor = xpForLevel(level)
  const ceil = isMax ? floor : xpForLevel(level + 1)
  const span = Math.max(1, ceil - floor)
  return {
    level,
    title: TITLES[level - 1],
    nextTitle: isMax ? null : TITLES[level],
    intoLevel: xp - floor,
    span,
    toNext: Math.max(0, ceil - xp),
    progress: isMax ? 100 : Math.round(((xp - floor) / span) * 100),
    isMax,
  }
}
