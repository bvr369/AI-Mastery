// Lesson 1.2 — Next-Token Prediction: How LLMs Actually Work

export default {
  sections: [
    {
      id: 'prediction-machine',
      title: 'A prediction machine, not a thinking machine',
      blocks: [
        { type: 'p', text: "Last lesson's claim — *\"an LLM just predicts the next token\"* — sounds too simple to produce ChatGPT. This lesson makes it concrete, because once this loop clicks, **every AI engineering concept downstream makes sense**: temperature, context windows, hallucination, cost, streaming, even agents." },
        { type: 'p', text: "First, what's a [[Token]]? Models don't read letters or words — text is chopped into chunks by a tokenizer. Common words are one token (`the`, `react`); rarer words split (`hallucinate` → `hall` + `ucin` + `ate`). Rule of thumb: **1 token ≈ 4 characters ≈ ¾ of an English word**. You pay per token, limits are in tokens, and models literally think in them (deep dive in Lesson 5.4)." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the improv actor', text: "An LLM is an improv actor mid-scene. It doesn't plan the story's ending — at each beat it asks, *\"given everything said so far, what's the most fitting next word?\"* — says it, and moves on. Astonishing coherence can emerge one beat at a time. So can confident nonsense, delivered with the same straight face." },
        { type: 'h', text: 'The loop, precisely' },
        { type: 'list', items: [
          '**1 · Read the context** — every token so far: your system prompt, the conversation, everything.',
          '**2 · Score every possible next token** — the model outputs a probability for *each* token in its ~100k-token vocabulary. This is the expensive step, one full forward pass through the network.',
          '**3 · Sample one token** — pick from the distribution. *How* you pick is where [[Temperature]] and [[top_p]] live.',
          '**4 · Append & repeat** — the chosen token joins the context; loop until a stop token. Streaming UIs show tokens the moment step 3 finishes — that\'s why answers "type themselves out".',
        ] },
        { type: 'callout', variant: 'warn', text: "This is also why [[Hallucination]] exists: the model **must** emit a next token — outputting *something plausible* is its only move. When it lacks knowledge, plausible ≠ true. There is no built-in \"I don't know\" unless training or your prompt encourages it." },
      ],
    },
    {
      id: 'the-loop',
      title: 'The loop, visualized',
      blocks: [
        { type: 'p', text: 'Watch one full cycle: context flows into the model, the model scores candidates, one gets sampled (green), and it loops back to join the context. This animation is the beating heart of every AI product you will ever build.' },
        { type: 'diagram', id: 'next-token-loop', caption: 'One cycle ≈ one token. A 500-word answer is ~700 trips around this loop — that\'s also why long answers cost more and stream gradually.' },
      ],
    },
    {
      id: 'play',
      title: 'Drive the loop yourself',
      blocks: [
        { type: 'p', text: "This toy predictor exposes the machinery real chat UIs hide: live probabilities and a working temperature dial. The math is a **real softmax** — the same formula inside production models. Try finishing the sentence at temperature 0.1, then at 2.0." },
        { type: 'demo', id: 'next-token' },
        { type: 'p', text: "What you just felt: **low temperature** sharpens the distribution (top token nearly always wins — predictable, safe, repetitive), **high temperature** flattens it (underdogs get real chances — creative, surprising, riskier). There is no single 'best' setting; it's a product decision you'll make per feature in Module 2." },
      ],
    },
    {
      id: 'math-lite',
      title: 'The only math you need (it fits in one function)',
      blocks: [
        { type: 'p', text: "You promised yourself no scary math — here's the deal: the *one* formula worth knowing is `softmax`, and it's four lines of JavaScript. The model outputs raw scores (**logits**); softmax turns them into probabilities that sum to 1. Temperature is just a divisor applied first:" },
        { type: 'code', lang: 'javascript', filename: 'softmax.js', code: `// Raw scores from the model for a few candidate tokens
const logits = { building: 3.4, writing: 2.6, breaking: 1.5, dreaming: 0.3 }

function softmax(scores, temperature = 1.0) {
  const scaled = Object.values(scores).map((s) => Math.exp(s / temperature))
  const sum = scaled.reduce((a, b) => a + b, 0)
  return Object.keys(scores).map((token, i) => ({
    token,
    probability: scaled[i] / sum,
  }))
}

console.table(softmax(logits, 1.0))
// building 62% · writing 28% · breaking 9% · dreaming 1%

console.table(softmax(logits, 0.2))   // cold: rich get richer
// building 98% · writing 2% · everything else ~0%

console.table(softmax(logits, 2.0))   // hot: everyone gets a shot
// building 41% · writing 28% · breaking 16% · dreaming 9%`, caption: 'Dividing by temperature before exp() is the entire trick. Cold → sharp distribution. Hot → flat distribution.' },
        { type: 'p', text: "And sampling from those probabilities is the weighted-random-pick you've written a dozen times for loot drops and A/B tests:" },
        { type: 'code', lang: 'javascript', filename: 'sample.js', code: `function sample(distribution) {
  let r = Math.random()
  for (const { token, probability } of distribution) {
    r -= probability
    if (r <= 0) return token
  }
  return distribution[0].token // float-rounding fallback
}

// The whole "generate" loop you saw in Lesson 1.1:
// while (!done) { context += sample(softmax(model(context), temp)) }`, caption: 'Congratulations — you now understand text generation end to end.' },
        { type: 'callout', variant: 'tip', text: "Map it to the API params you'll use constantly in Module 2: `temperature` reshapes the distribution *before* sampling · `top_p` trims the candidate pool to the smallest set covering p probability mass · `max_tokens` caps loop iterations · `stop` sequences break the loop early." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'During generation, what does the model compute at EVERY single step?',
            options: [
              'The full remaining answer, then reveals it gradually',
              'A probability for every token in its vocabulary',
              'A database lookup for matching text',
              'Only the top-5 most likely words',
            ],
            answer: 1,
            explain: 'Each step is one forward pass producing a score for **every** vocabulary token (~100k of them). Then one is sampled, appended, and the whole thing runs again. Nothing is planned ahead.',
          },
          {
            q: 'Setting temperature close to 0 makes the model…',
            options: [
              'Smarter and more accurate about facts',
              'Almost always pick the highest-probability token',
              'Respond faster because it skips computation',
              'Use fewer tokens per answer',
            ],
            answer: 1,
            explain: "Low temperature **sharpens** the distribution — the top token dominates. Output gets predictable and repetitive, but not more *truthful*: if the most probable continuation is wrong, you'll now get that wrong answer consistently.",
          },
          {
            q: 'Roughly how many tokens is the sentence "React state updates are asynchronous" (5 words, 38 characters)?',
            options: ['2', '9', '38', '190'],
            answer: 1,
            explain: 'Rule of thumb: 1 token ≈ 4 characters, so ~38 chars ≈ 9–10 tokens. Thinking in tokens matters because **cost, latency, and context limits are all measured in them**.',
          },
          {
            q: 'Why do chat UIs "type out" responses word by word?',
            options: [
              'A CSS animation to feel friendly',
              'The server throttles bandwidth on purpose',
              'Tokens genuinely become available one loop-iteration at a time',
              'To give moderators time to review content',
            ],
            answer: 2,
            explain: 'Streaming shows each token as its loop iteration completes. It\'s not theater — generation is genuinely sequential, and streaming hides total latency by showing progress immediately (a UX pattern you\'ll build in Module 2).',
          },
          {
            q: 'Which failure is a DIRECT consequence of "the model must always emit a plausible next token"?',
            options: [
              'Rate limit errors under heavy traffic',
              'Hallucinating a convincing but fake library API',
              'Timeouts on very long prompts',
              'Refusing to answer safe questions',
            ],
            answer: 1,
            explain: 'When the model lacks real knowledge, the most probable continuation is *plausible-sounding text* — like an API that looks exactly how such an API **would** look if it existed. The loop has no built-in truth check.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm1-l2-c1', front: 'The 4 steps of the generation loop?', back: '**Read** context → **score** every vocabulary token → **sample** one → **append** & repeat until a stop token.' },
          { id: 'm1-l2-c2', front: 'What is a token, roughly?', back: 'The unit models read/write. ≈ 4 characters ≈ ¾ of an English word. Cost, limits, and context windows are all measured in tokens.' },
          { id: 'm1-l2-c3', front: 'What does temperature actually do?', back: 'Divides the logits before softmax. **Low** → sharp distribution (predictable). **High** → flat distribution (creative/risky). It reshapes probabilities — it does not add knowledge.' },
          { id: 'm1-l2-c4', front: 'What is softmax?', back: 'The function that turns raw scores (logits) into probabilities summing to 1: `exp(score/T)` for each, divided by the total.' },
          { id: 'm1-l2-c5', front: 'Why does streaming exist?', back: 'Generation is genuinely token-by-token, so UIs show each token as its loop iteration finishes — perceived latency drops massively.' },
          { id: 'm1-l2-c6', front: 'Why is hallucination structural, not a bug?', back: 'The loop must always emit a next token. Without the knowledge, the most probable continuation is plausible-sounding text — and plausible ≠ true.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Generation = a loop: read context → score all tokens → **sample one** → append → repeat.',
          'Tokens are the currency: ~4 chars each; cost, speed, and context limits are token-denominated.',
          '[[Temperature]] reshapes the probability distribution (cold = sharp, hot = flat). `softmax(logits / T)` — four lines of JS.',
          'Streaming UIs mirror the real token-by-token loop; nothing is pre-written.',
          'Hallucination is structural: the loop always emits *something plausible*, knowledge or not.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Believing temperature 0 = truth mode', text: "Low temperature makes output *consistent*, not *correct*. If the model's best guess is wrong, temp 0 serves that wrong answer with maximum confidence, every time." },
          { title: 'Counting words instead of tokens', text: 'Budgets, truncation bugs, and "why was I billed this much" all trace back to word-vs-token confusion. Punctuation, code, and non-English text tokenize expensively. Use a tokenizer playground before guessing.' },
          { title: 'Thinking the model plans its whole answer', text: 'It commits one token at a time with no ability to revise earlier output. This explains rambling answers and why asking for reasoning *before* the conclusion (Module 3) measurably improves quality.' },
          { title: 'Cranking temperature for "better" answers', text: "Temperature is a style knob, not a quality knob. Factual tasks: low (0–0.3). Brainstorming: higher (0.8–1.2). If quality is the problem, fix the prompt or the model choice, not the dial." },
        ] },
        { type: 'interview', items: [
          { q: '"Walk me through how an LLM generates a response, step by step."', a: 'Tokenize the input → one forward pass produces logits over the whole vocabulary → apply temperature/top_p and softmax → sample one token → append it to the context → repeat until a stop token or max_tokens. Mention streaming falls out of this naturally and that each step is a full forward pass (why long outputs cost time and money).' },
          { q: '"Explain temperature and top_p to a junior engineer."', a: 'Temperature rescales logits before softmax: <1 sharpens (predictable), >1 flattens (diverse). top_p instead truncates the candidate set to the smallest group whose probabilities sum to p, then renormalizes. Rule of thumb: tweak one, not both; low for extraction/code, higher for ideation.' },
          { q: '"Why can\'t an LLM reliably do arithmetic like 47,283 × 9,156?"', a: "It predicts digit-shaped text from patterns; it has no calculator circuit executing an algorithm. Small sums appear memorized/pattern-matched, big ones fail. Production fix: give the model a calculator **tool** and let it call it — tool use, Module 8." },
          { q: '"Your product\'s AI answers vary too much between runs. Diagnose and fix."', a: 'Likely high temperature or loose prompting. Fixes in order: drop temperature toward 0, constrain output format (JSON schema/structured output), tighten the prompt with examples, add evals to quantify variance. Also note providers don\'t guarantee bit-identical outputs even at temp 0.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Streaming chat UX', text: 'Every chat product streams because generation is sequential — you\'ll build token-by-token React rendering in Module 2, Lesson 4.' },
          { title: 'Temperature per feature', text: 'Real products ship different temperatures per endpoint: ~0 for SQL generation and data extraction, ~0.7 for marketing copy, ~1 for brainstorming tools.' },
          { title: 'Cost engineering', text: 'Since every output token is a forward pass, verbose answers are literally expensive. Prompt instructions like "answer in under 50 words" are cost optimizations, not just style.' },
          { title: 'Code autocomplete', text: 'Copilot-style tools run this exact loop at very low temperature over your buffer — predictability beats creativity when completing your code.' },
        ] },
        { type: 'project', title: 'Build a tiny text generator', goal: "Implement the full generation loop yourself in JavaScript — softmax, temperature, sampling — over a mini word-level 'model' you build from any text you like.", steps: [
          'Grab any long text (a README, a book chapter from Project Gutenberg). Split it into words.',
          'Build a frequency map: for each word, count which words follow it and how often. `{ "react": { "component": 12, "state": 9, ... } }` — congratulations, that\'s a (Markov) language model.',
          'Write `softmax(counts, temperature)` exactly like this lesson\'s snippet, and `sample(distribution)`.',
          'Write the loop: start from a seed word, generate 30 words. Log the top-3 candidates and their probabilities at each step so you can *watch* the distribution.',
          'Run it at temperature 0.1, 1.0, and 2.0. Save one output of each. Notice the cold one loops/repeats and the hot one goes unhinged — the exact trade-off real models have.',
        ], deliverable: 'A `generator.js` (or small React page) that prints three sample outputs at three temperatures, plus your one-paragraph observation.', },
        { type: 'challenge', title: 'Explain it back', text: "The real test of this lesson: write (or record) a 60-second explanation of how ChatGPT works, aimed at a designer friend. It must correctly use *token*, *probability*, and *sampling* — and must NOT use the words 'magic', 'thinks', or 'knows'.", hints: [
          'Structure: what a token is (5s) → the scoring loop (25s) → sampling & temperature (20s) → why it sometimes lies (10s).',
          'The improv-actor analogy is yours to steal.',
          'If you catch yourself saying "it understands…", rephrase as "it predicts…" and see if the sentence still holds.',
        ] },
        { type: 'reading', links: [
          { label: 'LLM Visualization — Brendan Bycroft', url: 'https://bbycroft.net/llm', note: 'A jaw-dropping 3D walkthrough of a real model doing exactly this loop. 20 minutes well spent.' },
          { label: 'The Illustrated GPT-2 — Jay Alammar', url: 'https://jalammar.github.io/illustrated-gpt2/', note: 'The classic visual explainer — perfect prep for Module 5.' },
          { label: 'OpenAI Tokenizer playground', url: 'https://platform.openai.com/tokenizer', note: 'Paste your own text, see real tokens. Do this once and token math sticks forever.' },
        ] },
      ],
    },
  ],
}
