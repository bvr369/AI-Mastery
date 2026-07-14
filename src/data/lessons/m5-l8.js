// Lesson 5.8 — Checkpoint: Under-the-Hood Boss Quiz

export default {
  sections: [
    {
      id: 'briefing',
      title: 'Boss briefing',
      blocks: [
        { type: 'p', text: "Seven lessons ago, a transformer was a black box you called over HTTP. Now you can open the lid. This checkpoint proves you can **explain the machine like an engineer, not just use it** — the exact difference an interviewer is probing when they ask \"so how does it actually work?\"" },
        { type: 'p', text: "The module told one continuous story. Meaning became numbers ([[Embedding]]s), tokens learned to look at each other ([[Attention]]), those pieces stacked into a full [[Transformer]], text got chopped into the units the model actually reads (tokenizers), the model chose *which* token to emit (sampling), and then we counted the real-world bill of running the loop (KV cache and inference cost) all the way up to scaling laws. One arc: **numbers → attention → architecture → tokenization → decoding → inference cost → scale.**" },
        { type: 'callout', variant: 'info', title: 'Rules of engagement', text: "**Five questions — the hardest of the module.** Each is deliberately cross-cutting: it combines two or three lessons the way a real bug or a real interview does. Aim for 4/5, but treat every explanation as the actual lesson. If one feels shaky, the linked concept is one click back." },
        { type: 'h', text: 'The module arc, one line each' },
        { type: 'list', items: [
          '**5.1 Embeddings** — meaning becomes vectors; closeness is [[Cosine Similarity]], not string match.',
          '**5.2 Attention** — every token computes a weighted look at every other token (query · key → value).',
          '**5.3 Architecture** — embed → stacked attention + [[Feed-Forward Network]] blocks over a [[Residual Stream]] → unembed to [[Logits]].',
          '**5.4 Tokenizers** — [[BPE]] splits text into subwords; token boundaries explain spelling, math, and non-English cost.',
          '**5.5 Sampling** — greedy/beam/top-k/top-p/temperature turn logits into one chosen token.',
          '**5.6 Inference cost** — the [[KV Cache]] makes generation O(n) per token instead of O(n²), at a memory price.',
          '**5.7 Scale** — scaling laws: loss falls predictably with params, data, and compute (until data runs out).',
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the mechanic vs the driver', text: "Anyone can drive the car — call the API, get text. But when it stalls on a hill (a latency spike), pulls to one side (a tokenizer bug mangling your JSON), or guzzles fuel (a context window blowing your budget), the driver shrugs and the *mechanic* pops the hood. This module made you the mechanic. The questions below are the diagnostic exam." },
      ],
    },
    {
      id: 'run-the-machine',
      title: 'Run the whole machine once',
      blocks: [
        { type: 'p', text: "Before the quiz, a 30-second integration rep. A real forward pass is billions of multiply-adds, but the *shape* of the pipeline is small enough to run in your head — and in this playground. Every real model does exactly these stages in exactly this order; only the numbers get bigger." },
        { type: 'code', lang: 'python', filename: 'pipeline.py', code: `# The transformer pipeline, in the order it runs (pseudo-Python).
ids     = tokenizer.encode(prompt)        # 5.4  text -> token ids
vecs    = embedding[ids] + positions      # 5.1  ids  -> vectors (+ position)
for block in transformer_blocks:          # 5.3  the stack
    vecs = vecs + attention(vecs)         # 5.2  tokens look at each other
    vecs = vecs + feed_forward(vecs)      # 5.3  per-token processing
logits  = vecs[-1] @ unembedding          # 5.3  last position -> vocab scores
probs   = softmax(logits / temperature)   # 5.5  scores -> probabilities
next_id = sample(probs, top_p=0.9)        # 5.5  pick ONE token
# append next_id, reuse the KV cache (5.6), and loop.`, caption: 'Memorize the order. Half of "how does it work?" is naming these seven stages without hesitating.' },
        { type: 'p', text: "Now run a toy version. The playground fakes the weights (real embeddings and attention are learned; here they're tiny stand-ins) but the **control flow is honest**: tokenize, embed, do a one-line attention-style blend, score the vocabulary, then sample. Watch how temperature reshapes the final pick." },
        { type: 'playground', id: 'pipeline-toy', title: 'Tokenize → embed → attend → sample (toy pipeline)', height: 460, lang: 'javascript', code: `// A HONEST-SHAPE, fake-weights transformer step. No magic — just the stages.

// --- 5.4 Tokenizer: a trivial word-level split (real ones use BPE subwords) ---
function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z ]/g, "").split(/\\s+/).filter(Boolean)
}

// --- 5.1 Embeddings: a fake 2D vector per known token (real ones are ~1000s of dims, learned) ---
const EMB = {
  react: [0.9, 0.1], vue: [0.85, 0.15], component: [0.8, 0.2],   // "frontend" cluster
  python: [0.1, 0.9], tensor: [0.15, 0.85], model: [0.2, 0.8],   // "ML" cluster
  the: [0.5, 0.5], a: [0.5, 0.5], is: [0.5, 0.5],                 // low-signal glue
}
const embed = (tok) => EMB[tok] || [0.5, 0.5]

// --- 5.2 Attention (toy): blend the context into one "focus" vector by averaging ---
// Real attention weights each token by query-key similarity; we just mean-pool.
function attend(tokens) {
  const vecs = tokens.map(embed)
  const dims = vecs[0].length
  return vecs.reduce((acc, v) => acc.map((x, i) => x + v[i] / vecs.length), Array(dims).fill(0))
}

// --- 5.3 Unembed: score each candidate next token by closeness to the focus vector ---
function score(focus) {
  return Object.keys(EMB).map((tok) => {
    const v = embed(tok)
    const dot = v[0] * focus[0] + v[1] * focus[1]   // cosine-ish (vectors are ~unit scale)
    return { token: tok, logit: dot }
  })
}

// --- 5.5 Softmax + temperature + sampling: logits -> one chosen token ---
function softmax(items, temperature) {
  const exps = items.map((it) => Math.exp(it.logit / temperature))
  const sum = exps.reduce((a, b) => a + b, 0)
  return items.map((it, i) => ({ token: it.token, p: exps[i] / sum }))
}
function sample(dist) {
  let r = Math.random()
  for (const { token, p } of dist) { r -= p; if (r <= 0) return token }
  return dist[0].token
}

// --- Run one full step ---
const prompt = "The react"
const toks = tokenize(prompt)
const focus = attend(toks)
const dist = softmax(score(focus), 0.7).sort((a, b) => b.p - a.p)

console.log("tokens:", toks)
console.log("focus vector:", focus.map((n) => n.toFixed(2)))
console.log("top candidates:")
dist.slice(0, 4).forEach((d) => console.log("  " + d.token + "  " + (d.p * 100).toFixed(1) + "%"))
console.log("sampled next token ->", sample(dist))`, solution: `// SOLUTION: crank temperature and watch the distribution flatten (5.5),
// and swap in an "ML" prompt to see attention pull the focus to the other cluster (5.1/5.2).
const prompt = "The python model"
const toks = tokenize(prompt)
const focus = attend(toks)

for (const T of [0.2, 0.7, 2.0]) {
  const dist = softmax(score(focus), T).sort((a, b) => b.p - a.p)
  const top = dist[0]
  console.log("T=" + T + "  top: " + top.token + " " + (top.p * 100).toFixed(0) + "%"
    + "  | 2nd: " + dist[1].token + " " + (dist[1].p * 100).toFixed(0) + "%")
}
// Cold T sharpens toward the nearest cluster; hot T gives the underdog cluster a real shot.
// That is the whole embeddings x attention x sampling interaction in five lines.`, caption: '**Exercise:** change the prompt to `"The python model"` and run each temperature 0.2, 0.7, 2.0. Predict which cluster wins BEFORE you run, then confirm. Bonus: add a `graphql` token to the frontend cluster and watch it become a candidate.' },
        { type: 'callout', variant: 'tip', text: "This toy collapses learned billions into hand-picked pairs, but the pipeline order — tokenize, embed, attend, score, sample — is exactly a production model's. If you can narrate this playground out loud, you can narrate GPT." },
      ],
    },
    {
      id: 'boss-quiz',
      title: 'The boss quiz',
      blocks: [
        { type: 'p', text: "Five questions, each spanning multiple lessons. Read the scenario, commit to an answer, then read the explanation whether you got it or not — the explanations are where the cross-lesson wiring locks in." },
        { type: 'quiz', questions: [
          {
            q: 'Your semantic-search feature returns garbage for the query "how to unmount a React effect" — it surfaces docs about physical mounting hardware. You embedded queries and docs with two DIFFERENT model families. The root cause?',
            options: [
              'Temperature is too high on the embedding call',
              'Embeddings only share meaning WITHIN one model\'s learned vector space; mixing spaces makes cosine similarity meaningless',
              'The tokenizer split "unmount" into subwords',
              'You needed a bigger context window',
            ],
            answer: 1,
            explain: 'Lesson 5.1: an embedding vector is only interpretable relative to the space it was trained in. Two models put "unmount" in unrelated coordinates, so [[Cosine Similarity]] across them compares apples to nonsense. Rule: embed queries and documents with the *same* model. (Temperature doesn\'t apply to embeddings — there\'s no sampling step.)',
          },
          {
            q: 'A teammate claims: "We can shrink cost by feeding the model a 100k-token document — attention is cheap, it\'s just a weighted average." What\'s the precise correction that spans attention AND inference cost?',
            options: [
              'Attention is free; the cost is only in the feed-forward layers',
              'Self-attention is O(n²) in sequence length, so 100k tokens is quadratic compute for the prefill, and the KV cache memory grows linearly with every token — long context is expensive on both axes',
              'Attention caps out at 4k tokens regardless of the model',
              'The cost is identical to a 1k-token prompt because it\'s one forward pass',
            ],
            answer: 1,
            explain: '5.2 × 5.6: every token attends to every other token, so the prefill pass is O(n²) in sequence length. Then during generation the [[KV Cache]] stores keys/values for all prior tokens — linear memory that balloons for long contexts. "Just a weighted average" hides both the quadratic prefill and the linear cache footprint that dominate long-context bills.',
          },
          {
            q: 'A user reports your app "can\'t count" — asked how many r\'s are in "strawberry", the model says 2. A colleague wants to fix it by lowering temperature to 0. Diagnose correctly:',
            options: [
              'Temperature 0 will fix it — the model just needs to be more deterministic',
              'The model literally never sees the letters: "strawberry" is a few subword tokens, so character-level questions ask about information the tokenizer destroyed — sampling settings can\'t recover it',
              'The context window truncated the word',
              'It\'s a hallucination best fixed with RAG',
            ],
            answer: 1,
            explain: '5.4 × 5.5: [[BPE]] maps "strawberry" to a handful of subword tokens; the model reasons over token IDs, not characters, so letter-counting is guessing about erased information. Temperature 0 just makes the *same wrong guess* consistent (Module 1 callback). The real fix is a tool (let it call code) — architecture, not a dial.',
          },
          {
            q: 'Two models: Model A has 70B parameters, Model B has 7B but was trained on 10x more tokens. On your benchmark B beats A. The best explanation, using scaling laws?',
            options: [
              'Bigger is always better, so this result must be a measurement error',
              'Loss depends on BOTH parameters and training tokens; a smaller model trained on far more data (compute-optimal / Chinchilla-style) can beat a larger, data-starved one',
              'Model B has a longer context window',
              'Model A\'s tokenizer is worse',
            ],
            answer: 1,
            explain: '5.7: scaling laws say loss falls with parameters, data, AND compute together — not parameter count alone. A 70B model trained on too few tokens is under-trained; a well-fed 7B can surpass it. This is why "how many billions?" is a lazy proxy for capability, and why data (not just size) is the modern bottleneck.',
          },
          {
            q: 'You must pick ONE change to make a code-generation endpoint both cheaper and more reliable. Which single lever, and why does it touch the most of the machine?',
            options: [
              'Raise temperature so answers are more creative',
              'Switch to a model with more parameters for safety',
              'Set temperature low and constrain sampling (e.g. top-p tight or greedy), tighten the prompt to cut output tokens, and reuse the KV cache via prompt caching — decoding + tokens + inference cost in one move',
              'Send the whole codebase as context every call for maximum information',
            ],
            answer: 2,
            explain: 'The integration question. 5.5: low temperature + tight top-p makes code generation reliable (you want the peak, not the tail). 5.4/5.6: fewer output tokens = less O(n) generation cost, and prompt/KV caching reuses the prefill so repeated system prompts aren\'t re-billed. Option 4 does the opposite — dumping the codebase triggers the O(n²) prefill and linear cache blow-up from the earlier question.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Module flash-review',
      blocks: [
        { type: 'p', text: "Six cards distilling the module's most interview-quoted facts. These join your spaced-repetition deck — when someone asks \"how does a transformer work?\" at a whiteboard, these are the lines that come out clean." },
        { type: 'flashcards', cards: [
          { id: 'm5-l8-c1', front: 'The transformer pipeline in order?', back: 'Tokenize → embed (+ position) → stacked (attention + feed-forward) blocks over the residual stream → unembed to logits → softmax/temperature → sample one token → loop. Seven stages, same every model.' },
          { id: 'm5-l8-c2', front: 'What does attention actually compute?', back: 'For each token, a weighted look at every other token: query · key gives relevance scores, softmaxed into weights that blend the values. It\'s O(n²) in sequence length — the source of long-context cost.' },
          { id: 'm5-l8-c3', front: 'Why are embeddings from two different models incompatible?', back: 'A vector only has meaning inside the space it was trained in. Cosine similarity across different models compares unrelated coordinate systems. Always embed queries and documents with the same model.' },
          { id: 'm5-l8-c4', front: 'Why can\'t models reliably count letters or do exact math?', back: 'BPE tokenization maps text to subword IDs; the model never sees characters. Letter/spelling/digit questions ask about information the tokenizer erased. Fix with tools, not temperature.' },
          { id: 'm5-l8-c5', front: 'What is the KV cache and what does it trade?', back: 'It stores the keys/values of past tokens so each new token is O(n) instead of recomputing O(n²). Trade: linear memory growth per token — the reason long contexts and long outputs cost more.' },
          { id: 'm5-l8-c6', front: 'Scaling laws in one line?', back: 'Loss falls predictably with parameters, training data, and compute together. A smaller, well-fed (compute-optimal) model can beat a bigger, data-starved one — size alone isn\'t capability.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Module complete — you can pop the hood',
      blocks: [
        { type: 'p', text: "You came in able to *call* a model; you leave able to *explain* one. That shift is exactly what separates a senior AI engineer from someone who pastes prompts. Here's why every stage you learned pays rent in real work." },
        { type: 'h', text: 'Why internals make you a better engineer' },
        { type: 'list', items: [
          '**Debugging** — a mangled JSON output traces to the tokenizer; a wrong search result traces to mismatched embedding spaces. You now debug the *stage*, not the vibe.',
          '**Model selection** — you read past "billions of parameters" to data, context cost, and tokenizer quality. You pick on evidence, not marketing.',
          '**Cost reasoning** — you can predict a bill from O(n²) prefill + linear KV cache + output tokens *before* you ship, not after the invoice.',
          '**Cutting through hype** — "our AGI has 2 trillion parameters" lands differently when you know scaling laws and compute-optimal training.',
        ] },
        { type: 'summary', points: [
          'The machine is one pipeline: tokenize → embed → attention + feed-forward stack → unembed → sample → loop.',
          'Embeddings turn meaning into vectors; similarity is geometric (cosine), and only valid within one model\'s space.',
          'Attention is O(n²) in sequence length — the root of long-context compute cost; the KV cache trades memory to make generation O(n).',
          'Tokenizers (BPE) explain spelling/math failures and non-English cost: the model reasons over subword IDs, never characters.',
          'Sampling (temperature/top-k/top-p) picks the token; scaling laws say capability comes from params + data + compute, not size alone.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Treating "more parameters" as "better model"', text: 'Scaling laws (5.7) show data and compute matter as much as size. A compute-optimal 7B beats a data-starved 70B. Judge on evals and the whole training recipe, not the headline number.' },
          { title: 'Mixing embedding models in one pipeline', text: 'Vectors from different models live in incompatible spaces (5.1). Cosine similarity across them is noise. One embedding model for both queries and documents — no exceptions.' },
          { title: 'Blaming the model for tokenizer artifacts', text: 'Letter-counting, exact arithmetic, and weird non-English costs are tokenizer effects (5.4), not "the model is dumb." Reach for a tool or a different framing, not a temperature tweak.' },
          { title: 'Forgetting long context is quadratic AND memory-hungry', text: 'Stuffing 100k tokens "because we can" triggers O(n²) prefill and a linear KV-cache blow-up (5.2 × 5.6). Retrieve the relevant slice instead of dumping everything.' },
        ] },
        { type: 'interview', items: [
          { q: '"Walk me through what happens inside a transformer when I send a prompt."', a: 'Tokenize the text into subword IDs, embed each into a vector and add positional info, then push it through a stack of blocks — each does self-attention (every token takes a weighted look at every other via query·key→value) plus a per-token feed-forward network, all connected by a residual stream. The final position\'s vector is unembedded into logits over the vocabulary, softmax + temperature turn those into probabilities, and we sample one token. Append it, reuse the KV cache, and loop. Seven stages, one sentence each.' },
          { q: '"Why is long context expensive — isn\'t it just one forward pass?"', a: 'Two costs. Self-attention is O(n²) in sequence length, so the prefill over a long prompt grows quadratically. Then during generation the KV cache holds keys and values for every prior token — linear memory that keeps growing per output token. So long context hits both compute (prefill) and memory (cache). That\'s why providers price input tokens, cache reuse, and output tokens separately.' },
          { q: '"A model gives a wrong answer to \'how many words in this sentence.\' Where do you look first?"', a: 'The tokenizer, not the reasoning. The model sees subword tokens, not words or characters, so counting tasks ask about information tokenization erased. I\'d confirm with a tokenizer playground, then solve it structurally — give the model a tool to run code — rather than fiddling with temperature, which only makes the same wrong guess consistent.' },
          { q: '"How would you compare two models beyond the parameter count?"', a: 'Parameter count is a weak proxy. I look at the training data scale (scaling laws say a well-fed smaller model can win), context window and its cost curve, tokenizer efficiency for my languages and formats, and — decisive — task-specific eval scores. Capability is params × data × compute plus fit to my workload, not a single number.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Debugging a broken RAG search', text: 'When retrieval returns nonsense, engineers who know 5.1 check for mismatched embedding models or wrong distance metric first — a five-minute fix instead of a week of prompt tweaking.' },
          { title: 'Capacity planning for self-hosting', text: 'Teams sizing GPUs compute KV-cache memory per concurrent user from context length (5.6). Internals turn "buy a big GPU" into an actual number.' },
          { title: 'Choosing a model for multilingual products', text: 'Tokenizer knowledge (5.4) predicts that some languages cost 2-3x more tokens per word — a real budget and latency factor teams weigh when picking a provider.' },
          { title: 'Reading research and cutting hype', text: 'Understanding scaling laws (5.7) lets engineers read a new model\'s paper and judge whether its claims are plausible — the vocabulary that separates informed choices from press-release-driven ones.' },
        ] },
        { type: 'project', title: 'Teach it back: prompt-to-word in five minutes', goal: 'Feynman-test the whole module: if you can teach the pipeline cleanly, you own it.', steps: [
          'Write (or record) a 5-minute explainer titled "How a transformer turns a prompt into the next word."',
          'Must correctly use, in order: token, embedding, attention, logits, softmax/temperature, sampling — and mention the KV cache once.',
          'Banned words: "magic", "thinks", "understands", "knows". Forced framing: "predicts", "vector", "weighted".',
          'Include one honest failure — e.g. why it miscounts letters — traced to the correct stage (the tokenizer).',
          'Deliver it to a real human or a rubber duck with standards. Note every question they ask; each marks a gap to patch from the linked lesson.',
        ], deliverable: 'A 5-minute explainer (text or recording) that uses the module vocabulary correctly and names no "magic", plus your list of gaps.' },
        { type: 'challenge', title: 'Write the next boss quiz', text: 'Author THREE new boss-quiz-quality questions this checkpoint should have asked but didn\'t — each a scenario that combines at least two lessons, with four options, the correct index, and a teaching explanation. Writing good distractors forces deeper understanding than answering ever does.', hints: [
          'Steal the scenario-first shape: "A user reports…", "Your GPU bill shows…", "A teammate claims…".',
          'The strongest distractors are true statements that don\'t answer THIS question (e.g. a real fact about temperature offered as the cause of a tokenizer bug).',
          'Cross-lesson combos are gold: attention × cost, embeddings × retrieval, tokenizer × sampling, scaling × model choice.',
        ] },
        { type: 'reading', links: [
          { label: 'LLM Visualization — Brendan Bycroft', url: 'https://bbycroft.net/llm', note: 'A 3D walkthrough of a real GPT running every stage you just quizzed on. The capstone visual for this module.' },
          { label: 'The Illustrated Transformer — Jay Alammar', url: 'https://jalammar.github.io/illustrated-transformer/', note: 'The canonical visual explainer of attention and the block stack. Re-read it now that the vocabulary is yours.' },
          { label: 'Let\'s build GPT — Andrej Karpathy', url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY', note: 'Two hours coding a transformer from scratch. After this module you\'ll follow every line — the ultimate consolidation.' },
        ] },
      ],
    },
  ],
}
