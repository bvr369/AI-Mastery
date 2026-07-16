// Lesson 5.7 — Model Sizes, Scaling & Distillation

export default {
  sections: [
    {
      id: 'what-is-a-B',
      title: 'What "7B vs 70B" actually means',
      blocks: [
        { type: 'p', text: "Model names throw numbers at you: Llama 8B, 70B, 405B; \"a 2-trillion-parameter model.\" That **B** is billions of [[Parameters]] — the learned [[Weights]] inside the network, the numbers that got tuned during pretraining. More parameters means more capacity to store patterns and knowledge. It also means more memory, more compute per token, and a bigger bill. This lesson gives you the intuition to reason about size like an engineer instead of chasing the biggest number." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: brain size isn\'t everything, but it\'s something', text: "Think of parameters as neurons-and-connections. A bigger brain can hold more, connect more, and handle more nuance — up to a point. But a bigger brain is also slower to run, costs more to feed, and is overkill for tying your shoes. You don't hire a world-renowned surgeon to apply a band-aid. Matching model size to task difficulty is the same call — and it's a call you'll make constantly." },
        { type: 'p', text: "Two other numbers travel with parameter count and matter just as much: **training data** (how many tokens the model learned from) and **compute** (how much processing went into training). Quality comes from all three growing together — which is what scaling laws describe." },
      ],
    },
    {
      id: 'scaling-laws',
      title: 'Scaling laws: bigger is (predictably) better',
      blocks: [
        { type: 'p', text: "One of the most consequential findings in modern AI: model quality improves **predictably** as you scale up parameters, data, and compute together. Plot loss against scale and you get a smooth curve, not a lucky jump — which is why labs can *forecast* that a bigger training run will produce a better model before they spend the millions. These are [[Scaling Laws]]." },
        { type: 'diagram', id: 'scaling-curve', caption: 'Quality rises with size but with diminishing returns, while cost and latency climb. Distillation lifts a small model toward big-model quality.' },
        { type: 'p', text: "But notice the shape of that curve: **diminishing returns**. Going from tiny to medium buys enormous quality; going from huge to gigantic buys a sliver — at multiplied cost. And there's a subtlety the first scaling papers missed and [[Chinchilla]]-style analysis corrected: for a given compute budget, many models were *undertrained* — they had too many parameters and too little data. The lesson for you as a consumer: **parameter count alone doesn't rank models.** A well-trained smaller model routinely beats a poorly-trained larger one." },
        { type: 'callout', variant: 'warn', title: 'Don\'t rank models by parameter count', text: "\"It's 70B so it must beat the 8B\" is a trap. Data quality, training recipe, fine-tuning, and architecture matter enormously. A 2024-era 8B model can outclass a 2022-era 70B one. The only ranking that matters is **performance on your task** — which is why you built an eval habit back in Lessons 1.3 and 3.7, and why Module 10 makes it rigorous." },
      ],
    },
    {
      id: 'tradeoff',
      title: 'The size / quality / cost / speed trade-off',
      blocks: [
        { type: 'p', text: "Every model choice sits on four axes that pull against each other. Bigger models climb the quality axis but pay on the other three:" },
        { type: 'table', headers: ['', 'Small (e.g. 8B)', 'Mid (e.g. 70B)', 'Frontier (100B+)'], rows: [
          ['**Quality**', 'good for simple/narrow tasks', 'strong all-rounder', 'best reasoning, hardest tasks'],
          ['**Cost/token**', 'cheapest', 'moderate', 'most expensive'],
          ['**Latency**', 'fastest', 'moderate', 'slowest'],
          ['**Memory**', 'runs on modest GPUs / even laptops', 'needs serious GPUs', 'needs multi-GPU / clusters'],
          ['**Use it for**', 'classification, extraction, routing, high volume', '90% of production traffic', 'the hard 10%: agents, complex reasoning'],
        ] },
        { type: 'p', text: "This is exactly the model-routing intuition from Lessons 1.3 and 1.7, now grounded in *why* the tiers exist. The winning move is almost never \"use the biggest model for everything\" — it's **route by difficulty**: cheap-and-fast for the easy majority, frontier for the hard minority. That single decision often cuts cost 10–20x with no visible quality loss." },
        { type: 'callout', variant: 'info', title: 'Mixture-of-Experts: big capacity, small bill per token', text: "Many frontier models are [[Mixture of Experts]] (MoE): they have huge *total* parameters, but only a small subset of \"expert\" sub-networks activates for any given token. So they get the knowledge capacity of a giant model while paying compute closer to a much smaller one per token. It's why some enormous-on-paper models are surprisingly fast — the parameter count and the per-token compute have decoupled." },
      ],
    },
    {
      id: 'distillation',
      title: 'Why small models got so good: distillation & quantization',
      blocks: [
        { type: 'p', text: "A few years ago, small models were toys. Now an 8B model can handle tasks that needed a frontier model in 2022. Two techniques drove that, and both are tools you can *use* (Module 11), not just admire:" },
        { type: 'list', items: [
          "**[[Distillation]]** — train a small \"student\" model to imitate a large \"teacher\" model's outputs. The student captures much of the teacher's behavior at a fraction of the size, cost, and latency. It's how you get a cheap, fast model that punches far above its parameter count — the arrow lifting the small model in the diagram.",
          "**[[Quantization]]** — store the weights in fewer bits (e.g. 4-bit instead of 16-bit). This shrinks the model and speeds it up with only a small quality cost, and it's why you can run a capable model on a laptop or a single consumer GPU (Module 11's Ollama lesson).",
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: distillation is apprenticeship', text: "A master craftsperson (the big teacher model) is expensive and slow to book. So they take on an apprentice (the small student model) and show them thousands of worked examples. The apprentice never reads everything the master did, but by imitating the master's *outputs* they learn to do most of the same jobs — faster and cheaper. You end up hiring the apprentice for the daily work and reserving the master for the truly hard cases." },
        { type: 'p', text: "The practical upshot: the \"small vs large\" decision is no longer just about raw size. A **distilled, fine-tuned small model** can beat a general frontier model *on a specific task* while costing a fraction to run. That's the sweet spot many production systems chase — and why \"just use GPT-frontier for everything\" is rarely the cost-optimal or even quality-optimal answer at scale." },
      ],
    },
    {
      id: 'pick',
      title: 'Pick a tier with numbers, not vibes',
      blocks: [
        { type: 'p', text: "Let's make the trade-off concrete. This playground estimates monthly cost across tiers for a given volume and recommends the smallest tier that clears a quality bar — the exact reasoning a senior engineer does before committing a model choice." },
        { type: 'playground', id: 'tier-picker', title: 'Model tier cost/quality estimator', height: 380, code: `// Rough per-million-token prices ($ in / $ out) and a quality score per tier.
const TIERS = {
  small:    { label: "Small 8B",    inM: 0.25, outM: 1.25, quality: 72 },
  mid:      { label: "Mid 70B",     inM: 3,    outM: 15,   quality: 88 },
  frontier: { label: "Frontier",    inM: 15,   outM: 75,   quality: 95 },
}

// Your workload:
const callsPerMonth = 2_000_000
const avgInTokens = 500
const avgOutTokens = 200
const qualityNeeded = 85   // minimum quality your task requires

function monthlyCost(t) {
  const inCost = (callsPerMonth * avgInTokens / 1e6) * t.inM
  const outCost = (callsPerMonth * avgOutTokens / 1e6) * t.outM
  return inCost + outCost
}

console.log("tier     | quality | monthly cost | clears bar?")
for (const key of ["small", "mid", "frontier"]) {
  const t = TIERS[key]
  const cost = monthlyCost(t)
  const ok = t.quality >= qualityNeeded ? "yes" : "NO"
  console.log(\`\${t.label.padEnd(9)}| \${String(t.quality).padStart(7)} | \${("$" + cost.toLocaleString()).padStart(12)} | \${ok}\`)
}

// The senior move: cheapest tier that clears the bar.
const winner = ["small","mid","frontier"].map(k=>TIERS[k]).find(t=>t.quality>=qualityNeeded)
console.log("\\nRecommended: " + winner.label + " ($" + Math.round(monthlyCost(winner)).toLocaleString() + "/mo)")`, solution: `// Solution: add difficulty-based ROUTING — send easy calls to small, hard to frontier.
const TIERS = {
  small:    { label: "Small 8B",  inM: 0.25, outM: 1.25, quality: 72 },
  frontier: { label: "Frontier",  inM: 15,   outM: 75,   quality: 95 },
}
const CALLS = 2_000_000, IN = 500, OUT = 200
const hardFraction = 0.15   // only 15% of traffic truly needs the frontier

function cost(t, calls) {
  return (calls*IN/1e6)*t.inM + (calls*OUT/1e6)*t.outM
}

const allFrontier = cost(TIERS.frontier, CALLS)
const routed = cost(TIERS.small, CALLS*(1-hardFraction)) + cost(TIERS.frontier, CALLS*hardFraction)

console.log("everything on frontier: $" + Math.round(allFrontier).toLocaleString() + "/mo")
console.log("routed (85% small / 15% frontier): $" + Math.round(routed).toLocaleString() + "/mo")
console.log("savings: " + (100*(1 - routed/allFrontier)).toFixed(0) + "%  (" +
  (allFrontier/routed).toFixed(1) + "x cheaper)")
// Routing keeps frontier quality WHERE IT MATTERS while most traffic runs cheap.
// This one architectural choice is often the biggest cost lever in an AI product.`, caption: '**Exercise:** the naive answer picks one tier for everything. Add difficulty-based ROUTING — send the easy ~85% of calls to the small model and only the hard ~15% to frontier — and compute the savings vs all-frontier. The solution shows the ~5x win.' },
        { type: 'callout', variant: 'tip', text: "The decision procedure, distilled: (1) define the quality bar with an eval on YOUR task; (2) start at the smallest tier that clears it; (3) route the hard minority up, not the easy majority; (4) consider a distilled/fine-tuned small model if one task dominates your volume. Biggest-model-for-everything is the junior default and the fastest way to a shocking bill." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'What does the "70B" in a model name refer to?',
            options: [
              '70 billion tokens of training data',
              '70 billion parameters — the learned weights in the network',
              '70 billion dollars of training cost',
              'A 70-billion-token context window',
            ],
            answer: 1,
            explain: 'The B is billions of parameters (weights). More parameters means more capacity — but also more memory, compute per token, and cost. Training data and compute are separate (equally important) numbers.',
          },
          {
            q: 'What do scaling laws tell us?',
            options: [
              'Bigger models are always worth the cost',
              'Model quality improves predictably as parameters, data, and compute scale together — with diminishing returns',
              'Small models can never be good',
              'Quality is random with respect to size',
            ],
            answer: 1,
            explain: 'Scaling laws describe a smooth, forecastable improvement with scale, which is why labs can predict a bigger run will be better. Crucially, returns diminish, and undertrained large models can lose to well-trained smaller ones.',
          },
          {
            q: 'Why is "it\'s 70B so it beats the 8B" a flawed assumption?',
            options: [
              'Parameter counts are always fake',
              'Data quality, training recipe, fine-tuning, and recency matter enormously — a well-trained smaller/newer model can outperform a larger/older one; only your-task performance ranks models',
              'Bigger models are actually always worse',
              '8B models can\'t do anything useful',
            ],
            answer: 1,
            explain: 'Parameter count is one factor among many. A modern, well-trained 8B can beat an older 70B. The only ranking that matters is measured performance on your actual task — hence the eval habit.',
          },
          {
            q: 'What is distillation?',
            options: [
              'Compressing weights into fewer bits',
              'Training a small "student" model to imitate a large "teacher" model\'s outputs, capturing much of its quality cheaply',
              'Removing layers from a model at runtime',
              'A prompting technique',
            ],
            answer: 1,
            explain: 'Distillation transfers a big teacher\'s behavior to a small student via imitation — the apprenticeship analogy. It\'s a major reason small models became so capable, and a technique you can apply (Module 11). (Fewer-bits compression is quantization.)',
          },
          {
            q: 'A workload is 2M calls/month; only ~15% genuinely need frontier quality. The cost-optimal architecture is…',
            options: [
              'Run everything on the frontier model for consistency',
              'Route by difficulty: the easy ~85% to a cheap small model, the hard ~15% to frontier — often several times cheaper with no visible quality loss',
              'Run everything on the smallest model and accept the quality hit',
              'Alternate models randomly',
            ],
            answer: 1,
            explain: 'Difficulty-based routing keeps frontier quality where it matters while most traffic runs cheap — typically a multi-x cost cut. Defaulting everything to frontier is the classic overspend; the smallest-that-clears-the-bar-per-request wins.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm5-l7-c1', front: 'What does the "B" in 8B/70B mean, and why does it matter?', back: 'Billions of parameters (learned weights). More = more capacity, but also more memory, compute per token, and cost. Data and compute are separate, equally important numbers.' },
          { id: 'm5-l7-c2', front: 'What do scaling laws say?', back: 'Quality improves predictably as parameters + data + compute scale together, with diminishing returns. Labs can forecast that a bigger run will be better.' },
          { id: 'm5-l7-c3', front: 'Why not rank models by parameter count?', back: 'Data quality, training recipe, fine-tuning, and recency matter hugely — a modern 8B can beat an old 70B. Only performance on YOUR task ranks models.' },
          { id: 'm5-l7-c4', front: 'Distillation vs quantization?', back: 'Distillation: a small student imitates a big teacher\'s outputs (captures quality cheaply). Quantization: store weights in fewer bits (shrink/speed up with small quality loss).' },
          { id: 'm5-l7-c5', front: 'What is Mixture of Experts (MoE)?', back: 'Huge total parameters, but only a few "expert" sub-networks activate per token — big capacity at compute closer to a small model. Decouples size from per-token cost.' },
          { id: 'm5-l7-c6', front: 'The model-selection procedure?', back: 'Define the quality bar with an eval on your task → start at the smallest tier that clears it → route the hard minority up → consider a distilled/fine-tuned small model for dominant workloads.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Parameter count (the "B") is capacity — paid for in memory, compute per token, and cost.',
          '[[Scaling Laws]]: quality rises predictably with scale, but with diminishing returns; count alone doesn\'t rank models.',
          'Four axes trade off — quality vs cost vs latency vs memory; route by difficulty instead of maxing size.',
          '[[Distillation]] and [[Quantization]] made small models punch far above their size — and you can use both.',
          'Pick the smallest tier that clears an eval-defined bar; escalate only the hard minority.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Chasing the biggest model by default', text: 'Frontier-for-everything is the fastest route to a shocking bill and often adds no visible quality on easy tasks. Start small, prove the quality gap with evals, and only escalate where it\'s real.' },
          { title: 'Ranking models by parameter count', text: 'A newer, well-trained, or fine-tuned smaller model frequently beats an older larger one. Numbers on a spec sheet aren\'t a leaderboard — your task\'s eval is.' },
          { title: 'Confusing distillation with quantization', text: 'Distillation trains a small model to imitate a big one (a new model); quantization compresses an existing model\'s weights to fewer bits (same model, smaller). Different tools, different trade-offs — mixing them up muddles Module 11 decisions.' },
          { title: 'Ignoring memory when choosing a model', text: 'Quality and price get the attention, but a model\'s memory footprint decides what hardware it needs and how well it batches (Lesson 5.6). A model you can\'t serve affordably isn\'t a real option, however smart.' },
        ] },
        { type: 'interview', items: [
          { q: '"How do you choose a model size for a production feature?"', a: 'I define a quality bar with an eval on the actual task, then pick the smallest/cheapest tier that clears it rather than defaulting to the biggest. For mixed workloads I route by difficulty — the easy majority to a small fast model, the hard minority to a frontier model — which typically cuts cost multiple-x with no visible quality loss. If one task dominates volume, I consider a distilled or fine-tuned small model tailored to it. Parameter count is an input, not the decision; measured task performance and serving cost are.' },
          { q: '"Why did small models get so much better recently?"', a: 'Mainly better training (higher-quality data, better recipes, proper data-to-parameter ratios per scaling-law corrections like Chinchilla) plus two transfer techniques: distillation, where a small student imitates a large teacher and captures much of its behavior cheaply, and quantization, which shrinks and speeds up models with minimal quality loss so capable models run on modest hardware. Architecturally, MoE also lets models have huge capacity while keeping per-token compute low. The net effect: an 8B today can match a frontier model from a couple of years ago on many tasks.' },
          { q: '"Explain the trade-offs of using a larger model."', a: 'Larger models generally give better quality and reasoning, but they cost more per token, have higher latency, and need more memory — which also hurts batching and thus serving economics (the KV-cache point from Lesson 5.6). Returns diminish, so the marginal quality from going bigger often isn\'t worth the multiplied cost, especially on easy tasks. The right frame is per-request: use the smallest model that clears the bar for THAT request, and reserve the big model for the cases that genuinely need it.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Tiered model routing', text: 'Products like GitHub Copilot and many chat apps route simple requests to fast cheap models and hard ones to frontier models — the cost lever this lesson quantifies.' },
          { title: 'On-device & edge models', text: 'Apple Intelligence and phone assistants run small quantized/distilled models locally for private, instant responses, escalating to server models only when needed.' },
          { title: 'Distilled task models', text: 'Companies distill a frontier model into a small specialist for a high-volume task (classification, extraction), getting near-frontier quality at a fraction of serving cost.' },
          { title: 'Open small models via Ollama', text: 'Quantization lets developers run capable 7–8B models on a laptop for free local development — the practical payoff you\'ll use in Module 11.' },
        ] },
        { type: 'project', title: 'Build the tier-selector', goal: 'Turn the size/cost/quality trade-off into a decision tool you could actually use for a project.', steps: [
          'Model 3 tiers with rough in/out prices and a quality score each (start from the playground values).',
          'Take inputs: monthly call volume, average input/output tokens, and a required quality bar.',
          'Compute monthly cost per tier and recommend the cheapest tier that clears the bar.',
          'Add difficulty-based routing: given a "hard fraction," compute the blended cost of small-for-easy + frontier-for-hard, and compare to all-frontier.',
          'Run it for two contrasting workloads (a high-volume simple task; a low-volume hard task) and write which tier/strategy wins each and why.',
        ], deliverable: 'tier-selector.js that prints per-tier cost, a recommendation, and the routing savings — plus your two-workload analysis.' },
        { type: 'challenge', title: 'Find a real distillation win', text: 'Research one real, public case where a team replaced a large model with a smaller (often distilled or fine-tuned) one in production. In 3–4 sentences, capture: what task, what they switched from/to, and the reported cost/latency/quality outcome. This builds your instinct for when "smaller and specialized" beats "bigger and general."', hints: [
          'Look for engineering blog posts with phrases like "distilled," "fine-tuned a smaller model," or "reduced inference cost."',
          'Classification, extraction, moderation, and routing are the tasks where small specialized models most often win.',
          'The pattern to notice: a narrow, high-volume task is exactly where a distilled small model beats a general frontier one on cost without losing quality.',
        ] },
        { type: 'reading', links: [
          { label: 'Chinchilla / compute-optimal scaling (explainer)', url: 'https://www.lesswrong.com/posts/6Fpvch8RR29qLEWNH/chinchilla-s-wild-implications', note: 'Why data-to-parameter ratio matters and many models were undertrained.' },
          { label: 'Artificial Analysis — model comparison', url: 'https://artificialanalysis.ai', note: 'Live quality vs price vs speed across models — the trade-off, visualized.' },
          { label: 'Distilling the Knowledge in a Neural Network (Hinton et al.)', url: 'https://arxiv.org/abs/1503.02531', note: 'The original distillation paper — skim the intro for the teacher/student idea.' },
        ] },
      ],
    },
  ],
}
