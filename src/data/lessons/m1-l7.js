// Lesson 1.7 — Open vs Closed Models: Choosing Your Stack

export default {
  sections: [
    {
      id: 'the-fork',
      title: 'The biggest fork in AI architecture',
      blocks: [
        { type: 'p', text: "Every AI product hits this decision, usually in week one: **rent intelligence through an API, or download weights and run them yourself?** You met the axis in Lesson 1.3; today you get the full decision framework — the same one senior engineers walk through in system-design interviews." },
        { type: 'diagram', id: 'open-vs-closed', caption: 'Two stacks: rent the frontier vs own the infrastructure.' },
        { type: 'h', text: 'What "closed" really buys you' },
        { type: 'list', items: [
          '**The frontier.** The very best models (Claude Opus, GPT-5-class, Gemini Ultra-class) are closed. If capability is your product, you have no real choice.',
          '**Zero ops.** No GPUs, no CUDA drivers at 3am, no capacity planning. Scaling is the provider\'s problem.',
          '**Instant everything.** New models, vision, tool use — features arrive as API updates.',
        ] },
        { type: 'h', text: 'What "open" really buys you' },
        { type: 'list', items: [
          '**Control.** Your servers, your rules: no deprecations you didn\'t schedule, no policy changes mid-quarter, no rate limits but your own.',
          '**Privacy by architecture.** Data never leaves your network — sometimes a legal requirement, not a preference.',
          '**Flat-cost economics.** GPUs cost the same at 100% utilization. Above a volume threshold, per-token pricing loses badly.',
          '**Deep customization.** Full fine-tuning, quantization, latency surgery — impossible through an API.',
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: cloud vs on-prem, replayed', text: "You've seen this movie: AWS vs your own servers. APIs = cloud (fast start, opex, someone else's pager). Open weights = on-prem (control, capex, your pager). And the industry ending is the same too: **most companies end up hybrid** — cloud for most things, owned infra where economics or compliance demand it." },
      ],
    },
    {
      id: 'decide',
      title: 'Drill: think like a senior engineer',
      blocks: [
        { type: 'p', text: 'Four real-world scenarios, then a cost-crossover calculator. The goal isn\'t memorizing answers — it\'s noticing that **constraints make the choice for you**.' },
        { type: 'demo', id: 'model-picker' },
      ],
    },
    {
      id: 'hybrid',
      title: 'The hybrid endgame (and your default)',
      blocks: [
        { type: 'p', text: "Scaled AI products overwhelmingly converge on a hybrid: **closed frontier models for the hard 20%, cheap models (often open, often fine-tuned) for the easy 80%**, behind a single routing layer. You already saw the code shape in Lesson 1.3 — the router doesn't care whose model is behind each tier." },
        { type: 'code', lang: 'javascript', filename: 'hybrid-gateway.js', code: `// One gateway, many backends — the architecture that keeps you free
const BACKENDS = {
  frontier: { kind: "api", model: "claude-opus-4-8" },
  workhorse: { kind: "api", model: "claude-sonnet-5" },
  bulk: { kind: "self-hosted", url: "http://gpu-pool.internal/v1", model: "llama-70b-ft" },
}

async function complete(tier, messages) {
  const b = BACKENDS[tier]
  // self-hosted servers (vLLM, Ollama) speak the same API dialect on purpose
  return callModel({ baseURL: b.url, model: b.model, messages })
}

// Migrating a tier = editing this object. Nothing else changes.
// THIS is why Lesson 1.3 said: keep the integration thin.`, caption: 'Self-hosted inference servers imitate the big APIs precisely so this gateway pattern works.' },
        { type: 'callout', variant: 'tip', text: "**Your personal default for this course and your first products: start closed, mid-tier.** Validate the product, collect real traffic data, THEN let measured volume/privacy/cost pressure justify complexity. Premature self-hosting is the AI version of premature optimization. (You'll run open models locally with Ollama in Module 11 — for learning and dev, it's genuinely great.)" },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'A fintech startup must guarantee customer data never leaves their infrastructure. Which constraint category is this, and what does it force?',
            options: [
              'A cost constraint — negotiate API discounts',
              'A compliance/privacy constraint — forces self-hosted open weights (or a specialized private deployment)',
              'A quality constraint — forces frontier closed models',
              'No constraint — APIs are always fine',
            ],
            answer: 1,
            explain: 'Data-residency requirements are architectural, not preferential. When data cannot leave, the model must come to the data: open weights on owned infra (or contractual private-cloud arrangements).',
          },
          {
            q: 'Why do most experienced teams START with a closed API even when they expect to self-host later?',
            options: [
              'Open models can\'t do anything useful',
              'Validation speed: prove the product works before buying ops complexity — and collect real traffic data to size the decision',
              'API providers require long contracts',
              'Self-hosting is illegal for startups',
            ],
            answer: 1,
            explain: 'Product risk dominates early: is the feature even valuable? APIs answer that in days. Real usage data then tells you IF and WHERE self-hosting pays. Complexity should be purchased with evidence.',
          },
          {
            q: 'At what point does self-hosting typically beat API pricing?',
            options: [
              'Immediately — GPUs are cheaper than APIs',
              'Never — APIs are always cheaper',
              'At high, STEADY volume where a utilized GPU\'s flat cost undercuts per-token pricing',
              'Only for image models',
            ],
            answer: 2,
            explain: 'The crossover math: GPU costs are flat; API costs scale linearly with tokens. High steady volume → flat wins. Spiky or low volume → per-token wins (idle GPUs burn money). "Steady" matters as much as "high".',
          },
          {
            q: 'The hybrid pattern used by most scaled AI products is…',
            options: [
              'All traffic to the best model money can buy',
              'Frontier closed models for hard tasks, cheap/fine-tuned models for bulk tasks, one routing layer in front',
              'Open models only, for ideological purity',
              'A different provider per feature team',
            ],
            answer: 1,
            explain: 'Route by difficulty: the expensive 20% earns frontier quality; the easy 80% runs on workhorse/self-hosted models. The gateway pattern makes backends swappable per tier.',
          },
          {
            q: 'Your API provider deprecates the model version you use, with 6 months notice. What makes this a non-event for well-built apps?',
            options: [
              'Model names live in config behind a thin gateway, and an eval suite verifies the replacement in an afternoon',
              'Nothing — it\'s always a crisis',
              'Providers never actually deprecate',
              'The lawyers handle it',
            ],
            answer: 0,
            explain: 'The whole module\'s architecture advice pays off here: thin integration + config-driven model names + your own evals = swap, verify, ship. Teams without evals are the ones who fear deprecations.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm1-l7-c1', front: 'The three defensible triggers for self-hosting?', back: '(1) Hard privacy/data-residency requirements, (2) high STEADY volume where flat GPU cost beats per-token pricing, (3) deep customization needs (custom fine-tunes, latency surgery).' },
          { id: 'm1-l7-c2', front: 'What does closed/API buy you?', back: 'The frontier (best models are closed), zero ops, instant feature/model updates. You rent the provider\'s entire infrastructure team.' },
          { id: 'm1-l7-c3', front: 'The cost crossover logic?', back: 'API cost scales per token; GPU cost is flat. High steady volume → self-hosting wins. Low or spiky volume → APIs win (idle GPUs burn money).' },
          { id: 'm1-l7-c4', front: 'The hybrid endgame architecture?', back: 'One gateway, tiered backends: closed frontier for the hard 20%, cheap/open/fine-tuned for the bulk 80%. Backends are config, not code.' },
          { id: 'm1-l7-c5', front: 'The sane default for new products?', back: 'Start closed, mid-tier, thin integration. Let measured volume/privacy/cost pressure justify complexity later — premature self-hosting is premature optimization.' },
          { id: 'm1-l7-c6', front: 'Why do self-hosted servers copy the big APIs\' formats?', back: 'So gateways can swap backends without code changes — vLLM/Ollama speak OpenAI-dialect on purpose. Portability is a feature of the ecosystem.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Closed = rent the frontier, zero ops. Open = control, privacy, flat-cost economics, your pager.',
          'Constraints decide: compliance → open; speed-to-market → closed; quality-is-the-product → closed frontier; huge steady volume → open.',
          'The crossover is economic: per-token vs flat GPU cost — and "steady" matters as much as "high".',
          'Scaled products go hybrid behind one gateway; backends become config.',
          '**Default: start closed, mid-tier, thin integration.** Buy complexity only with evidence.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Self-hosting for vibes', text: '"We should own our AI" without a compliance, volume, or customization trigger buys you GPU bills, ops burden, and a weaker model. The three triggers are the test; if none fires, it\'s premature.' },
          { title: 'Ignoring engineer-hours in the cost math', text: 'The GPU is $1,400/month; the engineer babysitting inference infra is $15,000/month. Honest crossover math counts ops time — it moves the breakeven dramatically rightward.' },
          { title: 'Comparing open vs closed on benchmarks alone', text: 'Leaderboard deltas rarely survive contact with YOUR task. A fine-tuned 8B open model can beat a frontier model on a narrow task — and lose catastrophically outside it. Evaluate on your data (your Lesson 1.3 mini-eval habit).' },
          { title: 'Building thick, provider-shaped integrations', text: 'SDK calls sprinkled across 30 files with provider-specific response parsing everywhere = a rewrite when anything changes. One gateway module, normalized responses, model names in config. Thin is freedom.' },
        ] },
        { type: 'interview', items: [
          { q: '"Design the model-serving strategy for a document-analysis SaaS growing 20% monthly."', a: 'Phase it: (1) Now — closed mid-tier API, thin gateway, evals from day one; growth means nothing if the product doesn\'t stick. (2) At traction — add routing: classify request difficulty, send bulk extraction to a cheap tier, keep complex analysis on frontier. (3) At scale — revisit the crossover with real numbers: if bulk-tier volume is high and steady, trial a fine-tuned open model behind the same gateway; migrate tier by tier with eval gates. Emphasize: architecture stays constant, backends rotate.' },
          { q: '"What are the hidden costs of self-hosting LLMs?"', a: 'Beyond the GPU line item: ops engineering time (deployment, monitoring, upgrades), capacity planning for spiky traffic (idle GPUs or queue latency — pick one), inference optimization work (batching, quantization, KV-cache tuning), security patching, and opportunity cost — that engineering time isn\'t building product. Rule of thumb: real TCO is 2-3x the hardware bill.' },
          { q: '"Our CEO read that open models caught up to closed ones. How do you respond?"', a: 'Partially true and task-dependent: open models are genuinely competitive for many workloads, especially narrow/fine-tuned ones; frontier closed models still lead on hard reasoning, agents, and long-context reliability. The answer isn\'t a headline — it\'s an afternoon: run our eval suite on the candidate open model, compare quality/cost/latency on OUR traffic, decide per tier. (This answer also demonstrates you HAVE an eval suite, which is the real flex.)' },
        ] },
        { type: 'usecases', items: [
          { title: 'Zoom AI Companion', text: 'Publicly hybrid: their own small models for cheap tasks, frontier APIs for hard ones — the gateway pattern at enterprise scale.' },
          { title: 'EU banks & healthcare', text: 'Regulated industries run open models in private clouds — compliance-triggered self-hosting, exactly scenario 2 from the drill.' },
          { title: 'Shopify / e-commerce ML', text: 'Massive steady volumes of product-description and classification tasks — the flat-cost crossover case where fine-tuned open models shine.' },
          { title: 'Every AI startup\'s pitch deck', text: '"Model-agnostic architecture" is now an investor slide — the thin-gateway pattern from this lesson is literally valuation material.' },
        ] },
        { type: 'project', title: 'Write an Architecture Decision Record', goal: 'Practice the professional artifact: an ADR choosing a model strategy for a concrete product, defended with numbers.', steps: [
          'Invent (or borrow from work) a product: e.g. an AI meeting-summarizer for legal teams, 500 customers, 40k meetings/month, transcripts avg 8k tokens.',
          'Estimate monthly token volume (input + output) — show the arithmetic.',
          'Cost both paths using the calculator logic from the demo: API per-token vs GPU nodes + 2x ops overhead. Find your crossover.',
          'Walk the three triggers: privacy (legal transcripts!), volume, customization. Which fire?',
          'Write the ADR: context, options considered, decision, consequences, revisit-when conditions (e.g. "re-evaluate at 100M tokens/month or if a customer demands on-prem").',
        ], deliverable: 'adr-001-model-strategy.md — one page, numbers included, decision defensible.' },
        { type: 'challenge', title: 'Steelman the other side', text: 'Take whatever your ADR concluded and write the strongest honest 5-sentence case for the OPPOSITE choice. If your steelman feels weak, your original analysis probably has blind spots — iterate until both sides sound competent.', hints: [
          'If you chose closed: lean on data leverage, long-term margin, and deprecation risk.',
          'If you chose open: lean on time-to-market, capability gap, and hidden ops TCO.',
          'This is also interview training: "argue the alternative" is a common senior-round question.',
        ] },
        { type: 'reading', links: [
          { label: 'Artificial Analysis — cost & quality explorer', url: 'https://artificialanalysis.ai', note: 'Live crossover math: price vs quality vs speed for open and closed models.' },
          { label: 'vLLM docs', url: 'https://docs.vllm.ai', note: 'The standard open-model serving engine — skim to see what "self-hosting" actually involves.' },
          { label: 'Ollama', url: 'https://ollama.com', note: 'Open models on your laptop in one command — you\'ll use this in Module 11.' },
        ] },
      ],
    },
  ],
}
