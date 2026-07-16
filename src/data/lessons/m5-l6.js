// Lesson 5.6 — KV Cache & Why Long Context Is Expensive

export default {
  sections: [
    {
      id: 'the-puzzle',
      title: 'The puzzle: fast per token, yet long context is pricey',
      blocks: [
        { type: 'p', text: "You've felt it: a chatbot answers a short question in a flash, but paste in a 50-page document and the *first word* takes noticeably longer — and the bill jumps more than the token count alone would suggest. Both facts come from one piece of machinery: the [[KV Cache]]. Understanding it turns \"long context is expensive\" from a vague warning into a number you can reason about." },
        { type: 'p', text: "Recall from Module 1 that generation is **autoregressive**: the model produces one [[Token]] at a time, and each new token is predicted from *all* the tokens before it. The naive way to do that is brutal: to generate token 100, re-read tokens 1–99; to generate token 101, re-read tokens 1–100; and so on. That's the same work done over and over — quadratic total cost in the sequence length." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: re-reading the whole book for every sentence', text: "Imagine writing a novel where, before adding each new sentence, you re-read the entire book from page one to remind yourself what happened. Sentence 500 means 499 re-reads of everything. Absurd — a real writer keeps a running memory and only glances back. The KV cache is that running memory: the model stashes what it computed about earlier tokens so it never re-derives them." },
        { type: 'p', text: "Why does the model need to look back at all? [[Attention]] (Lesson 5.2). Each new token attends to every previous token, and attention needs each earlier token's **key** and **value** vectors. Those K and V vectors don't change once a token is in the past — so computing them again every step is pure waste. Cache them once, reuse them forever." },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How the cache works',
      blocks: [
        { type: 'p', text: "The name is literal: the cache stores the **K**ey and **V**alue vectors for every token the model has already processed. When a new token arrives, the model computes only *its* Q, K, and V, appends the new K/V to the cache, and lets the new token attend to the whole cache. No recomputation of the past — each generation step becomes roughly constant work instead of growing work." },
        { type: 'diagram', id: 'kv-cache', caption: 'Without a cache, every step re-processes the whole history (quadratic). With the cache, each step computes only the new token and reuses stored K/V — but the cache grows with context.' },
        { type: 'p', text: "This is why the two phases of a request feel so different:" },
        { type: 'list', items: [
          "**Prefill** — processing your prompt to fill the cache the first time. This is a big batch of work proportional to prompt length, and it's what you wait through before the *first* token appears. Long prompt → slower [[TTFT]].",
          "**Decode** — generating each new token afterward. Fast and steady, because the cache is doing the remembering. This is why tokens stream out at a smooth clip once they start.",
        ] },
        { type: 'callout', variant: 'info', title: 'The catch that costs money', text: "The cache is fast, but it isn't free: it **grows with every token**, and it lives in precious GPU memory. A long context means a large KV cache sitting in VRAM the entire time. That memory competes with everything else the GPU is doing — most importantly, it limits how many requests can be batched together. Fewer concurrent requests per GPU = higher cost per request. So long context costs more not just in tokens, but in the memory footprint it holds hostage." },
      ],
    },
    {
      id: 'simulate',
      title: 'Simulate the cost',
      blocks: [
        { type: 'p', text: "Numbers make it click. This playground counts the \"work units\" to generate a sequence **with** and **without** the cache, so you can watch quadratic and linear growth pull apart. The cached version does dramatically less total work — that gap is the whole reason the KV cache exists." },
        { type: 'playground', id: 'kv-cost-sim', title: 'Cached vs uncached generation cost', height: 380, code: `// Model the per-step work of generating N tokens.
// Attention work at step t is proportional to how many tokens you process.
const N = 20

// WITHOUT a cache: at step t you re-process all t tokens -> work = t
// WITH a cache: at step t you process only the 1 new token -> work = 1
//   (it still ATTENDS to t cached tokens, but reusing stored K/V is cheap
//    compared to recomputing them; we model the expensive recompute here.)

let uncached = 0
let cached = 0
console.log("step | uncached work | cached work")
for (let t = 1; t <= N; t++) {
  const uStep = t        // re-derive K/V for all t tokens
  const cStep = 1        // derive K/V for just the new token
  uncached += uStep
  cached += cStep
  if (t % 4 === 0) console.log(\`\${String(t).padStart(4)} | \${String(uStep).padStart(13)} | \${String(cStep).padStart(11)}\`)
}

console.log("\\n--- totals over " + N + " tokens ---")
console.log("uncached total work:", uncached, "  (grows like N^2 / 2)")
console.log("cached total work:  ", cached, "  (grows like N)")
console.log("speedup:", (uncached / cached).toFixed(1) + "x")`, solution: `// Solution: also track the cache MEMORY footprint, the hidden cost.
const N = 20
const BYTES_PER_TOKEN_KV = 200 * 1024   // ~200 KB/token is realistic for a mid-size model

let uncached = 0, cached = 0
const rows = []
for (let t = 1; t <= N; t++) {
  uncached += t
  cached += 1
  const cacheMB = (t * BYTES_PER_TOKEN_KV) / (1024 * 1024)   // cache grows every step
  rows.push({ t, uStep: t, cacheMB: +cacheMB.toFixed(1) })
}

console.log("step | uncached/step | KV cache size")
for (const r of rows) if (r.t % 4 === 0)
  console.log(\`\${String(r.t).padStart(4)} | \${String(r.uStep).padStart(13)} | \${r.cacheMB} MB\`)

console.log("\\nTotal compute saved by caching:", (uncached / cached).toFixed(1) + "x")
console.log("But cache memory GREW to:", rows[N-1].cacheMB, "MB and stays resident.")
console.log("At 100k tokens that same rate would be ~" +
  ((100000 * BYTES_PER_TOKEN_KV) / (1024**3)).toFixed(1) + " GB of VRAM — hence long context is a hardware feat.")`, caption: '**Exercise:** extend the simulator to also track the cache MEMORY footprint (assume ~200 KB of K/V per token) — showing that the cache trades compute for a growing memory bill. The solution scales it to a 100k-token context.' },
        { type: 'code', lang: 'python', filename: 'where_the_cache_lives.py', code: `# Pseudocode: where the cache slots into attention during decode.
def decode_step(new_token, kv_cache):
    q, k, v = project(new_token)          # compute Q,K,V for the NEW token only

    kv_cache.keys.append(k)               # remember this token's K...
    kv_cache.values.append(v)             # ...and V, forever

    # attend over the WHOLE history using cached K/V (no recompute of the past)
    scores = softmax(q @ stack(kv_cache.keys).T)
    context = scores @ stack(kv_cache.values)

    return context                        # -> feed forward -> next-token logits
# The past tokens are never re-projected. That is the entire optimization.`, caption: 'Each step appends one K/V pair and reuses all the others. Past tokens are never recomputed.' },
      ],
    },
    {
      id: 'what-you-can-feel',
      title: 'What this means for your bill and UX',
      blocks: [
        { type: 'p', text: "This isn't just GPU trivia — it explains three things you'll hit as an AI engineer, and one lever you can pull:" },
        { type: 'table', headers: ['You observe', 'The KV cache explains it', 'What to do'], rows: [
          ['Long prompts have slow first-token latency', 'Prefill must process the whole prompt to build the cache before decoding starts', 'Keep prompts lean; stream so users see progress once decode begins'],
          ['Long context costs more than raw token pricing implies', 'The big resident cache limits batching, raising effective cost per request', 'Send only relevant context ([[RAG]], Module 6) instead of dumping everything'],
          ['Repeated system prompts feel wasteful', 'The same prefix rebuilds the same KV cache every call', 'Use **prompt caching** — providers cache the KV for a stable prefix'],
          ['1M-token context is a headline feature', 'Holding a 1M-token KV cache in VRAM is genuinely hard engineering', 'Appreciate that huge context is powerful but not free — use it deliberately'],
        ] },
        { type: 'callout', variant: 'tip', title: 'Prompt caching = renting the KV cache', text: "Remember prompt caching from Lesson 2.8? Now you know what it *is*: the provider keeps the KV cache for a stable prefix (your long system prompt, your RAG context, a big document) so the next call skips re-prefilling it — often 5–10x cheaper and faster on that prefix. Structure prompts so the **stable stuff comes first** (system prompt, reference docs) and the variable stuff (the user's new question) comes last. That ordering is literally an optimization for the KV cache." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Without a KV cache, why does generating a long sequence get expensive so fast?',
            options: [
              'The model runs out of vocabulary',
              'Each new token re-processes all previous tokens, so total work grows quadratically with length',
              'Temperature increases with length',
              'The context window shrinks each step',
            ],
            answer: 1,
            explain: 'Autoregressive generation predicts each token from all prior ones. Re-deriving the whole history every step is O(N) work per step and O(N²) overall — the re-reading-the-whole-book problem the cache fixes.',
          },
          {
            q: 'What exactly does the KV cache store?',
            options: [
              'The final text output so far',
              'The key and value vectors of every already-processed token, so attention can reuse them without recomputing',
              'The model\'s weights',
              'The user\'s previous conversations',
            ],
            answer: 1,
            explain: 'It caches each past token\'s K and V vectors. Those don\'t change once a token is in the past, so storing and reusing them turns growing per-step work into roughly constant per-step work.',
          },
          {
            q: 'A user pastes a huge document and complains the answer takes a few seconds to START. Which phase is responsible?',
            options: [
              'Decode — generating each token is slow',
              'Prefill — the whole prompt must be processed to build the cache before the first token can be produced',
              'Tokenization overflow',
              'The softmax step',
            ],
            answer: 1,
            explain: 'Prefill processes the entire prompt to fill the KV cache; its cost scales with prompt length and gates time-to-first-token. Decode (per-token generation) is fast and steady once it starts.',
          },
          {
            q: 'Why does long context cost more than the raw per-token price suggests?',
            options: [
              'Providers charge a surcharge for long prompts arbitrarily',
              'The large resident KV cache consumes GPU memory, limiting how many requests batch together — fewer concurrent requests per GPU raises effective cost',
              'Long context uses a bigger model automatically',
              'It does not — cost is exactly linear in tokens',
            ],
            answer: 1,
            explain: 'The cache lives in VRAM and grows with context. A big cache means fewer requests fit on a GPU at once, so the fixed hardware is shared across fewer requests — driving up per-request cost beyond the token count alone.',
          },
          {
            q: 'You have a long, stable system prompt reused on every call. The KV-cache-informed optimization is…',
            options: [
              'Lower the temperature',
              'Use prompt caching and put the stable prefix FIRST so its KV cache can be reused across calls',
              'Split it into many small calls',
              'Increase max_tokens',
            ],
            answer: 1,
            explain: 'Prompt caching stores the KV cache for a stable prefix so repeat calls skip re-prefilling it. Ordering stable content first (system prompt, docs) and variable content last maximizes the reusable prefix — a direct KV-cache optimization.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm5-l6-c1', front: 'Why is naive autoregressive generation quadratic?', back: 'Each new token re-processes all previous tokens (O(N) per step, O(N²) total) — like re-reading the whole book before every sentence.' },
          { id: 'm5-l6-c2', front: 'What does the KV cache store, and why?', back: 'The key & value vectors of every past token. They don\'t change once a token is in the past, so caching and reusing them avoids recomputation — turning growing per-step work into ~constant.' },
          { id: 'm5-l6-c3', front: 'Prefill vs decode?', back: 'Prefill processes the whole prompt to build the cache (gates time-to-first-token, scales with prompt length). Decode generates each new token fast and steady using the cache.' },
          { id: 'm5-l6-c4', front: 'The hidden cost of the KV cache?', back: 'It grows with context and lives in GPU memory. A big cache limits batching (fewer concurrent requests per GPU), which raises effective cost per request.' },
          { id: 'm5-l6-c5', front: 'Why does long context cost more than token pricing implies?', back: 'The large resident cache holds VRAM hostage, reducing how many requests batch on a GPU — so the fixed hardware serves fewer requests at once.' },
          { id: 'm5-l6-c6', front: 'What IS prompt caching, mechanically?', back: 'The provider keeps the KV cache for a stable prefix so repeat calls skip re-prefilling it (5–10x cheaper/faster on that prefix). Put stable content first to maximize it.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Generation is autoregressive; naively re-processing history each step is quadratic.',
          'The [[KV Cache]] stores past tokens\' key/value vectors and reuses them — per-step work becomes ~constant.',
          'Prefill (build the cache from the prompt) gates time-to-first-token; decode (per-token) is fast.',
          'The cache grows with context and eats GPU memory, limiting batching — the real reason long context costs more.',
          'Prompt caching = reusing the KV cache for a stable prefix; order prompts stable-first to exploit it.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Assuming cost is purely linear in tokens', text: 'Token pricing is the visible part; the KV cache\'s memory footprint quietly raises the cost of long context by limiting batching. Budget long-context features expecting worse-than-linear economics, and prefer retrieving only relevant context.' },
          { title: 'Ignoring prefill when reasoning about latency', text: 'Teams optimize decode speed and forget that a giant prompt makes prefill (and thus time-to-first-token) slow. If first-token latency is bad, look at prompt length before blaming the model.' },
          { title: 'Putting variable content before stable content', text: 'Prepending the user\'s changing question in front of a stable system prompt/doc defeats prompt caching — the cacheable prefix ends at the first thing that changes. Stable first, variable last.' },
          { title: 'Treating 1M-token context as free real estate', text: 'A million-token cache is a serious hardware ask. Huge context is a capability, not an invitation to dump everything — retrieval (RAG) usually beats brute-forcing the whole corpus into context.' },
        ] },
        { type: 'interview', items: [
          { q: '"What is a KV cache and why does it matter?"', a: 'During autoregressive decoding, each new token attends to all previous tokens, which need their key/value vectors. Since past tokens\' K/V don\'t change, the model caches them and reuses them instead of recomputing — turning O(N²) generation into roughly O(N). The trade-off is memory: the cache grows with sequence length and occupies GPU VRAM, which limits batch size and thus drives serving cost. It also explains prefill vs decode: prefill builds the cache from the prompt (gating time-to-first-token), decode reuses it (fast per token).' },
          { q: '"Why does long context increase cost more than the token count suggests?"', a: 'Two reasons beyond token pricing. First, prefill cost scales with prompt length, slowing time-to-first-token. Second and bigger: the KV cache for a long context is large and resident in GPU memory for the whole request, so fewer requests batch onto each GPU. The fixed hardware is amortized over fewer concurrent requests, raising effective per-request cost. That\'s why serving 200k-token contexts is disproportionately expensive, and why retrieval to keep context small is a cost lever, not just a quality one.' },
          { q: '"How does prompt caching relate to the KV cache?"', a: 'Prompt caching is the provider persisting the KV cache for a stable prompt prefix so subsequent calls skip re-prefilling it — commonly 5–10x cheaper and faster on that prefix. To exploit it you structure prompts so the stable content (system prompt, reference documents, few-shot examples) comes first and the variable content (the user\'s new message) comes last, maximizing the reusable cached prefix. It\'s one of the highest-ROI cost optimizations for RAG and long-system-prompt apps.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Prompt caching in production APIs', text: 'Anthropic and OpenAI both expose prompt caching; teams reorder prompts stable-first to cut input costs on long system prompts and RAG context by large margins.' },
          { title: 'vLLM & PagedAttention', text: 'The popular open-source serving engine vLLM exists largely to manage KV cache memory efficiently (paging it like virtual memory) so more requests batch per GPU — this lesson\'s cost math, productized.' },
          { title: 'Streaming UX decisions', text: 'Because prefill gates the first token, products stream output and show a "thinking" state during prefill on long inputs — turning an unavoidable wait into acceptable UX (Lesson 2.4).' },
          { title: 'Context budgeting in RAG', text: 'RAG systems cap retrieved context partly for the KV-cache reason: smaller context means a smaller cache, cheaper serving, and faster first tokens (Module 6/7).' },
        ] },
        { type: 'project', title: 'Build the cost-curve simulator', goal: 'Make the quadratic-vs-linear difference concrete by simulating and comparing generation cost with and without a KV cache.', steps: [
          'Write a JS (or Python) function that, for N tokens, computes per-step work: uncached = t at step t, cached = 1 at step t. Accumulate both totals.',
          'Print a table of per-step and cumulative work for N = 20, and the total speedup ratio (uncached/cached).',
          'Add a memory model: assume ~200 KB of K/V per token; compute the cache size at each step and its final footprint.',
          'Extend to N = 100 and N = 1000 and observe how the compute gap and the memory footprint scale (one grows ~N², the memory grows ~N).',
          'Write 3 sentences interpreting the curves: what the cache buys (compute) and what it costs (memory), and why that makes long context expensive to serve.',
        ], deliverable: 'kv-sim.js (or .py) that prints the compute-and-memory comparison and your 3-sentence interpretation.' },
        { type: 'challenge', title: 'Estimate the VRAM', text: 'Estimate the KV-cache memory for a realistic scenario: a model with ~40 layers and a per-token K/V size on the order of a few hundred KB. How much VRAM would a single 128k-token context consume just for its cache? Then reason about why serving many such long-context requests concurrently is hard on a single GPU.', hints: [
          'Rough model: cache bytes ≈ tokens × per-token-KV-bytes. Use ~200–800 KB/token as a ballpark for a mid/large model.',
          '128k tokens × a few hundred KB lands in the tens of GB — compare that to a GPU with ~80 GB total.',
          'Now imagine 10 concurrent users each with a long context: the caches alone can exhaust the GPU, which is exactly why long-context serving is costly.',
        ] },
        { type: 'reading', links: [
          { label: 'Transformer Inference Arithmetic (kipp.ly)', url: 'https://kipp.ly/transformer-inference-arithmetic/', note: 'The clearest breakdown of prefill/decode and KV-cache memory math.' },
          { label: 'Anthropic: prompt caching', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching', note: 'The KV-cache optimization you can actually use, with prefix-ordering guidance.' },
          { label: 'vLLM & PagedAttention', url: 'https://blog.vllm.ai/2023/06/20/vllm.html', note: 'How real serving systems manage KV-cache memory to batch more requests.' },
        ] },
      ],
    },
  ],
}
