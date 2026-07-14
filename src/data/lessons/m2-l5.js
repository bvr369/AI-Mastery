// Lesson 2.5 — Temperature, top_p & Sampling Controls

export default {
  sections: [
    {
      id: 'the-knobs',
      title: 'The knobs, finally in your hands',
      blocks: [
        { type: 'p', text: "Lesson 1.2 taught the theory: the model scores every token, then SAMPLES. Today you take the wheel. The API exposes a small set of sampling knobs, and knowing which to turn — and which to leave alone — is a daily production skill. There are exactly four that matter:" },
        { type: 'list', items: [
          '**`temperature`** (0–1 on Anthropic, 0–2 on OpenAI) — reshapes the whole distribution. Low = sharp/predictable, high = flat/creative. THE primary knob.',
          '**`top_p`** — truncates to the smallest set of tokens whose probabilities sum to p, then renormalizes. A quality floor: the weird tail gets cut before sampling.',
          '**`top_k`** — blunter cousin: keep only the k highest-scoring tokens. Less used in APIs, everywhere in local models (Module 11).',
          '**`max_tokens` + `stop` sequences** — not sampling per se, but they bound the loop: budget and brakes (you met both in 2.1).',
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the DJ\'s crate', text: "The model's distribution is a DJ's record crate, sorted by crowd-fit. **Temperature** is how adventurous the DJ feels: low = play the obvious hit; high = deep cuts get real chances. **top_p** removes the bottom of the crate entirely — however adventurous the DJ gets, the polka records are physically gone. Adventure knob + a floor on weirdness: that's the whole system." },
        { type: 'callout', variant: 'warn', text: "The rule the pros follow: **tune temperature OR top_p, not both.** They interact multiplicatively and joint-tuning makes behavior unexplainable. Default: pick temperature for the task, leave top_p at its default (≈1) — unless you're running high temperature and need the safety floor." },
      ],
    },
    {
      id: 'lab',
      title: 'The sampling lab',
      blocks: [
        { type: 'p', text: 'One distribution, three knobs, and a running tally of actual samples. Run the three experiments in the footer — each teaches one production instinct.' },
        { type: 'demo', id: 'sampling-lab' },
      ],
    },
    {
      id: 'per-task',
      title: 'Settings per task: the production cheat sheet',
      blocks: [
        { type: 'table', headers: ['Task', 'temperature', 'Why'], rows: [
          ['Data extraction, classification', '0 – 0.2', 'Same input should give the same label. Variation is a bug here.'],
          ['Code generation', '0 – 0.3', 'There are many valid programs but you want the boring, correct one.'],
          ['Support / factual chat', '0.3 – 0.6', 'Some phrasing variety, zero adventurousness on facts.'],
          ['Marketing copy, brainstorms', '0.8 – 1.0', 'Sameness is the failure mode; you WANT the deep cuts.'],
          ['Character / creative writing', '0.9 – 1.0+', 'Surprise is the product. Consider top_p ≈ 0.9 as the weirdness floor.'],
        ] },
        { type: 'playground', id: 'temp-lab', title: 'Prove it with code', height: 300, code: `// Run the same prompt cold and hot — count distinct outputs.
const prompt = "Name a robot cat"

console.log("--- temperature 0.1 (cold) — expect repetition ---")
for (let i = 0; i < 3; i++) {
  console.log(await llm(prompt, { temperature: 0.1 }))
}

console.log("\\n--- temperature 1.8 (hot) — expect variety ---")
for (let i = 0; i < 3; i++) {
  console.log(await llm(prompt, { temperature: 1.8 }))
}`, solution: `// Exercise solution: measuring variability like an engineer
const prompt = "Name a robot cat"

async function distinctRatio(temperature, runs = 6) {
  const outputs = []
  for (let i = 0; i < runs; i++) outputs.push(await llm(prompt, { temperature }))
  const distinct = new Set(outputs).size
  return { temperature, distinct, runs }
}

for (const t of [0.1, 0.7, 1.8]) {
  const r = await distinctRatio(t)
  console.log(\`temp \${r.temperature}: \${r.distinct}/\${r.runs} distinct outputs\`)
}
// This tiny "variability eval" is a real technique: when a teammate
// says "the bot got repetitive", you MEASURE instead of vibing.`, caption: '**Exercise:** turn the eyeball test into numbers — write distinctRatio(temp) that runs 6 times and counts unique outputs via a Set. Compare 0.1 / 0.7 / 1.8.' },
        { type: 'callout', variant: 'tip', text: "Two footnotes that save future debugging: (1) **temp 0 ≠ bit-identical** — providers don't guarantee determinism even at zero (hardware parallelism); treat it as 'minimal variation', not 'reproducible builds'. (2) Reasoning-mode models often **ignore or forbid** sampling params — check the model's docs before filing a bug." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Your invoice-extraction feature returns slightly different JSON field values on retries of the same document. First knob to check?',
            options: [
              'top_k — raise it',
              'temperature — it should be ~0 for extraction; variation there is a bug, not a feature',
              'max_tokens — raise it',
              'stop sequences',
            ],
            answer: 1,
            explain: 'Extraction wants the argmax answer every time. The cheat sheet row one: deterministic tasks run cold. (Then confirm the model version is pinned, too.)',
          },
          {
            q: 'What EXACTLY does top_p = 0.9 do?',
            options: [
              'Keeps the 90 highest-scoring tokens',
              'Multiplies all probabilities by 0.9',
              'Keeps the smallest set of top tokens whose probabilities sum to 90%, cuts the rest, renormalizes, then samples',
              'Sets temperature to 0.9 internally',
            ],
            answer: 2,
            explain: 'Nucleus sampling: sort tokens by probability, take from the top until you\'ve covered 90% of the mass, discard the tail, renormalize among survivors. The weird 10% tail can never be sampled.',
          },
          {
            q: 'Why is "temp 2 + top_p 0.5" a sensible combo while "tune both carefully together" is an anti-pattern?',
            options: [
              'It isn\'t sensible — never combine them',
              'High temp flattens for creativity while top_p amputates the genuinely broken tail — a floor under the adventure. Joint fine-tuning of both makes behavior multiplicative and unexplainable',
              'top_p only works above temperature 1',
              'The API rejects both together',
            ],
            answer: 1,
            explain: 'The DJ analogy\'s punchline: adventure knob + physical floor. That\'s one deliberate pattern. What bites teams is treating both as free parameters and twiddling them together — attribution becomes impossible.',
          },
          {
            q: 'Someone sets temperature 0 "so the model stops hallucinating". What actually happens?',
            options: [
              'Hallucinations stop',
              'The model refuses more questions',
              'Wrong best-guesses now arrive CONSISTENTLY — determinism, not truth (Module 1 called this)',
              'Latency doubles',
            ],
            answer: 2,
            explain: 'The classic Module-1 fact, now as a knob decision: temperature reshapes probabilities, adds zero knowledge. Cold sampling of a wrong argmax = reliably wrong. Hallucination defenses are Lesson 1.5\'s kit, not this dial.',
          },
          {
            q: 'You need creative product names but keep getting unusable gibberish at temp 1.2. Best single adjustment?',
            options: [
              'temp to 0 — safety first',
              'Add top_p ≈ 0.9 to cut the broken tail while keeping the creative middle',
              'max_tokens higher',
              'Switch to a bigger model immediately',
            ],
            answer: 1,
            explain: 'Exactly the demo\'s third experiment: keep the flat, creative distribution but amputate the tokens that were never going to make sense. Floor under the adventure.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm2-l5-c1', front: 'The four sampling-adjacent knobs?', back: 'temperature (reshape distribution), top_p (nucleus cutoff), top_k (keep k tokens), max_tokens + stop (loop bounds).' },
          { id: 'm2-l5-c2', front: 'top_p in one sentence?', back: 'Keep the smallest top set covering p of the probability mass, discard the tail, renormalize, then sample — a floor on weirdness.' },
          { id: 'm2-l5-c3', front: 'The tune-one rule?', back: 'Tune temperature OR top_p, not both jointly — they interact multiplicatively. Default: pick temperature per task, leave top_p alone.' },
          { id: 'm2-l5-c4', front: 'Production temps: extraction / support / brainstorm?', back: '~0–0.2 / ~0.3–0.6 / ~0.8–1.0. Deterministic tasks run cold; creative tasks run hot with a top_p floor if needed.' },
          { id: 'm2-l5-c5', front: 'Does temp 0 guarantee identical outputs?', back: 'No — providers don\'t promise bit-determinism (hardware parallelism). Treat as "minimal variation", never as reproducible builds.' },
          { id: 'm2-l5-c6', front: 'The DJ analogy?', back: 'Temperature = how adventurous the DJ is; top_p = removing the bottom of the record crate entirely. Adventure knob + physical floor.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Temperature reshapes, top_p truncates, top_k crudely truncates, max_tokens/stop bound the loop.',
          'Tune ONE knob (usually temperature); top_p is the safety floor for hot settings.',
          'Per-task settings are a product decision: cold for machines, warm for chat, hot for creativity.',
          'Temp 0 = consistent, not correct, and not bit-identical.',
          'Measure variability with a distinct-outputs eval instead of vibing.',
        ] },
        { type: 'mistakes', items: [
          { title: 'One global temperature for the whole app', text: 'Your summarize endpoint and your brainstorm endpoint deserve different settings. Temperature belongs next to each feature\'s prompt in config — per-call, not app-wide.' },
          { title: 'Using temperature as a quality dial', text: '"Answers are bad, try 0.9" — temperature changes VARIETY, not intelligence. Bad answers are a prompt, context, or model-choice problem. Diagnose before dialing.' },
          { title: 'Debugging flakiness with the wrong suspect', text: 'Intermittent test failures on LLM outputs? Check temperature FIRST (should be ~0 in tests), then prompt version, then model version. Teams burn days blaming infra for what a sampling knob caused.' },
          { title: 'Copying settings between providers blindly', text: 'Temperature 1.0 means different things on different scales (Anthropic 0–1, OpenAI 0–2), and defaults differ. Port the INTENT (cold/warm/hot), re-verify on the new provider.' },
        ] },
        { type: 'interview', items: [
          { q: '"Explain temperature and top_p like I\'m a backend engineer new to AI."', a: 'The model outputs a probability for every possible next token. Temperature rescales those before sampling: below 1 sharpens toward the favorite (predictable), above 1 flattens (diverse). top_p instead cuts the candidate list to the smallest top group covering p of the probability, so garbage tokens can\'t be drawn at all. Practical guidance: extraction and code near 0; conversation ~0.5; ideation ~0.9 with top_p 0.9 as a floor; tune one, not both.' },
          { q: '"How would you test code whose output comes from an LLM?"', a: 'Layer it: (1) temperature ~0 in tests to minimize variance, (2) assert PROPERTIES not exact strings — parses as JSON, contains required fields, length bounds, (3) golden datasets with semantic similarity or LLM-as-judge scoring for quality (Module 10), (4) pin model versions in CI so upgrades are deliberate. Never expect(text).toBe() — Module 1 explains why that\'s structurally wrong.' },
          { q: '"Product wants \'more creative\' outputs but support wants \'fewer weird\' answers — same model, same app. Reconcile."', a: 'They\'re different endpoints with different sampling configs — this is exactly why temperature is per-call: brainstorm endpoint at 0.9+top_p 0.9, support endpoint at 0.4. Then add a variability eval for each (distinct-ratio + quality scores) so \'more creative\' and \'less weird\' become measured dials, not vibes. One model, many personalities, all in config.' },
        ] },
        { type: 'usecases', items: [
          { title: 'GitHub Copilot', text: 'Code completion runs very cold — the boring correct completion beats the interesting wrong one. Your cheat-sheet row two, shipped to millions.' },
          { title: 'Jasper / copywriting tools', text: '"Generate 10 variations" buttons are literally hot-temperature loops — variety IS the feature being sold.' },
          { title: 'Midjourney-style "chaos" params', text: 'Image models expose the same concept under different names — the sampling-knob intuition transfers across modalities.' },
          { title: 'A/B testing bot personalities', text: 'Same prompt at 0.3 vs 0.7 measurably changes user ratings of "helpfulness" vs "personality" — teams tune this with real experiments.' },
        ] },
        { type: 'project', title: 'The settings advisor', goal: 'Build a tiny CLI that recommends and demonstrates sampling settings for a described task — cementing the cheat sheet into code.', steps: [
          'Create advisor.js: takes a task description ("extract emails from text", "write taglines").',
          'Classify the task into cold/warm/hot with simple keyword rules (extract/parse/classify → cold; chat/support → warm; write/brainstorm/name → hot).',
          'Print the recommended config object: { temperature, top_p?, rationale }.',
          'Demo mode: run the user\'s task 3x through your Lesson 2.1 API setup at the recommended temp AND at the opposite extreme; print both sets side by side.',
          'Ship it with 5 example runs in the README showing sensible recommendations.',
        ], deliverable: 'advisor.js + README with example outputs proving the recommendations make visible sense.' },
        { type: 'challenge', title: 'Find the phase change', text: 'Using the sampling-lab demo (or your API), find the temperature where output quality *collapses* for a creative prompt — the point where "pleasantly surprising" becomes "word salad". Binary-search it in 0.1 steps and report the number with three examples from each side of the cliff.', hints: [
          'The lab\'s tally histogram shows it statistically: watch when "chaos" starts winning meaningful share.',
          'With real APIs, the cliff is typically somewhere in 1.3–1.9 (OpenAI scale) — but finding YOUR task\'s cliff is the skill.',
          'Meta-lesson: defaults exist because someone did this search. Now you can redo it for any new model in ten minutes.',
        ] },
        { type: 'reading', links: [
          { label: 'Anthropic API reference — sampling parameters', url: 'https://docs.anthropic.com/en/api/messages', note: 'Exact ranges, defaults, and the tune-one-knob advice, from the source.' },
          { label: 'The Illustrated GPT-2 — sampling section', url: 'https://jalammar.github.io/illustrated-gpt2/', note: 'Visual refresher connecting today\'s knobs to Module 1\'s loop.' },
        ] },
      ],
    },
  ],
}
