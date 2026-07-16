// The Projects Hub catalog — guided, blueprint-style builds mapped to skills the
// course teaches. Each project is a portfolio-grade build guide, not a step-by-step
// tutorial: architecture, milestones, folder structure, and the production areas
// (prompt design, API, deployment, scaling, security) an AI engineer must think about.
//
// Schema per project:
//   id, title, tagline, icon (lucide name), difficulty, hours, tags[], modules[] (curriculum module nums),
//   overview, features[], stack[], architecture, steps[{title,detail}], structure (code string),
//   focus[{area,note}], stretch[], portfolio

export const PROJECTS = [
  {
    id: 'streaming-chatbot',
    title: 'Streaming AI Chatbot',
    tagline: 'A production-shaped chat app with a secret-safe backend and token-by-token streaming.',
    icon: 'MessageSquare',
    difficulty: 'Beginner',
    hours: 6,
    tags: ['Chat', 'Streaming', 'React', 'API'],
    modules: [2],
    overview: "The 'hello world' of AI products — but built the right way. A React chat UI talks to your own backend, which holds the API key and proxies a streaming (SSE) response from the model. You'll internalize the three-tier architecture every AI app uses and ship something you can demo in an interview.",
    features: [
      'Multi-turn conversation with maintained message history',
      'Token-by-token streaming with a typing cursor and Stop button',
      'System-prompt selector (2–3 personas)',
      'Server-side API key — never exposed to the browser',
      'Per-request token/cost logging',
    ],
    stack: ['React (Vite/Next.js)', 'Node/Express or a Next.js route', 'Anthropic or OpenAI SDK', 'SSE streaming'],
    architecture: 'Browser (messages state + streaming renderer, NO secrets) → your server (API key in env, system prompt, SSE proxy, usage log) → provider API. The middle tier is why your key survives contact with real users.',
    steps: [
      { title: 'Backend proxy', detail: 'A POST /api/chat route that takes the messages array, calls the provider with stream:true, and pipes SSE frames back to the client. Key lives in an env var.' },
      { title: 'Streaming client', detail: 'Read res.body with a reader, parse SSE frames (buffer + split on double-newline, keep the tail), and batch token flushes into React state (~50ms) for smooth rendering.' },
      { title: 'Conversation state', detail: 'Maintain the messages array; append both user and assistant turns; add a sliding-window trim so long chats stay in budget.' },
      { title: 'Controls & polish', detail: 'AbortController-powered Stop button, a system-prompt dropdown, and a token/cost line under each response.' },
      { title: 'Deploy', detail: 'Ship to Vercel/Render behind a per-session token cap so a public demo link can’t bankrupt you.' },
    ],
    structure: `chatbot/
├── server/
│   └── chat.js         # SSE proxy, key in env
├── src/
│   ├── Chat.jsx        # messages state + streaming reader
│   └── useStream.js    # SSE parse + batched flush
└── .env                # ANTHROPIC_API_KEY (gitignored)`,
    focus: [
      { area: 'Prompt design', note: 'Put the system prompt server-side; expose only a persona choice to the client.' },
      { area: 'API integration', note: 'Stream with SSE; handle 429/5xx with backoff; log usage per call.' },
      { area: 'Security', note: 'Key server-side only; rate-limit per IP/session; validate the messages payload.' },
      { area: 'Deployment', note: 'Serverless route or a small Node server; set a spend cap for public demos.' },
    ],
    stretch: ['Persist conversations to a database', 'Render markdown + code blocks (throttled)', 'Add the resilient gateway (backoff + circuit breaker) from Lesson 2.8'],
    portfolio: 'The baseline AI product every engineer should have shipped. Shows you understand streaming UX, key security, and the standard architecture.',
  },
  {
    id: 'tldr-summarizer',
    title: 'TL;DR Summarizer',
    tagline: 'Paste an article or transcript, get a structured summary with key points and action items.',
    icon: 'FileText',
    difficulty: 'Beginner',
    hours: 4,
    tags: ['Summarization', 'Structured Output', 'Prompting'],
    modules: [2, 3],
    overview: 'A high-value, low-risk AI feature (summarizing text the user already has means low hallucination risk). You’ll practice prompt engineering and structured output: turn long text into a clean, consistent summary object your UI renders.',
    features: ['Paste or upload text', 'Structured output: summary + key points + action items', 'Length/tone controls', 'Handles long inputs via chunking'],
    stack: ['React', 'LLM API', 'Structured output (JSON) + validation'],
    architecture: 'Client sends text → backend builds a summarization prompt with a strict JSON contract → validates the response (retry on malformed) → returns a typed summary object → UI renders sections.',
    steps: [
      { title: 'Summarize prompt', detail: 'Design a prompt with role, the text as delimited data, and a JSON output contract (summary, key_points[], action_items[]).' },
      { title: 'Validate + retry', detail: 'Parse the JSON, validate against a schema (Zod), and retry once with the error message on failure.' },
      { title: 'Long inputs', detail: 'If the text exceeds a token budget, chunk it, summarize each chunk, then summarize the summaries (map-reduce).' },
      { title: 'Controls', detail: 'Length (short/detailed) and tone as prompt parameters; a copy/export button.' },
    ],
    structure: `summarizer/
├── api/summarize.js    # prompt + JSON contract + validation
├── src/Summary.jsx     # renders sections
└── lib/chunk.js        # map-reduce for long text`,
    focus: [
      { area: 'Prompt design', note: 'Delimit the input as untrusted data; enforce a JSON contract; give one example.' },
      { area: 'Optimization', note: 'Use a cheap/fast model — summarization rarely needs the frontier tier.' },
      { area: 'Production', note: 'Validate every field before rendering; never JSON.parse raw model output unguarded.' },
    ],
    stretch: ['Summarize YouTube transcripts or PDFs', 'Add a “summarize at 3 lengths” toggle', 'Batch-summarize a folder of docs'],
    portfolio: 'Demonstrates prompt engineering, structured output discipline, and long-input handling — the bread and butter of applied AI.',
  },
  {
    id: 'data-extractor',
    title: 'Structured Data Extractor',
    tagline: 'Turn messy emails, receipts, or invoices into clean, validated JSON your code can trust.',
    icon: 'Braces',
    difficulty: 'Beginner',
    hours: 5,
    tags: ['Extraction', 'Structured Output', 'Validation'],
    modules: [2, 6],
    overview: 'One of the highest-ROI, least-flashy uses of LLMs in industry: converting unstructured text into structured data for your backend. You’ll build the validate-and-retry loop that turns a probabilistic model into a reliable pipeline component.',
    features: ['Paste unstructured text', 'Schema-driven extraction to JSON', 'Field validation + confidence flags', 'Human-review queue for low-confidence results'],
    stack: ['React', 'LLM API (JSON mode)', 'Zod schema', 'Retry loop'],
    architecture: 'Text in → prompt with the target schema → JSON-mode generation → Zod validation → on failure, retry with the error; on success, return typed data → low-confidence items routed to a review view.',
    steps: [
      { title: 'Define the schema', detail: 'A Zod schema for the fields you need (name, email, amount, date, category…). Types become your contract.' },
      { title: 'Extraction prompt', detail: 'Instruct JSON-only output matching the schema; provide 1–2 examples for the tricky cases.' },
      { title: 'Validate + retry', detail: 'safeParse the output; on failure, feed the Zod error back to the model and retry (cap at 2–3).' },
      { title: 'Graceful degradation', detail: 'After retries, return {ok:false} and route to a human-review queue — never crash the pipeline.' },
    ],
    structure: `extractor/
├── schema.js           # Zod schema (the contract)
├── api/extract.js      # prompt → JSON → validate → retry
└── src/Review.jsx      # low-confidence queue`,
    focus: [
      { area: 'Prompt design', note: 'Strict JSON contract + examples for edge cases; positive instructions.' },
      { area: 'Production', note: 'Bounded retries, {ok:false} fallback, dead-letter/review queue, metrics on failure rate.' },
      { area: 'Security', note: 'Treat input as untrusted (prompt-injection aware); never let extracted values drive privileged actions unchecked.' },
    ],
    stretch: ['Extract from images (vision) — receipts/invoices', 'Batch process a CSV of records', 'Add per-field confidence and auto-approve above a threshold'],
    portfolio: 'The pattern behind document-AI startups. Shows you can make LLMs reliable enough for a real data pipeline.',
  },
  {
    id: 'multi-model-arena',
    title: 'Multi-Model Comparison Arena',
    tagline: 'Send one prompt to several models and compare outputs, latency, and cost side by side.',
    icon: 'Scale',
    difficulty: 'Beginner',
    hours: 5,
    tags: ['Evaluation', 'Multi-provider', 'Cost'],
    modules: [1, 2],
    overview: 'Build the tool you’ll actually use to pick models: fan one prompt out to multiple models/providers and compare results, TTFT, and cost. Teaches the thin-gateway pattern and eval-driven model selection.',
    features: ['One prompt → N models in parallel', 'Side-by-side outputs with streaming', 'Per-model TTFT, tokens, and cost', 'Save prompts + a lightweight scoring/vote'],
    stack: ['React', 'A model gateway (config-driven)', 'Parallel API calls', 'Streaming'],
    architecture: 'Client sends prompt + selected models → backend fans out parallel streaming calls through a thin gateway (model names in config) → streams each back into its own panel → tracks metrics per model.',
    steps: [
      { title: 'Thin gateway', detail: 'A single module that maps a tier/name to a provider call. Adding a model is a config edit, not new code.' },
      { title: 'Parallel fan-out', detail: 'Fire all selected models concurrently; stream each into its own panel.' },
      { title: 'Metrics', detail: 'Record TTFT, output tokens, and computed cost per model.' },
      { title: 'Scoring', detail: 'Let the user pick a winner per prompt; store prompt+results for a mini eval set.' },
    ],
    structure: `arena/
├── gateway.js          # name → provider call (config)
├── api/compare.js      # parallel streams + metrics
└── src/Arena.jsx       # N panels`,
    focus: [
      { area: 'API integration', note: 'Config-driven model names; normalize responses so panels are uniform.' },
      { area: 'Optimization', note: 'Parallelize; show cost so “biggest model for everything” is visibly expensive.' },
      { area: 'Production', note: 'This becomes your eval harness — save results to compare prompt/model changes over time.' },
    ],
    stretch: ['Add an LLM-as-judge auto-score', 'Include open models via Ollama', 'Export a scored eval report'],
    portfolio: 'Shows you make model choices with data, not vibes — and understand the portable, config-driven architecture.',
  },
  {
    id: 'prompt-ab-lab',
    title: 'Prompt A/B Testing Lab',
    tagline: 'Score two prompts against a labeled test set and pick the winner by measurement.',
    icon: 'FlaskConical',
    difficulty: 'Intermediate',
    hours: 6,
    tags: ['Prompting', 'Evals', 'LLM-as-judge'],
    modules: [3, 10],
    overview: 'Stop tuning prompts by vibes. Build a harness that runs prompt variants against a golden dataset and scores them — the eval discipline that separates senior AI engineers from prompt-tinkerers.',
    features: ['Define a golden set (input → expected)', 'Run N prompt variants', 'Exact-match + LLM-as-judge scoring', 'Regression view: did a change hurt anything?'],
    stack: ['Node/React', 'LLM API', 'A scoring module', 'JSON dataset'],
    architecture: 'A dataset of cases → run each prompt variant over all cases → score outputs (exact/property checks + LLM judge) → aggregate accuracy per variant → compare and flag regressions.',
    steps: [
      { title: 'Golden set', detail: 'Curate 15–25 representative cases with expected outputs or acceptance criteria.' },
      { title: 'Runner', detail: 'For each prompt variant, run all cases (temperature ~0), collect outputs.' },
      { title: 'Scorers', detail: 'Property checks (valid JSON, contains X) plus an LLM-as-judge with a rubric for open-ended cases.' },
      { title: 'Report', detail: 'Per-variant scores, per-case diffs, and a regression flag when a change lowers any case.' },
    ],
    structure: `prompt-lab/
├── dataset.json        # golden cases
├── prompts/*.js        # versioned variants
├── scorers.js          # exact + judge
└── run.js              # runner + report`,
    focus: [
      { area: 'Prompt design', note: 'Version prompts as files; log which version produced each output.' },
      { area: 'Evals', note: 'Pin model versions; separate property checks from judge scores; watch for judge bias.' },
      { area: 'Production', note: 'Wire it into CI as a regression gate for prompt changes.' },
    ],
    stretch: ['Add cost/latency to the scorecard', 'Mine failures from production logs into the dataset', 'A/B in prod behind a flag'],
    portfolio: 'Evals are “the real moat.” This project proves you can measure and improve AI quality systematically.',
  },
  {
    id: 'semantic-search',
    title: 'Semantic Search Engine',
    tagline: 'Search a document collection by meaning, not keywords — the retrieval half of RAG.',
    icon: 'Search',
    difficulty: 'Intermediate',
    hours: 8,
    tags: ['Embeddings', 'Vector Search', 'Retrieval'],
    modules: [6],
    overview: 'Build a working semantic search over your own documents: chunk, embed, index, and query by meaning. This is the foundation every RAG system is built on — and a strong standalone tool.',
    features: ['Ingest markdown/text/PDF', 'Chunking with overlap + metadata', 'Vector index (pgvector or in-memory)', 'Top-K search with source + score', 'Optional hybrid + rerank'],
    stack: ['Node/Python', 'Embedding API', 'pgvector / Chroma / in-memory', 'React results UI'],
    architecture: 'Ingest: docs → chunk (size+overlap, structure-aware) → embed (batched) → vector store with metadata. Query: embed the question → top-K nearest by cosine → return ranked chunks with source/section.',
    steps: [
      { title: 'Ingestion', detail: 'Load docs, chunk with overlap, attach metadata (source, section), batch-embed, upsert to the store.' },
      { title: 'Search', detail: 'Embed the query, run top-K similarity search, return chunks with scores and source.' },
      { title: 'Quality', detail: 'Tune chunk size/overlap and K; measure with a small labeled eval (precision/recall).' },
      { title: 'Hybrid (stretch)', detail: 'Add keyword (BM25) + vector fusion and a rerank pass for precision.' },
    ],
    structure: `search/
├── ingest.js           # chunk + embed + index
├── search.js           # embed query → topK
├── store.js            # vector DB adapter
└── src/Results.jsx`,
    focus: [
      { area: 'API integration', note: 'Same embedding model for docs and queries; batch to control cost.' },
      { area: 'Optimization', note: 'ANN index for scale; keep chunks tight; cache embeddings.' },
      { area: 'Production', note: 'Incremental re-indexing on doc changes; metadata filtering by tenant/date.' },
    ],
    stretch: ['Add hybrid search + reranking', 'Metadata filters (namespace/date)', 'A relevance eval to tune settings'],
    portfolio: 'Semantic search is a product on its own and the base of RAG. Proves you understand embeddings, chunking, and vector DBs.',
  },
  {
    id: 'chat-with-docs',
    title: 'Chat With Your Docs (RAG)',
    tagline: 'The classic AI-engineer portfolio project: a cited chatbot grounded in your documents.',
    icon: 'Database',
    difficulty: 'Intermediate',
    hours: 12,
    tags: ['RAG', 'Retrieval', 'Grounding', 'Citations'],
    modules: [6, 7],
    overview: 'The single most-requested AI engineering project — and the one interviewers love. A chat app that answers questions grounded in a document set, cites its sources, and honestly says when it doesn’t know. You’ll assemble everything from Modules 6–7 into one system.',
    features: ['Ingest a document set', 'Retrieve relevant chunks per question', 'Grounded, streamed answers with clickable citations', 'Abstains when the docs don’t cover it', 'Conversation memory'],
    stack: ['React', 'Backend (Node/Python)', 'Vector DB', 'LLM API (streaming)'],
    architecture: 'Chat UI → backend (owns vector DB + LLM key): per question, retrieve top-K (hybrid+rerank) → assemble a grounded prompt (system + context + question, instruct cite + abstain) → stream a grounded answer with citations → client renders citations as clickable sources.',
    steps: [
      { title: 'Ingest', detail: 'Chunk + embed + index your docs with metadata for citations (source, section, page).' },
      { title: 'Retrieve', detail: 'Per question, embed and fetch top-K; add hybrid + rerank for precision.' },
      { title: 'Ground + generate', detail: 'Build a prompt that restricts the model to the retrieved context, requires citations, and abstains when unsupported. Stream the answer.' },
      { title: 'Citations UI', detail: 'Parse citation markers; render them clickable to reveal the exact source chunk.' },
      { title: 'Evals + guardrails', detail: 'Add retrieval precision/recall and answer-groundedness checks; handle the unanswerable case.' },
    ],
    structure: `chat-docs/
├── ingest/             # chunk + embed + index
├── api/
│   ├── retrieve.js     # topK + rerank
│   └── chat.js         # ground + stream + cite
└── src/Chat.jsx        # streaming + clickable citations`,
    focus: [
      { area: 'Prompt design', note: 'Restrict to context, require citations, force abstention — the grounding contract.' },
      { area: 'API integration', note: 'Backend owns keys + vector DB; stream grounded answers to the client.' },
      { area: 'Optimization', note: 'Rerank to fewer/better chunks (quality + cost); prompt-cache stable context.' },
      { area: 'Security', note: 'Retrieved content is untrusted (indirect injection) — least privilege; per-tenant isolation.' },
      { area: 'Production', note: 'Retrieval + groundedness evals; monitor hit-rate, cost, and thumbs-down.' },
    ],
    stretch: ['Multi-document upload UI', 'Per-user/tenant document isolation', 'Query rewriting for vague questions', 'Cost + latency dashboard'],
    portfolio: 'THE flagship AI-engineer project. Ship this and you can credibly interview for GenAI roles.',
  },
  {
    id: 'support-bot',
    title: 'Grounded Support Bot',
    tagline: 'A customer-support assistant that answers from your help center and escalates safely.',
    icon: 'Headphones',
    difficulty: 'Intermediate',
    hours: 10,
    tags: ['RAG', 'Grounding', 'Guardrails', 'SaaS'],
    modules: [3, 7],
    overview: 'A real, deployable product: a support bot grounded in your help-center docs that answers common questions, cites policy, refuses to invent, and hands off to a human when unsure. Combines RAG, grounding, and defensive prompting.',
    features: ['RAG over help-center content', 'Policy-grounded answers with citations', 'Escalation to human on low confidence / sensitive topics', 'Prompt-injection defenses'],
    stack: ['React widget', 'RAG backend', 'Vector DB', 'LLM API'],
    architecture: 'Embeddable chat widget → RAG backend grounded in help docs → grounded+cited answers; a confidence/topic router escalates to a human queue when the docs don’t cover it or the topic is sensitive (billing disputes, security).',
    steps: [
      { title: 'Ingest help center', detail: 'Chunk + embed your docs/FAQs with source metadata for citations.' },
      { title: 'Grounded answers', detail: 'System prompt restricts to retrieved policy, requires citations, and defines an escalation script.' },
      { title: 'Escalation routing', detail: 'Route to a human when retrieval is weak, confidence is low, or the topic matches a sensitive list.' },
      { title: 'Injection defense', detail: 'Delimit user input and retrieved content; never let the bot take privileged actions on prompt instructions alone.' },
    ],
    structure: `support-bot/
├── ingest/
├── api/chat.js         # RAG + grounding + escalation
├── guardrails.js       # topic router + injection checks
└── widget/Widget.jsx`,
    focus: [
      { area: 'Prompt design', note: 'Identity, rules, citation requirement, and an explicit escalation script.' },
      { area: 'Security', note: 'Injection defense in depth; sensitive actions gated in code, not the prompt.' },
      { area: 'Production', note: 'Deflection-rate + escalation metrics; a feedback loop from unhandled questions.' },
    ],
    stretch: ['Ticket-system integration for handoff', 'Multilingual support', 'Auto-suggest new FAQ entries from unanswered questions'],
    portfolio: 'A product companies actually pay for. Shows RAG + guardrails + real product thinking.',
  },
  {
    id: 'code-explainer',
    title: 'Code Explainer & Reviewer',
    tagline: 'Paste code, get a plain-English explanation, a review, and suggested fixes.',
    icon: 'FileCode2',
    difficulty: 'Intermediate',
    hours: 6,
    tags: ['Developer tools', 'Prompting', 'Structured Output'],
    modules: [2, 3],
    overview: 'A dev tool you’ll actually use: explain unfamiliar code, review a diff for bugs/smells, and suggest improvements. Great for practicing chain-of-thought and structured, actionable output.',
    features: ['Explain code in plain English', 'Review for bugs, smells, security', 'Structured findings (severity + fix)', 'Language-aware prompts'],
    stack: ['React', 'LLM API', 'Structured output', 'Syntax highlighting'],
    architecture: 'Code in → prompt with role (senior reviewer), the code as delimited input, and a structured findings contract → model reasons then returns findings (severity, line, issue, fix) → UI renders explanation + review.',
    steps: [
      { title: 'Explain mode', detail: 'A prompt that walks through the code’s intent and flow for a specific audience level.' },
      { title: 'Review mode', detail: 'Chain-of-thought reasoning then a structured list of findings (severity, location, issue, suggested fix).' },
      { title: 'Render', detail: 'Highlighted code with inline findings and a copyable improved version.' },
    ],
    structure: `code-tool/
├── api/explain.js
├── api/review.js       # CoT → structured findings
└── src/Review.jsx`,
    focus: [
      { area: 'Prompt design', note: 'Reason before concluding (tag-and-parse); structured findings for actionability.' },
      { area: 'Optimization', note: 'Route simple explains to a cheap model; reviews to a stronger one.' },
      { area: 'Production', note: 'Cap input size; never auto-apply fixes without human review.' },
    ],
    stretch: ['GitHub PR integration (inline comments)', 'Whole-repo context via retrieval', 'Test-generation mode'],
    portfolio: 'A polished developer tool that shows CoT prompting and structured, useful output.',
  },
  {
    id: 'meeting-notes',
    title: 'Meeting Notes → Action Items',
    tagline: 'Turn a transcript into a summary, decisions, and assigned action items.',
    icon: 'ListChecks',
    difficulty: 'Intermediate',
    hours: 5,
    tags: ['Summarization', 'Structured Output', 'Productivity'],
    modules: [2, 3],
    overview: 'A productivity tool that transforms a messy meeting transcript into structured, useful output: a summary, key decisions, and action items with owners and due dates. Practices long-input handling and reliable structured extraction.',
    features: ['Paste/upload transcript', 'Summary + decisions + action items (owner, due)', 'Long transcripts via map-reduce', 'Export to markdown/tasks'],
    stack: ['React', 'LLM API', 'Structured output', 'Chunking'],
    architecture: 'Transcript → (chunk if long) → prompt with a structured contract (summary, decisions[], actions[{owner,task,due}]) → validate → render + export.',
    steps: [
      { title: 'Extraction contract', detail: 'Define the JSON shape: summary, decisions, action items with owner/task/due.' },
      { title: 'Long transcripts', detail: 'Map-reduce: extract per chunk, then merge/dedup into one structured result.' },
      { title: 'Export', detail: 'Render editable sections; export to markdown or push actions to a task tool.' },
    ],
    structure: `meeting-notes/
├── api/extract.js      # contract + map-reduce
├── lib/merge.js        # dedup actions
└── src/Notes.jsx`,
    focus: [
      { area: 'Prompt design', note: 'Extract only what’s stated; don’t invent owners/dates — abstain when unclear.' },
      { area: 'Production', note: 'Validate structured output; let users edit before export (human-in-the-loop).' },
    ],
    stretch: ['Real-time streaming from a live transcript', 'Calendar/task integrations', 'Speaker-attributed action items'],
    portfolio: 'A clean, shippable productivity feature that shows structured output over long, messy input.',
  },
  {
    id: 'study-buddy',
    title: 'Flashcard & Quiz Generator',
    tagline: 'Paste notes, get spaced-repetition flashcards and a quiz — auto-generated.',
    icon: 'Layers',
    difficulty: 'Beginner',
    hours: 4,
    tags: ['Education', 'Structured Output', 'Prompting'],
    modules: [2],
    overview: 'Generate study materials from any text: flashcards (Q/A) and a multiple-choice quiz with explanations. A friendly beginner project that reinforces structured output and good prompt design.',
    features: ['Notes → flashcards (front/back)', 'Auto-generated MCQ quiz with explanations', 'Difficulty control', 'Export deck (JSON/CSV)'],
    stack: ['React', 'LLM API', 'Structured output'],
    architecture: 'Notes in → prompt with a structured contract (cards[], quiz[{q,options,answer,explain}]) → validate (answers are valid indices) → render an interactive study UI.',
    steps: [
      { title: 'Generate cards', detail: 'Prompt for atomic Q/A pairs from the notes; enforce a JSON array.' },
      { title: 'Generate quiz', detail: 'MCQs with exactly 4 options, a correct index, and an explanation; validate indices.' },
      { title: 'Study UI', detail: 'Flip cards + a quiz runner (reuse the patterns from this very course).' },
    ],
    structure: `study-buddy/
├── api/generate.js     # cards + quiz contract
├── src/Deck.jsx
└── src/Quiz.jsx`,
    focus: [
      { area: 'Prompt design', note: 'Atomic cards; validate that quiz answer indices are in range and correct.' },
      { area: 'Production', note: 'Guard against malformed quizzes (invalid answer index) before rendering.' },
    ],
    stretch: ['Spaced-repetition scheduling (SM-2)', 'Generate from a PDF/URL', 'Share decks'],
    portfolio: 'Approachable and genuinely useful; demonstrates reliable structured generation.',
  },
  {
    id: 'content-saas',
    title: 'AI Content Generator (mini SaaS)',
    tagline: 'A multi-tenant content tool with auth, usage metering, and templates — a real product skeleton.',
    icon: 'Rocket',
    difficulty: 'Advanced',
    hours: 16,
    tags: ['SaaS', 'Multi-tenancy', 'Billing', 'Prompting'],
    modules: [2, 3, 12],
    overview: 'Level up from “AI feature” to “AI product.” Build the skeleton of a content-generation SaaS: templated generation, user accounts, per-user token metering and limits, and the production concerns (cost control, caching, abuse). A forward-looking capstone that previews Module 12.',
    features: ['Template-driven generation (blog, email, ad copy)', 'Auth + per-user workspaces', 'Token metering + plan limits', 'Prompt templates as versioned config', 'Cost dashboard'],
    stack: ['Next.js', 'Auth (Clerk/Auth.js)', 'DB (Postgres)', 'LLM gateway', 'Stripe (optional)'],
    architecture: 'Frontend → API layer (auth, rate limit, metering) → model gateway (templated prompts, routing) → provider. Usage logged per user; plan limits enforced in code; costs aggregated to a dashboard.',
    steps: [
      { title: 'Templates as config', detail: 'Versioned prompt templates with typed variables; a template picker in the UI.' },
      { title: 'Auth + tenancy', detail: 'User accounts and per-user workspaces; isolate data per tenant.' },
      { title: 'Metering + limits', detail: 'Log usage per request per user; enforce daily/plan token caps in code; degrade gracefully.' },
      { title: 'Cost controls', detail: 'Model routing by task, caching of repeated generations, spend alerts.' },
      { title: 'Dashboard', detail: 'Per-user usage + cost; admin view of totals.' },
    ],
    structure: `content-saas/
├── app/                # Next.js routes
├── lib/gateway.js      # templated prompts + routing
├── lib/metering.js     # usage + limits
└── db/schema.sql`,
    focus: [
      { area: 'Prompt design', note: 'Prompts-as-code: versioned templates, logged versions, A/B ready.' },
      { area: 'Scaling', note: 'Background jobs/queues for long generations; caching; model routing.' },
      { area: 'Security', note: 'Per-tenant isolation; rate limiting; injection defense; no keys client-side.' },
      { area: 'Production', note: 'Metering, spend caps, monitoring, and a real cost model.' },
    ],
    stretch: ['Stripe usage-based billing', 'Team seats + roles', 'Streaming + optimistic UI', 'Async queue for batch jobs'],
    portfolio: 'Shows you can build an AI PRODUCT, not just a feature — architecture, multi-tenancy, cost, and security together.',
  },
]

export const getProject = (id) => PROJECTS.find((p) => p.id === id)

export const PROJECT_TAGS = [...new Set(PROJECTS.flatMap((p) => p.tags))].sort()

export const PROJECT_STATS = {
  count: PROJECTS.length,
  hours: PROJECTS.reduce((a, p) => a + p.hours, 0),
  byDifficulty: PROJECTS.reduce((acc, p) => ({ ...acc, [p.difficulty]: (acc[p.difficulty] || 0) + 1 }), {}),
}
