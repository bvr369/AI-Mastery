# 🧠 AI Mastery

A personalized, interactive learning platform that takes you from **React developer → AI Engineer**. Built like a hybrid of Coursera, roadmap.sh, Duolingo, and LeetCode — but tailored to one learner: you.

## Run it

```bash
npm install
npm run dev      # → http://localhost:5173
```

No backend, no account, no API keys. All progress persists in `localStorage`.

## What's live (Phases 1–2)

- **App shell** — sidebar, topbar, dark/light theme, global search (`Ctrl+K`)
- **Dashboard** — level ring, XP, daily streak, stats, GitHub-style activity heatmap, module progress, achievements
- **Roadmap** — all 12 modules / 96 lessons with phase-gated availability
- **Lesson engine** — every lesson ships: explanation → animated diagram → interactive demo → runnable code playground → quiz (70% gates completion) → flashcards → summary, common mistakes, interview questions, real-world use cases, mini project, challenge, further reading
- **17 lessons fully authored** — all of **Module 1** (Foundations, 8 lessons) and **Module 2** (Working with LLM APIs, 9 lessons), with 14 animated SVG diagrams and 14 bespoke interactive demos
- **Code playground** — a sandboxed (`iframe` + `postMessage`) JS runtime embedded in lessons, with a simulated `llm()` / `llm.stream()` API and mocked `fetch` for `api.anthropic.com` + `api.openai.com` — runnable AI code with **no API key**, plus console capture, timeout guard, and failure injection for the retry lessons
- **Notes system** — markdown notes attached to lessons or free-standing, with a lesson-side drawer, a searchable `/notes` page, pin/delete, and `.md` export (stored separately so "reset progress" never wipes notes)
- **Gamification** — XP with dedupe registry, 20 levels, 18 achievements (incl. module-completion, playground, and notes), streaks, toasts
- **Spaced repetition** — SM-2-lite scheduler; graded flashcards resurface on the Review page
- **Glossary** — 46 terms with in-lesson hover tooltips (`[[Term]]` syntax)
- **Settings** — theme, JSON progress export, full reset, phase roadmap

## Architecture

```
src/
├── main.jsx / App.jsx        # entry, routing, theme sync
├── index.css                 # design tokens as semantic classes (.card, .btn-*, .txt-*)
├── lib/                      # pure helpers: dates, levels/XP curve, formatting
├── store/
│   ├── store.js              # Zustand + persist: XP, streaks, lessons, SRS cards,
│   │                         #   achievements, dedupe-guarded awards
│   ├── ui.js                 # ephemeral: toasts, command palette, mobile nav
│   └── notes.js              # separate persisted store for markdown notes
├── data/
│   ├── curriculum.js         # 12 modules / 96 lessons metadata (single source of truth)
│   ├── glossary.js           # terms behind [[Term]] tooltips
│   ├── achievements.js       # defs with check(state) predicates
│   └── lessons/              # one file per authored lesson + registry (index.js)
├── components/
│   ├── layout/               # AppLayout, Sidebar, TopBar
│   ├── ui/                   # LevelRing, ProgressBar, Modal, Toasts, RichText, CommandPalette
│   ├── dashboard/            # Heatmap
│   └── lesson/
│       ├── LessonRenderer    # block-type → component switch
│       ├── Quiz / Flashcards / CodeBlock / Accordion
│       ├── CodePlayground    # sandboxed iframe runtime + mock llm() API
│       ├── NotesDrawer       # per-lesson notes panel
│       ├── diagrams/         # 14 animated SVG (SMIL) diagrams
│       ├── demos/            # 14 interactive demos
│       └── registry.js       # data-id → component maps
└── pages/                    # Dashboard, Roadmap, Lesson, Glossary, Review, Settings, ComingSoon
```

**Key design decisions**

- **Content is data.** Lessons are serializable block arrays (`p`, `code`, `quiz`, `diagram`, `demo`, …) rendered by `LessonRenderer`. Interactive pieces are referenced by id via `registry.js`, so lesson files stay pure data — searchable, diffable, and later AI-generatable.
- **XP can never double-award.** Every grant goes through `awardOnce(key, …)` backed by a persisted dedupe registry.
- **Dual-theme via semantic classes.** Components use `.card` / `.txt-1..3` / `.btn-*` from `index.css` instead of repeating `dark:` variants everywhere.
- **Zero chart/animation libraries.** Diagrams are hand-built SVG + SMIL; the heatmap is a validated single-hue sequential ramp.

### Adding a lesson (the Phase-2+ loop)

1. Create `src/data/lessons/<id>.js` exporting `{ sections: [...] }`
2. Register it in `src/data/lessons/index.js`
3. Flip `live: true` on its entry in `curriculum.js`
4. New diagrams/demos: add the component, map its id in `components/lesson/registry.js`

## Build phases

| Phase | Delivers |
|---|---|
| **1 ✅** | Core app, dashboard, gamification, lesson engine, Module 1 start |
| **2 ✅** | Full Module 1 (8 lessons) + Module 2 (9 lessons, LLM APIs) + in-lesson code playground + notes system |
| 3 | Standalone Prompt Playground (compare models, save prompts) + Module 3 + prompt-injection simulator |
| 4 | Python bridge + Inside the Transformer + attention/embedding/beam-search simulators |
| 5 | Embeddings + RAG modules + vector-search & RAG simulators + Projects hub (first 15) |
| 6 | Agents + multi-agent modules + Agent Visualizer + injection/tool-calling sims + 15 projects |
| 7 | Evals, fine-tuning, production modules + interview prep hub + 50+ projects total |
| 8 | AI Mentor, deep analytics, knowledge graph, mock interviews, PWA polish |
