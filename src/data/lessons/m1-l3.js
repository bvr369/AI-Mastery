// Lesson 1.3 — The GenAI Landscape: Models, Providers & Modalities

export default {
  sections: [
    {
      id: 'map',
      title: 'A map of the territory',
      blocks: [
        { type: 'p', text: "The AI news cycle is exhausting: a \"game-changing\" model drops every week. Here's the secret — **the map barely changes, only the pins do**. Learn the layers and the categories once, and every future announcement slots neatly into a box you already understand." },
        { type: 'diagram', id: 'genai-stack', caption: 'The stack: you build products on top of APIs; the APIs sit on models; models run on GPUs someone else bought.' },
        { type: 'p', text: "As an AI engineer, you'll live in the top two layers. You will almost never train a model (that costs millions); you'll **choose** models, call them via APIs, and compose them into products. Choosing well requires knowing the three axes every model sits on: **who serves it, what it handles, and what it costs**." },
        { type: 'h', text: 'Axis 1: Closed API vs open weights' },
        { type: 'list', items: [
          "**Closed (API-only):** Claude, GPT, Gemini. You send requests, they return tokens; the [[Weights]] never leave the provider. Best quality, zero ops.",
          "**Open weights:** Llama, Mistral, Qwen, DeepSeek. You can download the model file and run it anywhere — your laptop, your servers. Full control, more work.",
          "This is the single biggest architectural fork in AI products — Lesson 1.7 is entirely about choosing.",
        ] },
        { type: 'h', text: 'Axis 2: Modality' },
        { type: 'p', text: "Text is the center of gravity, but models now read and produce images, audio, and video. [[Multimodal]] models like Claude and GPT-4o accept images *in the same chat API* — which means 'build me an app that reads receipts' is a text-API skill you'll have by Module 2." },
        { type: 'h', text: 'Axis 3: The size/speed/cost triangle' },
        { type: 'p', text: "Every provider ships a family: a **frontier** model (smartest, priciest, slowest), a **mid** model (the workhorse — 90% of production traffic), and a **small** model (fast and cheap, for simple tasks at volume). Production systems route between them: cheap model for easy queries, frontier for hard ones. That routing skill is literally a line item in AI engineer job posts." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: delivery fleet', text: "You don't deliver every package with a semi-truck. Frontier model = semi-truck (heavy lifts), mid model = van (daily routes), small model = bike courier (instant, cheap). Same brand, different vehicles — and the dispatcher (your code) picks per package." },
      ],
    },
    {
      id: 'explore',
      title: 'Explore the landscape',
      blocks: [
        { type: 'p', text: 'Filter the field by access model and modality. Focus on **categories, not versions** — versions rotate monthly; categories have been stable for years.' },
        { type: 'demo', id: 'model-landscape' },
      ],
    },
    {
      id: 'in-code',
      title: 'Why this matters in code',
      blocks: [
        { type: 'p', text: "Here's the punchline for developers: **almost everyone speaks the same two API dialects** (Anthropic's Messages format and OpenAI's Chat Completions format), and open-model servers copy them. Switching providers is usually a config change, not a rewrite:" },
        { type: 'code', lang: 'javascript', filename: 'model-routing.js', code: `// The exact same call shape works across providers & tiers
const MODELS = {
  frontier: "claude-opus-4-8",     // hard reasoning, agents
  workhorse: "claude-sonnet-5",    // 90% of traffic
  fast: "claude-haiku-4-5",        // classification, routing
}

async function ask(tier, messages) {
  return callModel({ model: MODELS[tier], messages, maxTokens: 500 })
}

// Route by difficulty — the #1 production cost optimization
const answer = isSimpleFAQ(question)
  ? await ask("fast", messages)      // ~25x cheaper
  : await ask("frontier", messages)`, caption: 'Model names are config. Routing between tiers is where real products save real money.' },
        { type: 'callout', variant: 'tip', text: "Don't memorize model names or prices — they change quarterly. Memorize the **shape**: every provider has 3 tiers, prices are per-million-tokens, output tokens cost ~3-5x input tokens, and the mid-tier model is almost always the right default." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'As an AI engineer building products, which layers of the stack will you work in?',
            options: [
              'Training models and buying GPUs',
              'Products/apps and the API layer',
              'Only the hardware layer',
              'You must work across all layers equally',
            ],
            answer: 1,
            explain: 'You compose products from models served via APIs. Training and hardware are rented — that\'s the entire economic magic of the API layer.',
          },
          {
            q: 'What does "open weights" actually mean?',
            options: [
              'The model is free to call via API',
              'The training data is public',
              'You can download the parameter file and run the model yourself',
              'The model has no usage restrictions at all',
            ],
            answer: 2,
            explain: 'Open weights = the [[Weights]] file is downloadable and runnable on your own hardware. Training data usually stays private, and licenses can still carry restrictions.',
          },
          {
            q: 'A production system sends simple FAQs to a small model and hard questions to a frontier model. This pattern is called…',
            options: ['Fine-tuning', 'Model routing', 'Prompt chaining', 'Distillation'],
            answer: 1,
            explain: 'Model routing: matching each request to the cheapest model that can handle it. It routinely cuts inference bills 5–20x with no visible quality drop.',
          },
          {
            q: 'Why is switching LLM providers usually cheap for well-built apps?',
            options: [
              'All models share the same weights',
              'Most APIs follow one of two standard message formats, so it\'s mostly config',
              'Providers legally must be interchangeable',
              'It isn\'t — switching always requires a rewrite',
            ],
            answer: 1,
            explain: 'The Anthropic Messages and OpenAI Chat Completions formats dominate, and open-model servers imitate them. Keep model names in config and abstraction thin, and you stay portable.',
          },
          {
            q: 'Which statement about model families is TRUE?',
            options: [
              'The frontier model is the right default for most traffic',
              'Small models are deprecated versions of big ones',
              'Providers ship size tiers; the mid tier handles most production traffic',
              'All tiers cost the same per token',
            ],
            answer: 2,
            explain: 'Frontier for the hardest 10%, mid for the bulk, small for high-volume simple tasks. Defaulting everything to frontier is the classic junior-engineer bill shock.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm1-l3-c1', front: 'The 4 layers of the GenAI stack?', back: 'Products/apps → APIs & platforms → models → compute (GPUs). Engineers build in the top two and rent the rest.' },
          { id: 'm1-l3-c2', front: 'Closed vs open-weights models?', back: '**Closed**: API-only, weights secret (Claude, GPT, Gemini). **Open**: downloadable weights you can self-host (Llama, Mistral, Qwen).' },
          { id: 'm1-l3-c3', front: 'The three model tiers every provider ships?', back: '**Frontier** (smartest/priciest), **mid/workhorse** (production default), **small/fast** (cheap volume tasks).' },
          { id: 'm1-l3-c4', front: 'What is model routing?', back: 'Sending each request to the cheapest model that can handle it — easy queries to small models, hard ones to frontier. Major cost lever.' },
          { id: 'm1-l3-c5', front: 'Why do provider switches rarely require rewrites?', back: 'Two API formats dominate (Anthropic Messages, OpenAI Chat Completions) and open-model servers copy them — model choice becomes config.' },
          { id: 'm1-l3-c6', front: 'What should you memorize about pricing?', back: 'The shape, not numbers: per-million-token pricing, output ~3-5x input cost, mid-tier is the sane default. Specific prices rotate quarterly.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'The stack: products → APIs → models → GPUs. **You build at the top and rent the bottom.**',
          'Three axes place every model: closed vs [[Open Weights]], modality, and size tier.',
          'Every provider ships frontier / workhorse / small tiers — **route between them** to control cost.',
          'Two API dialects dominate; keep model names in config and switching is trivial.',
          'Categories are stable; versions churn. Learn the map, ignore the noise.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Defaulting everything to the frontier model', text: 'The most common cost mistake in AI products. Most requests are easy; the mid tier handles them indistinguishably at a fraction of the price. Start mid, escalate only where evals show a gap.' },
          { title: 'Chasing every model release', text: 'Version-chasing burns weeks on migrations that move quality 2%. Build eval-driven swap discipline instead (Module 10): when a new model ships, run YOUR eval suite, then decide in an afternoon.' },
          { title: 'Hardcoding model names across the codebase', text: 'Scatter `"claude-sonnet-5"` through 40 files and every upgrade is a grep-hunt. One config module, one place to change. This is just the 12-factor app principle applied to AI.' },
          { title: 'Assuming open = free', text: 'The weights are free; the GPUs, ops time, and scaling engineering are decidedly not. Self-hosting below serious volume usually costs MORE than APIs once you count engineer hours.' },
        ] },
        { type: 'interview', items: [
          { q: '"How would you choose between model providers for a new product?"', a: 'Structure: (1) capability requirements — run a quick eval on your actual task, (2) modality needs, (3) cost at projected volume, (4) latency budget, (5) data/compliance constraints, (6) ecosystem fit. Then: start with a mid-tier closed model, keep the integration thin, re-evaluate quarterly. Naming a decision process beats naming a favorite brand.' },
          { q: '"What is the difference between a frontier model and a distilled/small model, practically?"', a: 'Frontier: best reasoning, highest cost/latency — for hard, high-value tasks. Small: often distilled from larger models, great at narrow/simple tasks, 10-50x cheaper and faster — for classification, routing, extraction at volume. Practically you route: small handles the easy 80%, frontier the hard 20%.' },
          { q: '"When would you recommend self-hosting an open model?"', a: 'Three defensible triggers: (1) hard data-residency/privacy constraints, (2) massive steady volume where per-token pricing loses to fixed GPU cost, (3) deep customization needs (custom fine-tunes, latency engineering). Absent those, APIs win on quality and total cost of ownership.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Notion AI', text: 'Runs on API models with routing across tiers — a masterclass in shipping AI features without owning any ML infrastructure.' },
          { title: 'Perplexity', text: 'Mixes frontier API models with their own fine-tuned open models — the hybrid pattern most scaled AI products converge on.' },
          { title: 'Apple Intelligence', text: 'Small on-device models for private/fast tasks, escalating to server models for hard ones — model routing as a consumer product architecture.' },
          { title: 'Your company\'s internal tools', text: 'The classic first AI project: an internal assistant on a mid-tier API model. Zero infra, one sprint, immediate value — and now you know why that\'s the right architecture.' },
        ] },
        { type: 'project', title: 'Landscape scouting report', goal: 'Build the evaluation habit early: compare three models on YOUR tasks, not on Twitter benchmarks.', steps: [
          'Pick 3 free chat AIs you can access (e.g. Claude, ChatGPT, Gemini free tiers).',
          'Design 5 test prompts drawn from your real work: fix a React bug, write a SQL query, draft a client email, summarize a doc, extract JSON from messy text.',
          'Run all 5 on all 3 models. Score each 1-5. Note latency feel and answer style differences.',
          'Write a one-page scouting report: which model won which task, and — more important — which tasks ALL models aced (those are "small model" tasks in production).',
          'Save the 5 prompts. They are the seed of your personal eval suite — you\'ll formalize it in Module 10.',
        ], deliverable: 'scouting-report.md with a 5-task × 3-model score table and your routing recommendation.' },
        { type: 'challenge', title: 'Version archaeology', text: 'Find a "revolutionary" AI model announcement from 18+ months ago (search old tech news). Write 3 sentences: What was claimed? Where does that capability sit in the landscape today (frontier? commodity? free tier?)? What does that tell you about betting your architecture on any specific model?', hints: [
          'Good candidates: any "GPT-4 killer" headline, or image-model launches.',
          'The pattern you should find: yesterday\'s frontier is today\'s mid-tier is tomorrow\'s free tier.',
          'Architecture lesson: build for model *replaceability*, not model loyalty.',
        ] },
        { type: 'reading', links: [
          { label: 'LMArena (Chatbot Arena) leaderboard', url: 'https://lmarena.ai', note: 'Crowd-voted model rankings — the least gameable public benchmark. Check monthly, not daily.' },
          { label: 'Artificial Analysis', url: 'https://artificialanalysis.ai', note: 'Price/speed/quality charts across every major model — the routing decision, visualized.' },
          { label: 'Hugging Face models hub', url: 'https://huggingface.co/models', note: 'Where open weights live. Browse to feel the scale of the open ecosystem.' },
        ] },
      ],
    },
  ],
}
