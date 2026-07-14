// Lesson 5.5 — Sampling Strategies: Greedy, Beam, top-k, top-p

export default {
  sections: [
    {
      id: 'the-last-step',
      title: 'The model gives you odds — decoding places the bet',
      blocks: [
        { type: 'p', text: "Back in Lesson 1.2 you learned the generation loop: read context → score every token → **sample one** → append → repeat. We waved a hand at step 3 (*\"pick from the distribution\"*) and moved on. This lesson opens that box. Because the model does **not** hand you a word — it hands you a probability for every one of its ~100k vocabulary tokens. Turning that cloud of odds into a single concrete token is a separate algorithm called **decoding** (or a **sampling strategy**), and it's entirely your choice." },
        { type: 'p', text: "This matters more than it sounds. The exact same model, on the exact same prompt, can be a boring parrot or an unhinged poet purely based on which decoding strategy you pick. The `temperature`, `top_p`, and `top_k` knobs you met in Module 2 aren't magic — they *are* these strategies, exposed as API params. By the end you'll know precisely what each one does to the distribution." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the weather forecast vs. your umbrella', text: "The model is a meteorologist: it tells you *70% rain, 20% cloudy, 10% sun*. That's the [[Softmax]] output — a probability distribution. But the forecast doesn't decide whether you pack an umbrella. **You** do, using a rule: *\"always assume the likeliest\"* (greedy), *\"roll the dice weighted by the odds\"* (sampling), or *\"only consider outcomes above 10%\"* (top-p/top-k). The forecast is fixed; the *decision rule* is the decoding strategy — and it changes everything downstream." },
        { type: 'h', text: 'From logits to probabilities (the 30-second recap)' },
        { type: 'p', text: "Every strategy starts from the same place: the model emits raw scores called **logits**, one per token. [[Softmax]] exponentiates and normalizes them into probabilities that sum to 1. **Temperature** is a divisor applied to the logits *before* softmax — low temperature sharpens the distribution (rich get richer), high temperature flattens it (underdogs get a real shot). Decoding strategies then operate on that probability distribution. Keep this pipeline in your head:" },
        { type: 'code', lang: 'javascript', filename: 'pipeline.js', code: `// logits  ->  (÷ temperature)  ->  softmax  ->  probabilities  ->  DECODE
//  raw        reshape the odds       normalize    sum to 1.0       pick a token
//
// Temperature reshapes the distribution.
// Greedy / beam / top-k / top-p decide how to PICK from it.
// They are orthogonal: you almost always combine a temperature WITH a sampling strategy.` },
        { type: 'callout', variant: 'info', text: "Mental model for the whole lesson: **temperature = how peaked the mountain range is; decoding = how you choose which peak to stand on.** Two separate dials that combine." },
      ],
    },
    {
      id: 'greedy-and-beam',
      title: 'Greedy & Beam — the "just take the best" family',
      blocks: [
        { type: 'h', text: 'Greedy: always grab the single most likely token' },
        { type: 'p', text: "**Greedy decoding** is the simplest possible rule: at each step, take the `argmax` — the token with the highest probability — and never look back. It's deterministic (same prompt → same output every time), fast (no random draw, no bookkeeping), and equivalent to `temperature = 0` with no sampling. Sounds ideal? It has a nasty failure mode." },
        { type: 'p', text: "Greedy is **locally** optimal but **globally** short-sighted. Picking the best token *right now* can paint you into a corner where every following token is mediocre. In practice greedy output is bland, and worse, it **loops**: *\"I think that I think that I think that…\"* Once the model lands in a high-probability rut, argmax keeps it there forever, because the repetitive token really is the most probable one." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: hiking by always stepping uphill', text: "Greedy is a hiker who, at every step, takes the steepest upward step available. It reliably climbs *a* hill — but usually a small nearby one, never the mountain across the valley, because reaching the mountain required stepping *down* first. Greedy can't sacrifice a low-probability token now to reach a great sequence later. That short-sightedness is its whole personality." },
        { type: 'h', text: 'Beam search: keep several bets alive at once' },
        { type: 'p', text: "**Beam search** fixes greedy's tunnel vision by tracking the top-**B** *sequences* (the \"beam width\") instead of committing to one token. At each step it expands every candidate sequence by every possible next token, scores each resulting sequence by its **cumulative** probability (the product of its token probabilities), and keeps only the best B. At the end it returns the sequence with the highest total likelihood — not just the one that looked best token-by-token." },
        { type: 'p', text: "This genuinely maximizes **whole-sequence** probability better than greedy, which is exactly what you want for **closed-ended** tasks with a single correct-ish answer: machine translation, summarization, grammar correction, speech-to-text. There the goal is *the most probable faithful rendering*, and beam finds it." },
        { type: 'callout', variant: 'warn', title: 'Beam search is notoriously bland for open-ended text', text: "Here's the counterintuitive part that trips people up in interviews: **the most probable sequence is often the most boring one.** Human writing is full of mildly surprising word choices; the single highest-likelihood continuation tends toward generic, safe, repetitive text (\"I don't know what you mean. I don't know what you mean.\"). So beam search is *great* for translation and *terrible* for storytelling, chat, or brainstorming. It's also **expensive** — B times the compute of greedy — and can still loop without extra penalties." },
        { type: 'table', headers: ['Strategy', 'Deterministic?', 'Optimizes', 'Best for', 'Weakness'], rows: [
          ['Greedy', 'Yes', 'Next token only', 'Fast deterministic tasks, code, extraction', 'Bland, loops, locally short-sighted'],
          ['Beam (B)', 'Yes', 'Whole-sequence likelihood', 'Translation, summarization, closed tasks', 'Generic for open text, B× cost, can loop'],
        ] },
      ],
    },
    {
      id: 'topk-topp',
      title: 'top-k & top-p — the "sample, but sensibly" family',
      blocks: [
        { type: 'p', text: "Greedy and beam chase the *most likely* text. But great open-ended writing needs **controlled randomness** — sampling weighted by the probabilities so output is varied and human. The catch: pure sampling from the full distribution occasionally draws a genuinely terrible token (there are ~100k of them, and the long tail of garbage collectively holds real probability mass). top-k and top-p are two ways to **truncate that tail** before sampling, so you get variety without the rare disasters." },
        { type: 'h', text: 'top-k: sample among the k most likely tokens' },
        { type: 'p', text: "**top-k** sorts the tokens by probability, keeps only the top **k** (say k=40), renormalizes their probabilities to sum to 1, and samples from just those. The other ~99,960 tokens are zeroed out — no chance of drawing gibberish. Simple and effective. Its flaw is that **k is fixed** regardless of the distribution's shape." },
        { type: 'callout', variant: 'info', text: "Why fixed k is a problem: when the model is **confident** (one token at 95%), k=40 drags in 39 junk tokens that shouldn't get any chance. When the model is **uncertain** (50 tokens all plausible), k=40 wrongly chops off good candidates. One fixed number can't fit both situations — which is exactly what top-p fixes." },
        { type: 'h', text: 'top-p (nucleus): sample from the smallest set covering p of the mass' },
        { type: 'p', text: "**top-p**, a.k.a. **nucleus sampling**, is the smarter cousin. Instead of a fixed count, you pick a probability mass **p** (say 0.9). Sort tokens high→low, then walk down the list accumulating probability until you've covered **p** of the total mass. That set — the *nucleus* — is your candidate pool; renormalize and sample. The pool **adapts to the distribution's shape** automatically." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: packing for a trip by weight, not by count', text: "top-k says *\"pack exactly 40 items\"* — dumb whether you're going camping or to a wedding. top-p says *\"pack the fewest items that cover 90% of what I'll actually need.\"* Confident forecast (one dominant token)? The nucleus might be just 2-3 tokens — tight and safe. Wide-open forecast (many plausible tokens)? The nucleus expands to 50+ tokens — creative and varied. **Same p, different pool size, because it responds to how sure the model is.** That adaptivity is why top-p is the modern default." },
        { type: 'p', text: "This is why nearly every production chat API defaults to top-p sampling with a temperature, not greedy or beam. It threads the needle: varied and human like full sampling, but with the toxic long tail clipped off." },
        { type: 'callout', variant: 'tip', title: 'How temperature interacts with all of them', text: "Temperature reshapes the distribution *before* the strategy truncates it. Crank temperature up and the distribution flattens, so top-p's nucleus grows (more tokens clear the bar) → wilder output. Push temperature toward 0 and the distribution spikes, so the nucleus shrinks to basically one token → top-p quietly becomes greedy. That's why **temperature 0 is deterministic no matter what top_p you set** — there's nothing left to sample from." },
      ],
    },
    {
      id: 'the-race',
      title: 'Watch all four race',
      blocks: [
        { type: 'p', text: "Theory locked in — now *see* it. This demo runs greedy, beam, top-k, and top-p **side by side** on the same distribution, with a live temperature slider. Watch how greedy and beam march out identical, safe text while top-k and top-p wander into more varied territory — and how cranking temperature widens the gap. Drag the slider to 0 and watch all four collapse toward the same deterministic output." },
        { type: 'demo', id: 'sampling-race' },
        { type: 'p', text: "The thing to feel here: at **low temperature** the four strategies converge (a spiked distribution gives everyone the same obvious pick). As temperature rises, they **diverge** — greedy/beam stay anchored to the peak while the samplers explore the widening tail. Decoding strategy matters *most* precisely when the model is unsure, which is precisely when open-ended creativity lives." },
      ],
    },
    {
      id: 'code-and-play',
      title: 'Implement them yourself',
      blocks: [
        { type: 'p', text: "Reading beats hand-waving. Here's the essence of each strategy as pseudocode — notice they all start from the same softmax'd distribution and differ only in *how they narrow and pick*:" },
        { type: 'code', lang: 'python', filename: 'strategies.py', code: `import numpy as np

def softmax(logits, temperature=1.0):
    z = np.array(logits) / temperature
    z = z - z.max()                 # numerical stability
    e = np.exp(z)
    return e / e.sum()

def greedy(logits):
    # Always the argmax — deterministic, no randomness.
    return int(np.argmax(logits))

def top_k(logits, k=40, temperature=1.0):
    probs = softmax(logits, temperature)
    idx = np.argsort(probs)[::-1][:k]        # k most likely token indices
    keep = probs[idx]
    keep = keep / keep.sum()                 # renormalize the survivors
    return int(np.random.choice(idx, p=keep))

def top_p(logits, p=0.9, temperature=1.0):
    probs = softmax(logits, temperature)
    order = np.argsort(probs)[::-1]          # high -> low
    cumulative = np.cumsum(probs[order])
    # smallest nucleus whose mass reaches p (keep the token that crosses p)
    cutoff = np.searchsorted(cumulative, p) + 1
    idx = order[:cutoff]
    keep = probs[idx] / probs[idx].sum()
    return int(np.random.choice(idx, p=keep))

# Beam search tracks the top-B *sequences* by cumulative log-prob, not one token —
# it needs the model in the loop to expand each candidate, so it lives in generate().`, caption: 'The whole family in ~25 lines. Only the "which tokens survive" line differs between top-k and top-p.' },
        { type: 'p', text: "Now run it. This playground implements greedy, top-k, and top-p over a tiny toy distribution with a **real softmax** and a temperature knob — the same math production models use. Run it a few times: greedy never changes, the samplers do. Then push the temperature up and watch the samplers get adventurous." },
        { type: 'playground', id: 'sampling-lab', title: 'Greedy vs top-k vs top-p, live', height: 460, code: `// A tiny vocabulary with raw model scores (logits) for the next token.
const logits = {
  cat:    3.2,   // clear favorite
  dog:    2.9,
  bird:   1.8,
  fish:   1.2,
  lizard: 0.4,
  rock:  -1.5,   // the long tail: implausible junk
}

const TEMP = 0.8   // <-- try 0.2 (safe) then 1.5 (wild)

function softmax(scores, temperature) {
  const vals = Object.values(scores).map((s) => Math.exp(s / temperature))
  const sum = vals.reduce((a, b) => a + b, 0)
  return Object.keys(scores)
    .map((token, i) => ({ token, p: vals[i] / sum }))
    .sort((a, b) => b.p - a.p)   // high -> low
}

function greedy(dist) {
  return dist[0].token          // argmax: the single most likely token
}

function sampleFrom(pool) {
  const total = pool.reduce((a, x) => a + x.p, 0)
  let r = Math.random() * total // renormalize on the fly
  for (const x of pool) { r -= x.p; if (r <= 0) return x.token }
  return pool[0].token
}

function topK(dist, k) {
  return sampleFrom(dist.slice(0, k))          // fixed-size pool
}

function topP(dist, p) {
  const pool = []
  let acc = 0
  for (const x of dist) {
    pool.push(x); acc += x.p
    if (acc >= p) break                        // smallest nucleus covering p
  }
  return sampleFrom(pool)
}

const dist = softmax(logits, TEMP)
console.log("distribution @ temp " + TEMP + ":")
dist.forEach((x) => console.log("  " + x.token.padEnd(7) + (x.p * 100).toFixed(1) + "%"))

console.log("\\ngreedy  ->", greedy(dist), "(same every run)")
console.log("top-k=3 ->", topK(dist, 3))
console.log("top-p=0.9 nucleus size:", (() => { let a=0,n=0; for(const x of dist){n++;a+=x.p;if(a>=0.9)break} return n })(), "tokens")
console.log("top-p=0.9 ->", topP(dist, 0.9))`, solution: `// Run each sampler 1000x and print how often each token wins.
const logits = { cat: 3.2, dog: 2.9, bird: 1.8, fish: 1.2, lizard: 0.4, rock: -1.5 }
const TEMP = 1.5   // hot: watch the tail come alive

function softmax(scores, temperature) {
  const vals = Object.values(scores).map((s) => Math.exp(s / temperature))
  const sum = vals.reduce((a, b) => a + b, 0)
  return Object.keys(scores).map((token, i) => ({ token, p: vals[i] / sum })).sort((a, b) => b.p - a.p)
}
function sampleFrom(pool) {
  const total = pool.reduce((a, x) => a + x.p, 0)
  let r = Math.random() * total
  for (const x of pool) { r -= x.p; if (r <= 0) return x.token }
  return pool[0].token
}
function tally(fn, n = 1000) {
  const counts = {}
  for (let i = 0; i < n; i++) { const t = fn(); counts[t] = (counts[t] || 0) + 1 }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
    .map(([t, c]) => t + ":" + (c / n * 100).toFixed(0) + "%").join("  ")
}

const dist = softmax(logits, TEMP)
console.log("top-k=3   ", tally(() => sampleFrom(dist.slice(0, 3))))
console.log("top-p=0.9 ", tally(() => {
  const pool = []; let acc = 0
  for (const x of dist) { pool.push(x); acc += x.p; if (acc >= 0.9) break }
  return sampleFrom(pool)
}))
// See it: top-k=3 can NEVER emit fish/lizard/rock; top-p includes more of the
// tail at high temp because the flattened distribution needs more tokens to reach 0.9.`, caption: '**Exercise:** change `TEMP` from 0.8 to 0.2, then to 1.5, and re-run. At 0.2, what is the top-p nucleus size and why does it shrink? Then open the solution to run each sampler 1000× and see the actual win-rate distribution.' },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: "You're shipping a machine-translation feature: given a French sentence, output the single best English rendering. Which decoding strategy fits best?",
            options: [
              'top-p at temperature 1.2 for variety',
              'Beam search — it maximizes whole-sequence likelihood, ideal for closed tasks with a best answer',
              'Pure sampling from the full distribution',
              'top-k with a very large k',
            ],
            answer: 1,
            explain: "Translation is closed-ended: there's essentially one faithful answer, and you want the most probable *sequence*, not per-token greed. Beam search tracks the top-B sequences by cumulative probability — exactly this goal. Sampling would inject unwanted randomness into a task that has a right answer.",
          },
          {
            q: 'Your chatbot keeps producing loops like "I can help with that. I can help with that." at temperature 0. What is the root cause?',
            options: [
              'The API is bugged',
              'Greedy decoding (temp 0) always takes the argmax, and once a repetitive token is the most probable, it stays stuck there',
              'The context window is too small',
              'top_p is set too high',
            ],
            answer: 1,
            explain: "Temperature 0 = greedy = pure argmax, which is locally optimal and can't escape a high-probability rut. The looping token genuinely is the most likely next token, so greedy picks it forever. Fixes: raise temperature, use top-p sampling, or add a repetition penalty.",
          },
          {
            q: 'What is the key advantage of top-p (nucleus) over top-k?',
            options: [
              'top-p is always faster to compute',
              'top-p uses no randomness, so output is reproducible',
              "top-p adapts its candidate-pool size to the distribution's shape; top-k's pool is a fixed count regardless of confidence",
              'top-p ignores temperature entirely',
            ],
            answer: 2,
            explain: "top-k keeps a fixed number of tokens whether the model is confident or unsure — dragging in junk when it's confident, chopping good options when it's uncertain. top-p keeps the smallest set covering p of the mass, so the pool shrinks when the model is sure and grows when it's not. That adaptivity is the whole point.",
          },
          {
            q: 'A teammate sets `temperature: 0` AND `top_p: 0.95`, expecting creative output. What actually happens?',
            options: [
              'The two settings average out to moderate creativity',
              'Output is deterministic and safe — temperature 0 spikes the distribution to one token, so there is nothing for top_p to sample from',
              'The API throws an error for conflicting params',
              'top_p overrides temperature, giving varied output',
            ],
            answer: 1,
            explain: "Temperature is applied first and 0 collapses the distribution onto a single token (argmax). top_p then selects a nucleus of… that one token. The result is greedy/deterministic regardless of top_p. To get creativity you need temperature > 0 so multiple tokens survive into the nucleus.",
          },
          {
            q: 'For a brainstorming tool that should feel varied and human but never emit outright gibberish, the standard recipe is:',
            options: [
              'Greedy decoding at temperature 0',
              'Beam search with a large beam width',
              'top-p (e.g. 0.9-0.95) combined with a moderate-to-high temperature (e.g. 0.8-1.1)',
              'Pure unfiltered sampling from all ~100k tokens',
            ],
            answer: 2,
            explain: "top-p clips the toxic long tail (no gibberish) while a moderate-high temperature keeps the surviving distribution varied and human. This is the production default for open-ended chat and ideation. Greedy/beam are too bland; unfiltered sampling occasionally draws garbage from the tail.",
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm5-l5-c1', front: 'What is decoding (a sampling strategy)?', back: 'The algorithm that turns the model\'s next-token **probability distribution** into one concrete token. Separate from the model itself — greedy, beam, top-k, and top-p are the main choices.' },
          { id: 'm5-l5-c2', front: 'Greedy decoding — what and why it fails', back: 'Take the `argmax` (single most likely token) every step. Deterministic and fast, equals temp 0. Fails by being **locally short-sighted**: bland and prone to **loops**.' },
          { id: 'm5-l5-c3', front: 'Beam search — what it optimizes and its blind spot', back: 'Tracks the top-**B** sequences by **cumulative** probability, returns the most likely whole sequence. Great for **closed tasks** (translation). Blind spot: the most probable text is **generic/bland**, so it\'s poor for open-ended writing. Also B× cost.' },
          { id: 'm5-l5-c4', front: 'top-k vs top-p', back: '**top-k**: sample among the k most likely tokens (fixed count). **top-p / nucleus**: sample from the smallest set covering p of the probability mass (**adaptive** count). top-p adjusts to how confident the model is; top-k can\'t.' },
          { id: 'm5-l5-c5', front: 'How does temperature interact with decoding?', back: 'Temperature reshapes the distribution *before* the strategy truncates it. High temp flattens → bigger top-p nucleus → wilder. Temp 0 spikes it → nucleus of one → **deterministic regardless of top_p**.' },
          { id: 'm5-l5-c6', front: 'When to use which strategy?', back: 'Deterministic/extraction/code → **greedy** (temp 0). Translation/summarization → **beam**. Creative/chat/brainstorm → **top-p (~0.9) + temperature (~0.8-1.1)**. The API params ARE these strategies.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'The model outputs a probability distribution; **decoding** is the separate algorithm that picks one token from it. Your choice, not the model\'s.',
          '**Greedy** = argmax every step: deterministic, fast, but bland and loops. **Beam** = top-B sequences by cumulative probability: best for closed tasks (translation), notoriously generic for open text, B× cost.',
          '**top-k** samples among the k most likely tokens (fixed pool); **top-p / nucleus** samples the smallest set covering p of the mass (adaptive pool) — the modern default.',
          '**Temperature** reshapes the distribution *before* decoding truncates it; temp 0 makes everything deterministic regardless of top_p.',
          'The API `temperature` / `top_p` / `top_k` params literally ARE these strategies — deterministic tasks → greedy, translation → beam, creative → top-p + temperature.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Setting temperature 0 and top_p together for creativity', text: "Temperature is applied first; 0 collapses the distribution to a single token, leaving top_p nothing to sample from. The result is deterministic. If you want variety, temperature must be > 0. The two knobs aren't additive — temperature gates whether top_p has anything to work with." },
          { title: 'Using beam search for chat or storytelling', text: "Beam maximizes total sequence probability, and the most probable text is generic, repetitive, safe. It's a fantastic translator and a boring novelist. For open-ended generation, sampling (top-p + temperature) beats beam on *perceived quality* even though beam wins on raw likelihood." },
          { title: 'Treating top-k as adaptive', text: "A fixed k=40 wastes slots on junk when the model is confident and amputates good candidates when it's uncertain. If you find yourself tuning k per prompt, you actually want top-p, which sizes the pool automatically from the distribution's shape." },
          { title: 'Blaming the model for looping when greedy is the culprit', text: "Repetitive loops at temperature 0 aren't a model bug — they're greedy decoding stuck in the argmax rut. The fix is decoding-side: raise temperature, switch to top-p, or add a repetition/frequency penalty. Don't reach for a bigger model first." },
        ] },
        { type: 'interview', items: [
          { q: '"Explain the difference between top-k and top-p sampling."', a: "Both truncate the distribution before sampling to avoid drawing garbage from the long tail. top-k keeps a **fixed number** of the most likely tokens (say 40), renormalizes, and samples. top-p (nucleus) keeps the **smallest set whose probabilities sum to p** (say 0.9) — so the pool size *adapts* to the distribution. When the model is confident the top-p nucleus might be 2 tokens; when it's uncertain it might be 60. That adaptivity is why top-p is the common production default over top-k." },
          { q: '"Why is beam search great for translation but bad for open-ended text generation?"', a: "Beam search maximizes whole-**sequence** likelihood by keeping the top-B candidate sequences. Translation is closed-ended — there's essentially one faithful answer — so the most probable sequence is the right one. But for open-ended text, the single most probable sequence is generic and repetitive, because natural human writing is full of mildly *improbable* word choices. So the thing beam optimizes for (max likelihood) is anti-correlated with what feels creative. That's why chat and storytelling use sampling instead." },
          { q: '"A user reports our chatbot repeats itself in loops. How do you debug it?"', a: "First check the decoding config. Looping is the signature of greedy decoding (temperature 0 / argmax) getting stuck: once a repetitive token is the most probable, argmax picks it forever. Fixes in order of least-invasive: raise temperature above 0, switch to top-p sampling so lower-probability escapes are possible, and/or add a repetition or frequency penalty that down-weights already-emitted tokens. Only if all that fails do I suspect the prompt or model. It's almost always a decoding setting, not the model itself." },
          { q: '"How do temperature and top_p interact — should I tune both?"', a: "Temperature reshapes the distribution *before* top_p truncates it, so they're not independent. High temperature flattens the distribution, which makes top_p's nucleus larger (more tokens clear the mass threshold) → more varied output. Temperature 0 spikes it to one token, so top_p becomes irrelevant — output is deterministic regardless. General advice: tune **one** primary knob to avoid confusing interactions. Most teams fix top_p around 0.9-0.95 and use temperature as the main creativity dial." },
        ] },
        { type: 'usecases', items: [
          { title: 'Code generation & autocomplete', text: "Copilot-style tools decode at temperature 0 / near-greedy: when completing your buffer you want the single most probable, predictable continuation, not creative surprises. Determinism is a feature here." },
          { title: 'Machine translation & summarization', text: "Production translation systems (and many summarizers) use beam search with a modest beam width to find the most probable faithful rendering — a closed task where max-likelihood is exactly the goal." },
          { title: 'Creative & conversational assistants', text: "Chat, story tools, and brainstorming features default to top-p (~0.9-0.95) with a moderate-high temperature, clipping the gibberish tail while keeping output varied and human-feeling." },
          { title: 'Structured / extraction endpoints', text: "JSON extraction, classification, and SQL generation run at temperature 0 (greedy) so the same input always yields the same parseable output — reproducibility beats variety for machine-consumed responses." },
        ] },
        { type: 'project', title: 'The four-strategy shootout', goal: "Implement all four decoding strategies over a provided toy distribution sequence and compare their outputs across temperatures — turning the abstract knobs into felt intuition.", steps: [
          'Build a tiny word-level toy \"model\": a small map from each word to a set of next-word logits (5-8 words is plenty). This gives you a real per-step distribution to decode from.',
          'Implement `greedy`, `topK(k)`, `topP(p)`, and a simple `beam(B)` (track the top-B sequences by cumulative log-probability over ~6 steps). Reuse the softmax + sample helpers from this lesson\'s playground.',
          'Generate a short sequence with each strategy, printing the top-3 candidate tokens and their probabilities at each step so you can *watch* the pool narrow.',
          'Run greedy/top-k/top-p at temperatures **0.2, 0.7, and 1.5** and save one output of each into a 3×3 grid. Log beam separately (it ignores temperature by design).',
          'Write one paragraph: at which temperature do the samplers start diverging from greedy? Did beam produce something noticeably more \"complete\" but blander than top-p? Note where each strategy would win in a real product.',
        ], deliverable: 'A `decoding-shootout.js` (or Python) that prints the strategy × temperature grid, plus your one-paragraph observation on when each strategy wins.' },
        { type: 'challenge', title: 'Beam beats greedy, and top-p beats both', text: "Craft a small toy distribution sequence (you control the per-step logits) that demonstrates two things at once: (1) beam search finds a full sequence with **higher total probability** than greedy — because greedy takes a locally-best token that forces low-probability tokens afterward; and (2) top-p produces text a human would rate as more natural/varied than either, despite lower raw likelihood. Print the cumulative log-probability of each strategy's output to prove point 1 numerically, and eyeball point 2.", hints: [
          "For point 1, design a step where the greedy pick (say 0.6) leads only to bad continuations (all ~0.1), while the runner-up (0.4) opens into a great one (0.9). Greedy's total: 0.6×0.1; beam explores the 0.4×0.9 path and wins.",
          "Track cumulative probability as a **sum of log-probs**, not a product — products of many small numbers underflow to zero. `logP += Math.log(p)`.",
          "For point 2, a distribution with several near-equal plausible tokens is where greedy/beam look robotic (always the same pick) and top-p's variety reads as human. Perceived quality and raw likelihood genuinely diverge here — that's the whole insight.",
        ] },
        { type: 'reading', links: [
          { label: 'How to generate text (Hugging Face blog)', url: 'https://huggingface.co/blog/how-to-generate', note: 'The canonical, code-first walkthrough of greedy, beam, top-k, and top-p with real examples. Read this one first.' },
          { label: 'The Curious Case of Neural Text Degeneration (nucleus sampling paper)', url: 'https://arxiv.org/abs/1904.09751', note: 'Holtzman et al. — the paper that introduced top-p and showed *why* max-likelihood decoding produces bland, degenerate text.' },
          { label: 'Hugging Face — Generation strategies docs', url: 'https://huggingface.co/docs/transformers/main/en/generation_strategies', note: 'The practical reference: every decoding param mapped to the `generate()` API, with when-to-use guidance.' },
        ] },
      ],
    },
  ],
}
