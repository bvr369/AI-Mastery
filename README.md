# 🧠 AI Mastery

A personalized, interactive learning platform that takes you from **React developer → AI Engineer**. Built like a hybrid of Coursera, roadmap.sh, Duolingo, and LeetCode — but tailored to one learner: you.

## Run it

```bash
npm install
npm run dev      # → http://localhost:5173
```

No backend, no account, no API keys. All progress persists in `localStorage`.

## What's live (Phases 1–5)

- **App shell** — sidebar, topbar, dark/light theme, global search (`Ctrl+K`)
- **Dashboard** — level ring, XP, daily streak, stats, GitHub-style activity heatmap, module progress, achievements
- **Roadmap** — all 12 modules / 96 lessons with phase-gated availability
- **Lesson engine** — every lesson ships: explanation → animated diagram → interactive demo → runnable code playground → quiz (70% gates completion) → flashcards → summary, common mistakes, interview questions, real-world use cases, mini project, challenge, further reading
- **55 lessons fully authored** — Modules 1–3 (Foundations, LLM APIs, Prompt Engineering), **Module 4** (Python for JS devs, 7), **Module 5** (Inside the Transformer, 8), **Module 6** (Embeddings & Semantic Search, 7), **Module 7** (RAG, 8), with 42 animated SVG diagrams and 42 bespoke interactive demos
- **Marquee simulators** — a **2D embeddings map** (real-cosine neighbors + analogy arithmetic), an **attention visualizer** (softmax attention across heads), a **BPE tokenizer builder**, a **sampling-strategy race**, a **vector-search visualizer** (query → nearest chunks by real cosine), a **chunking lab** (live size/overlap → retrieval impact), a **RAG pipeline step-through** (query→embed→retrieve→augment→generate with citations), and a **retrieval-eval** tuner (precision/recall)
- **Projects Hub** (`/projects`) — 12 portfolio-grade guided builds (streaming chatbot → chat-with-docs RAG → mini SaaS), each with architecture, milestones, folder structure, and production-focus sections; filterable by level/tag; per-project Saved/Building/Completed tracking
- **Prompt Playground** (`/playground`) — a standalone prompt lab on a shared simulated model: system + user editors, live temperature/top_p/max_tokens sliders, **side-by-side multi-model comparison** with streaming + per-panel TTFT/cost, saved-prompt library, run history, starter templates, and a "copy as curl" button for the real API
- **Prompt-injection sandbox** — attack a secret-guarding bot (watch it leak), then toggle defenses and watch attacks bounce; teaches that only a code-level gate is a true guarantee
- **Code playground** — a sandboxed (`iframe` + `postMessage`) JS runtime embedded in lessons, with a simulated `llm()` / `llm.stream()` API and mocked `fetch` for `api.anthropic.com` + `api.openai.com` — runnable AI code with **no API key**, plus console capture, timeout guard, and failure injection for the retry lessons
- **Notes system** — markdown notes attached to lessons or free-standing, with a lesson-side drawer, a searchable `/notes` page, pin/delete, and `.md` export (stored separately so "reset progress" never wipes notes)
- **Spaced repetition** — SM-2-lite scheduler; graded flashcards resurface on the Review page
- **Gamification** — XP with dedupe registry, 20 levels, 25 achievements (module completions, playground, notes, red-teamer, simulator savant, builder/shipped), streaks, toasts
- **Glossary** — 80 terms with in-lesson hover tooltips (`[[Term]]` syntax)
- **Settings** — theme, JSON progress export, full reset, phase roadmap

## Architecture

```
src/
├── main.jsx / App.jsx        # entry, routing, theme sync
├── index.css                 # design tokens as semantic classes (.card, .btn-*, .txt-*)
├── lib/                      # pure helpers: dates, levels/XP curve, formatting
│   └── mockModel.js          # browser-importable simulated LLM (powers the Playground)
├── store/
│   ├── store.js              # Zustand + persist: XP, streaks, lessons, SRS cards,
│   │                         #   achievements, dedupe-guarded awards
│   ├── ui.js                 # ephemeral: toasts, command palette, mobile nav
│   ├── notes.js              # separate persisted store for markdown notes
│   └── playground.js         # saved prompts + run history for the Prompt Playground
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
│       ├── demos/            # 42 interactive demos (incl. embeddings/attention/BPE/sampling/vector-search/RAG sims)
│       └── registry.js       # data-id → component maps
└── pages/                    # Dashboard, Roadmap, Lesson, Glossary, Notes, Review, Playground, Projects, Settings, ComingSoon
```

`data/projects.js` is the Projects Hub catalog (blueprint-style guided builds); `store/projects.js` tracks per-project Saved/Building/Completed status.

`lib/mockModel.js` is the browser-importable simulated model powering the Prompt Playground (tiered "models", real softmax/temperature, streaming); the in-lesson `CodePlayground` has its own copy embedded in a sandboxed iframe.

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
| **3 ✅** | Standalone Prompt Playground (model comparison, save prompts, templates) + Module 3 (8 lessons) + prompt-injection sandbox |
| **4 ✅** | Module 4 (Python for JS devs, 7 lessons) + Module 5 (Inside the Transformer, 8 lessons) + embeddings/attention/BPE/sampling simulators |
| **5 ✅** | Module 6 (Embeddings & Semantic Search, 7 lessons) + Module 7 (RAG, 8 lessons) + vector-search/chunking/RAG-pipeline simulators + Projects Hub (12 builds) |
| 6 | Agents + multi-agent modules + Agent Visualizer + injection/tool-calling sims + more projects |
| 7 | Evals, fine-tuning, production modules + interview prep hub + 50+ projects total |
| 8 | AI Mentor, deep analytics, knowledge graph, mock interviews, PWA polish |
