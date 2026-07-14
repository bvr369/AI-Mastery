// The full AI Mastery curriculum: 12 modules, ~96 lessons.
// `live: true` = fully authored and playable now. Everything else shows its delivery phase.
// Difficulty: Beginner | Intermediate | Advanced

const L = (id, title, desc, minutes, difficulty, xp, extra = {}) => ({ id, title, desc, minutes, difficulty, xp, ...extra })

export const MODULES = [
  {
    id: 'm1', num: 1, icon: 'Sparkles', phase: 1,
    title: 'Foundations of Generative AI',
    tagline: 'What LLMs are, how they "think", and why they sometimes lie',
    lessons: [
      L('m1-l1', 'What Is Generative AI?', 'From rule-based software to software that creates — your new mental model.', 25, 'Beginner', 80, { live: true }),
      L('m1-l2', 'Next-Token Prediction: How LLMs Actually Work', 'The core loop behind every chatbot, explained with an interactive predictor.', 30, 'Beginner', 90, { live: true, prereqs: ['m1-l1'] }),
      L('m1-l3', 'The GenAI Landscape: Models, Providers & Modalities', 'Claude, GPT, Gemini, Llama, image/audio/video models — who does what.', 25, 'Beginner', 80, { live: true, prereqs: ['m1-l2'] }),
      L('m1-l4', 'Tokens, Context Windows & Model Limits', 'Why models forget, why long chats cost more, and how to think in tokens.', 30, 'Beginner', 80, { live: true, prereqs: ['m1-l2'] }),
      L('m1-l5', 'Hallucination, Bias & Failure Modes', 'When models confidently make things up — and how engineers design around it.', 30, 'Beginner', 80, { live: true, prereqs: ['m1-l2'] }),
      L('m1-l6', 'From Pretraining to RLHF: How Models Are Made', 'The three training stages that turn internet text into a helpful assistant.', 35, 'Intermediate', 100, { live: true, prereqs: ['m1-l5'] }),
      L('m1-l7', 'Open vs Closed Models: Choosing Your Stack', 'API models vs self-hosted weights — cost, control, and quality trade-offs.', 25, 'Intermediate', 100, { live: true, prereqs: ['m1-l3'] }),
      L('m1-l8', 'Checkpoint: Foundations Boss Quiz', 'Prove your mental model is solid before touching real APIs.', 20, 'Beginner', 150, { live: true, prereqs: ['m1-l7'] }),
    ],
  },
  {
    id: 'm2', num: 2, icon: 'Plug', phase: 2,
    title: 'Working with LLM APIs',
    tagline: 'Your first real AI code — in JavaScript, your home turf',
    lessons: [
      L('m2-l1', 'Your First LLM API Call', 'fetch() + an API key = a working AI feature in 20 lines of JavaScript.', 30, 'Beginner', 90, { live: true, prereqs: ['m1-l2'] }),
      L('m2-l2', 'Messages, Roles & Conversation State', 'Why chat is an array you manage — user, assistant, and system roles.', 30, 'Beginner', 90, { live: true, prereqs: ['m2-l1'] }),
      L('m2-l3', 'System Prompts: Programming with English', 'The most powerful config file you will ever write.', 25, 'Beginner', 90, { live: true, prereqs: ['m2-l2'] }),
      L('m2-l4', 'Streaming Responses & Chat UX', 'Server-sent events, token-by-token rendering, and the React patterns for it.', 40, 'Intermediate', 110, { live: true, prereqs: ['m2-l2'] }),
      L('m2-l5', 'Temperature, top_p & Sampling Controls', 'Every generation knob explained with live sliders.', 30, 'Beginner', 90, { live: true, prereqs: ['m2-l1'] }),
      L('m2-l6', 'Structured Output & JSON Mode', 'Making models return data your code can actually parse — reliably.', 35, 'Intermediate', 110, { live: true, prereqs: ['m2-l1'] }),
      L('m2-l7', 'Vision & Multimodal Inputs', 'Sending images and files to models, and what they can do with them.', 30, 'Intermediate', 100, { live: true, prereqs: ['m2-l1'] }),
      L('m2-l8', 'Errors, Retries, Rate Limits & Cost Control', 'Production hygiene: backoff, budgets, and not leaking your API key.', 35, 'Intermediate', 110, { live: true, prereqs: ['m2-l1'] }),
      L('m2-l9', 'Checkpoint Project: Build a React Chatbot', 'A streaming chat app with system prompt control — your first real AI product.', 90, 'Intermediate', 150, { live: true, prereqs: ['m2-l4', 'm2-l8'] }),
    ],
  },
  {
    id: 'm3', num: 3, icon: 'PenTool', phase: 3,
    title: 'Prompt Engineering That Actually Works',
    tagline: 'Reliable outputs on purpose, not by luck',
    lessons: [
      L('m3-l1', 'Anatomy of a Great Prompt', 'Role, context, task, format, examples — the five-part template.', 25, 'Beginner', 90, { live: true, prereqs: ['m2-l3'] }),
      L('m3-l2', 'Zero-Shot, Few-Shot & In-Context Learning', 'Teaching a model with examples instead of training.', 30, 'Beginner', 90, { live: true, prereqs: ['m3-l1'] }),
      L('m3-l3', 'Chain-of-Thought & Reasoning Techniques', 'Making models think step-by-step — and when reasoning models do it for you.', 35, 'Intermediate', 110, { live: true, prereqs: ['m3-l1'] }),
      L('m3-l4', 'Controlling Format, Tone & Length', 'XML tags, markdown contracts, and output shaping tricks.', 25, 'Beginner', 90, { live: true, prereqs: ['m3-l1'] }),
      L('m3-l5', 'Prompt Templates & Variables in Code', 'Treating prompts as versioned, testable software artifacts.', 30, 'Intermediate', 100, { live: true, prereqs: ['m3-l4'] }),
      L('m3-l6', 'Prompt Injection & Defensive Prompting', 'The #1 LLM security hole — attack it yourself in a sandboxed simulator.', 40, 'Intermediate', 120, { live: true, prereqs: ['m3-l5'] }),
      L('m3-l7', 'Evaluating & Iterating on Prompts', 'A/B your prompts with a scoring loop instead of vibes.', 35, 'Intermediate', 110, { live: true, prereqs: ['m3-l1'] }),
      L('m3-l8', 'Checkpoint: The Prompt Gauntlet', 'Twelve scenarios across the module — pass to clear it.', 30, 'Intermediate', 150, { live: true, prereqs: ['m3-l7'] }),
    ],
  },
  {
    id: 'm4', num: 4, icon: 'FileCode2', phase: 4,
    title: 'Python for JavaScript Developers',
    tagline: 'The 20% of Python you need for AI, mapped from JS you already know',
    lessons: [
      L('m4-l1', 'Python Syntax: A JS-to-Python Phrasebook', 'Variables, functions, loops — side-by-side with the JavaScript you write daily.', 35, 'Beginner', 90),
      L('m4-l2', 'Lists, Dicts & Comprehensions', 'Python data structures vs arrays and objects — plus the one-liners Python devs love.', 35, 'Beginner', 90),
      L('m4-l3', 'Functions, Classes & Modules', 'def, self, imports, and packages — organized like your JS projects.', 35, 'Beginner', 90),
      L('m4-l4', 'pip, venv & Project Setup', 'npm-to-pip translation: environments, requirements.txt, and pyproject.', 25, 'Beginner', 80),
      L('m4-l5', 'Async Python & Working with APIs', 'async/await you already know, now with httpx and the OpenAI/Anthropic SDKs.', 40, 'Intermediate', 110),
      L('m4-l6', 'Notebooks & Quick Experiments', 'Jupyter as your AI scratchpad — when to use it and when to avoid it.', 25, 'Beginner', 80),
      L('m4-l7', 'Checkpoint Project: Port a JS Tool to Python', 'Rebuild a small CLI tool in Python, calling an LLM API.', 60, 'Intermediate', 150),
    ],
  },
  {
    id: 'm5', num: 5, icon: 'Cpu', phase: 4,
    title: 'Inside the Transformer',
    tagline: 'Open the black box — with simulators, not math lectures',
    lessons: [
      L('m5-l1', 'Embeddings: How Meaning Becomes Numbers', 'Words as coordinates in space — explore a live 2D embedding map.', 35, 'Intermediate', 110),
      L('m5-l2', 'Attention: The Idea That Changed Everything', 'Watch tokens look at each other in an interactive attention visualizer.', 40, 'Intermediate', 120),
      L('m5-l3', 'The Transformer Architecture Tour', 'Layers, heads, and the residual stream — a guided walkthrough diagram.', 40, 'Intermediate', 120),
      L('m5-l4', 'Tokenizers Deep Dive', 'BPE explained by building one — why "strawberry" breaks models.', 35, 'Intermediate', 110),
      L('m5-l5', 'Sampling Strategies: Greedy, Beam, top-k, top-p', 'Every decoding strategy raced side-by-side in a simulator.', 35, 'Intermediate', 110),
      L('m5-l6', 'KV Cache & Why Long Context Is Expensive', 'The memory trick behind fast inference — and its costs.', 30, 'Advanced', 120),
      L('m5-l7', 'Model Sizes, Scaling & Distillation', 'What 7B vs 70B actually means for quality, speed, and price.', 30, 'Intermediate', 100),
      L('m5-l8', 'Checkpoint: Under-the-Hood Boss Quiz', 'Explain the machine like an engineer, not a user.', 20, 'Intermediate', 150),
    ],
  },
  {
    id: 'm6', num: 6, icon: 'Compass', phase: 5,
    title: 'Embeddings & Semantic Search',
    tagline: 'Search by meaning — the foundation of every RAG system',
    lessons: [
      L('m6-l1', 'Embedding APIs & What They Encode', 'Generate real embeddings and measure similarity in code.', 30, 'Intermediate', 100),
      L('m6-l2', 'Similarity Without Tears', 'Cosine similarity as "how aligned are two arrows" — no linear algebra degree needed.', 30, 'Intermediate', 100),
      L('m6-l3', 'Vector Databases', 'Pinecone, pgvector, Chroma, Qdrant — how they index millions of vectors fast.', 35, 'Intermediate', 110),
      L('m6-l4', 'Chunking Strategies', 'How you split documents makes or breaks retrieval quality.', 35, 'Intermediate', 110),
      L('m6-l5', 'Hybrid Search & Reranking', 'Combining keyword + vector search, then reranking for precision.', 35, 'Advanced', 120),
      L('m6-l6', 'Build: Semantic Search for Your Docs', 'A working search engine over markdown files, end to end.', 60, 'Intermediate', 140),
      L('m6-l7', 'Checkpoint: Search Quality Challenge', 'Tune chunking + retrieval to beat a baseline relevance score.', 30, 'Advanced', 150),
    ],
  },
  {
    id: 'm7', num: 7, icon: 'Database', phase: 5,
    title: 'RAG: Retrieval-Augmented Generation',
    tagline: 'Give models your knowledge without retraining them',
    lessons: [
      L('m7-l1', 'Why RAG Exists', 'Context injection vs fine-tuning vs bigger models — the decision tree.', 25, 'Intermediate', 100),
      L('m7-l2', 'RAG Architecture End-to-End', 'Ingest → embed → store → retrieve → augment → generate, fully animated.', 35, 'Intermediate', 110),
      L('m7-l3', 'Ingestion Pipelines', 'PDFs, HTML, and messy real-world documents into clean chunks.', 35, 'Intermediate', 110),
      L('m7-l4', 'Retrieval Quality & RAG Evals', 'Measuring "did we fetch the right stuff" before blaming the model.', 35, 'Advanced', 120),
      L('m7-l5', 'Citations & Grounded Answers', 'Making the model quote its sources — and admit when it doesn\'t know.', 30, 'Intermediate', 110),
      L('m7-l6', 'Advanced RAG: Query Rewriting, Multi-hop, Agentic RAG', 'When naive retrieval fails and what to layer on top.', 40, 'Advanced', 130),
      L('m7-l7', 'Production RAG: Cost, Latency & Caching', 'Serving RAG at scale without burning money.', 35, 'Advanced', 120),
      L('m7-l8', 'Checkpoint Project: Chat With Your Docs', 'A cited docs-chatbot over content you choose — the classic AI engineer interview project.', 120, 'Advanced', 200),
    ],
  },
  {
    id: 'm8', num: 8, icon: 'Bot', phase: 6,
    title: 'AI Agents & Tool Use',
    tagline: 'From chatbots that talk to agents that do',
    lessons: [
      L('m8-l1', 'What Is an Agent, Really?', 'LLM + tools + loop. Cut through the hype with a precise definition.', 25, 'Intermediate', 100),
      L('m8-l2', 'Function & Tool Calling', 'Teaching models to call your code with JSON schemas.', 40, 'Intermediate', 120),
      L('m8-l3', 'The Agent Loop: Reason → Act → Observe', 'ReAct pattern in the interactive Agent Visualizer.', 40, 'Intermediate', 120),
      L('m8-l4', 'Planning & Task Decomposition', 'How agents break "book me a trip" into executable steps.', 35, 'Advanced', 120),
      L('m8-l5', 'Agent Memory Systems', 'Short-term, long-term, episodic — and when a database beats a context window.', 35, 'Advanced', 120),
      L('m8-l6', 'Reflection & Self-Correction', 'Agents that critique their own work before shipping it.', 30, 'Advanced', 120),
      L('m8-l7', 'Agent Safety, Guardrails & Injection Defense', 'Sandboxing, permissions, and why agents amplify prompt injection risk.', 40, 'Advanced', 130),
      L('m8-l8', 'Build an Agent From Scratch (No Framework)', 'A working tool-using agent in ~150 lines of JavaScript.', 90, 'Advanced', 160),
      L('m8-l9', 'Checkpoint: Agent Architecture Exam', 'Design agent systems on paper like a senior engineer.', 30, 'Advanced', 150),
    ],
  },
  {
    id: 'm9', num: 9, icon: 'Network', phase: 6,
    title: 'Multi-Agent Systems',
    tagline: 'Teams of agents: orchestration, communication, chaos control',
    lessons: [
      L('m9-l1', 'When One Agent Isn\'t Enough', 'The real reasons to go multi-agent (and the many reasons not to).', 25, 'Advanced', 110),
      L('m9-l2', 'Orchestration Patterns', 'Supervisor, pipeline, swarm, debate — animated pattern gallery.', 35, 'Advanced', 120),
      L('m9-l3', 'Communication & Shared State', 'Message passing, blackboards, and handoffs between agents.', 35, 'Advanced', 120),
      L('m9-l4', 'Framework Tour: LangGraph, CrewAI & Agent SDKs', 'What each framework actually gives you, with the same app built in each.', 45, 'Advanced', 130),
      L('m9-l5', 'Evaluating Multi-Agent Systems', 'Tracing failures across agents without losing your mind.', 35, 'Advanced', 120),
      L('m9-l6', 'Cost & Latency in Agent Swarms', 'Token budgets, parallelism, and knowing when to collapse back to one agent.', 30, 'Advanced', 120),
      L('m9-l7', 'Checkpoint Project: Research Crew', 'A multi-agent researcher: planner + searchers + writer + critic.', 120, 'Advanced', 200),
    ],
  },
  {
    id: 'm10', num: 10, icon: 'FlaskConical', phase: 7,
    title: 'Evaluation, Testing & Observability',
    tagline: 'The skill that separates demos from products',
    lessons: [
      L('m10-l1', 'Why Evals Are the Real Moat', 'You can\'t improve what you can\'t measure — the eval-driven workflow.', 25, 'Intermediate', 100),
      L('m10-l2', 'Building Eval Datasets', 'Golden sets, edge cases, and mining production failures.', 35, 'Advanced', 120),
      L('m10-l3', 'LLM-as-Judge', 'Using models to grade models — calibration, bias, and rubrics.', 35, 'Advanced', 120),
      L('m10-l4', 'Regression Testing Prompts & Pipelines', 'CI for AI: catching quality drops before your users do.', 35, 'Advanced', 120),
      L('m10-l5', 'Tracing & Logging LLM Apps', 'Spans, traces, and replaying exactly what the model saw.', 35, 'Advanced', 120),
      L('m10-l6', 'Monitoring in Production', 'Drift, cost spikes, latency budgets, and user feedback loops.', 30, 'Advanced', 120),
      L('m10-l7', 'Checkpoint: Eval Harness Build', 'Build a mini eval framework and use it to pick between two prompts.', 60, 'Advanced', 160),
    ],
  },
  {
    id: 'm11', num: 11, icon: 'Wrench', phase: 7,
    title: 'Fine-Tuning & Model Customization',
    tagline: 'When prompting isn\'t enough — reshape the model itself',
    lessons: [
      L('m11-l1', 'When (Not) to Fine-Tune', 'The decision framework: prompting vs RAG vs fine-tuning vs distillation.', 25, 'Advanced', 110),
      L('m11-l2', 'Dataset Engineering', 'The unglamorous 80%: building instruction datasets that actually work.', 35, 'Advanced', 120),
      L('m11-l3', 'LoRA & QLoRA, Visually', 'How low-rank adapters fine-tune billions of params on a gaming GPU.', 35, 'Advanced', 130),
      L('m11-l4', 'Fine-Tuning via APIs', 'OpenAI/Together/Fireworks fine-tuning jobs — the managed path.', 40, 'Advanced', 130),
      L('m11-l5', 'Running Local Models with Ollama', 'Llama and friends on your own machine — your private, free playground.', 40, 'Intermediate', 120),
      L('m11-l6', 'Quantization Basics', 'Q4? GGUF? What the alphabet soup means for quality and speed.', 30, 'Advanced', 120),
      L('m11-l7', 'Serving Fine-Tuned Models', 'vLLM, dedicated endpoints, and cost math vs API models.', 35, 'Advanced', 130),
      L('m11-l8', 'Checkpoint Project: Tune a Support Bot', 'Fine-tune a small model on a support-ticket style dataset and eval it.', 120, 'Advanced', 200),
    ],
  },
  {
    id: 'm12', num: 12, icon: 'Rocket', phase: 7,
    title: 'Production AI Engineering & AI SaaS',
    tagline: 'Ship it: architecture, security, scale, and the business layer',
    lessons: [
      L('m12-l1', 'Architecture of an AI SaaS', 'The reference architecture: frontend, API layer, model gateway, data plane.', 35, 'Advanced', 130),
      L('m12-l2', 'Streaming UX Patterns', 'Optimistic UI, partial rendering, cancellation — chat UX that feels instant.', 35, 'Advanced', 120),
      L('m12-l3', 'Caching & Cost Engineering', 'Prompt caching, semantic caching, and model routing to cut bills 10x.', 35, 'Advanced', 130),
      L('m12-l4', 'Latency Optimization', 'TTFT, speculative UX, parallel calls, and choosing fast-vs-smart models.', 35, 'Advanced', 130),
      L('m12-l5', 'Security: Keys, PII & Injection Defense in Depth', 'The AI-specific threat model your security team will ask about.', 40, 'Advanced', 140),
      L('m12-l6', 'Rate Limiting, Abuse & Moderation', 'Stopping token-draining attacks and unsafe content at the gateway.', 30, 'Advanced', 120),
      L('m12-l7', 'Deployment: Serverless, Containers & Edge', 'Where AI workloads actually run — Vercel, Cloud Run, GPUs and queues.', 40, 'Advanced', 130),
      L('m12-l8', 'Scaling: Queues, Workers & Background Jobs', 'Long-running generations without timeouts — the async architecture.', 40, 'Advanced', 130),
      L('m12-l9', 'Multi-Tenancy, Billing & Usage Metering', 'Per-seat vs usage pricing, token metering, and Stripe integration patterns.', 40, 'Advanced', 130),
      L('m12-l10', 'Capstone: Ship an AI SaaS', 'Design, build, deploy, and monitor a complete AI product — your portfolio centerpiece.', 240, 'Advanced', 300),
    ],
  },
]

/* ---------- derived helpers ---------- */

export const ALL_LESSONS = MODULES.flatMap((m) =>
  m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleNum: m.num, moduleTitle: m.title, modulePhase: m.phase }))
)

export const LIVE_LESSONS = ALL_LESSONS.filter((l) => l.live)

export const getLesson = (id) => ALL_LESSONS.find((l) => l.id === id)

export const getModule = (id) => MODULES.find((m) => m.id === id)

/** Previous / next live lesson relative to `id` (for lesson footer navigation). */
export const adjacentLessons = (id) => {
  const idx = ALL_LESSONS.findIndex((l) => l.id === id)
  return {
    prev: idx > 0 ? ALL_LESSONS[idx - 1] : null,
    next: idx >= 0 && idx < ALL_LESSONS.length - 1 ? ALL_LESSONS[idx + 1] : null,
  }
}

/** The lesson the user should do next: first live lesson not yet completed. */
export const nextUp = (lessonsProgress) =>
  LIVE_LESSONS.find((l) => lessonsProgress[l.id]?.status !== 'completed') ?? null

export const COURSE_STATS = {
  modules: MODULES.length,
  lessons: ALL_LESSONS.length,
  liveLessons: LIVE_LESSONS.length,
  minutes: ALL_LESSONS.reduce((a, l) => a + l.minutes, 0),
  xp: ALL_LESSONS.reduce((a, l) => a + l.xp, 0),
}
