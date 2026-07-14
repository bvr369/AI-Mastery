// Lesson 5.3 — The Transformer Architecture Tour

export default {
  sections: [
    {
      id: 'the-whole-machine',
      title: 'The whole machine, finally assembled',
      blocks: [
        { type: 'p', text: "You've now met the two star components. In Lesson 5.1 you turned tokens into [[Embedding]] vectors — meaning as coordinates. In Lesson 5.2 you saw [[Attention]] let every token look at every other token and pull in context. This lesson bolts them into the *complete* machine and does one thing: **traces a single token from raw text all the way to a next-token prediction**. By the end you could sketch the whole data path on a whiteboard — which is exactly what interviewers ask for." },
        { type: 'p', text: "Here's the reframe that makes everything click. Back in Module 1 you learned an LLM is a loop: read context → score every token → sample one → append → repeat. That loop's expensive middle step — *\"score every token\"* — **is** the transformer. It's not a mysterious black box bolted onto the loop; it's the forward pass that produces the [[Logits]]. Today we open that box." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: an assembly line for meaning', text: "Picture a car factory. A bare chassis (the token embedding) rolls onto the line. At each station a crew adds something — attention bolts on \"what the surrounding words mean,\" the feed-forward network bolts on \"what I know about this concept.\" Crucially, nobody rips the chassis apart and starts over; each station *adds* to the car already on the belt. After N stations the finished vehicle rolls off — and a final inspector reads it to predict what comes next. The transformer is that assembly line, and depth is just how many stations long it is." },
        { type: 'h', text: 'The five stages of a forward pass' },
        { type: 'list', items: [
          '**1 · Tokenize** — chop the text into [[Token]]s (`the cat sat` → `[the, cat, sat]`). Pure lookup, no neural network yet.',
          '**2 · Embed + position** — each token id becomes a vector ([[Embedding]]), then we ADD a [[Positional Encoding]] so the model knows the *order*. Without this, attention sees a bag of words.',
          '**3 · Stack of N blocks** — the vectors flow through N identical transformer blocks (GPT-3: 96 of them). Each block does attention + feed-forward and *adds* its result to the running representation. This is 95% of the compute and 100% of the magic.',
          '**4 · Unembed** — the final vector for the *last* position is multiplied back out to one score per vocabulary token. These raw scores are the [[Logits]].',
          '**5 · Softmax → sample** — [[Softmax]] turns logits into probabilities; you sample one (temperature lives here). That token is the prediction. Append it, and the whole loop runs again.',
        ] },
        { type: 'callout', variant: 'info', text: "Modern chat models are **decoder-only** and **autoregressive**: one stack of blocks, predicting the next token given everything before it — never peeking ahead. That \"never peek ahead\" rule is enforced by *masked* attention, which we'll unpack in stage 3. The original 2017 paper had a separate encoder too; today's GPT/Claude/Llama family dropped it and kept only the decoder." },
      ],
    },
    {
      id: 'the-map',
      title: 'The architecture map',
      blocks: [
        { type: 'p', text: "This is the diagram to burn into memory — the signature transformer picture, labeled. Read it bottom-to-top: text enters at the bottom, becomes embeddings, flows up through the stack of blocks (the tall repeated middle), and exits the top as a probability over the next token. Trace one arrow at a time." },
        { type: 'diagram', id: 'transformer-arch', caption: 'Bottom to top: tokenize → embed + positional encoding → N× [attention → add & norm → FFN → add & norm] → unembed → softmax. The vertical line running up the middle is the residual stream — the "running representation" every block adds to.' },
        { type: 'h', text: 'Inside one block: three moves' },
        { type: 'p', text: "Every one of the N blocks is identical in shape (different learned weights). It makes three moves, in order:" },
        { type: 'list', items: [
          '**Multi-Head Attention** — [[Multi-Head Attention]] lets each token gather relevant context from the other tokens. \"It\" looks back and finds \"the cat\"; the verb looks back and finds its subject. Several heads run in parallel, each specializing in a different kind of relationship.',
          '**The Residual Stream (add & norm)** — the attention output is *added* back onto the input, not swapped in. Then a *layer normalization* step keeps the numbers well-scaled. This running total is the [[Residual Stream]] — the backbone of the whole model.',
          '**Feed-Forward Network** — the [[Feed-Forward Network]] (FFN) processes each token position independently through a little 2-layer MLP. Attention *moves information between* tokens; the FFN *thinks about* each token on its own. This is where a huge share of the model\'s factual knowledge is stored.',
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the residual stream is a group document', text: "Think of the [[Residual Stream]] as a shared Google Doc that starts with a rough draft of each token's meaning. Each block is an editor who reads the current draft and *appends a tracked-changes suggestion* — never deletes the doc and rewrites from scratch. Attention's edit is \"here's what the neighbors imply\"; the FFN's edit is \"here's relevant knowledge I hold.\" After 96 editors, the doc is a deeply-considered representation. Because every editor only *adds*, the original signal is never lost — and (as the challenge will show) that's also why very deep models still train." },
      ],
    },
    {
      id: 'the-tour',
      title: 'Take the guided tour',
      blocks: [
        { type: 'p', text: "Reading the map is one thing; *walking* it is another. Step through the pipeline one stage at a time. Watch a token enter as text, pick up positional info, get contextualized by attention, get enriched by the FFN, and finally resolve into a next-token prediction. Pause on the residual-stream step — notice how the vector carries forward and accumulates rather than resetting." },
        { type: 'demo', id: 'transformer-tour' },
        { type: 'p', text: "The single most important thing to take from that walk: **the shape of the data never changes as it flows up the stack.** A token is a vector of, say, 768 numbers at the bottom, after block 1, after block 50, and at the top. Every block reads a vector and writes a same-sized vector back into the stream. That uniformity is why you can stack blocks arbitrarily deep — and why \"make the model bigger\" mostly means \"add more identical blocks.\"" },
      ],
    },
    {
      id: 'code-and-play',
      title: 'The block in code, and a toy forward pass',
      blocks: [
        { type: 'p', text: "Here's a whole transformer block as annotated pseudocode. Notice the two `x = x + ...` lines — those are the residual (skip) connections, the literal implementation of \"add, don't replace.\" This is real: strip the tensor math and every production transformer block is this shape." },
        { type: 'code', lang: 'python', filename: 'transformer_block.py', code: `# One transformer block. x has shape [seq_len, d_model]:
# one row per token, each row a d_model-dim vector (the residual stream).

def transformer_block(x):
    # --- Move 1: attention, wrapped in a residual connection ---
    attn_out = multi_head_attention(layer_norm(x))  # tokens look at each other
    x = x + attn_out                                # ADD to the stream (don't replace)

    # --- Move 2: feed-forward, wrapped in a residual connection ---
    ffn_out = feed_forward(layer_norm(x))           # per-token "thinking" / knowledge
    x = x + ffn_out                                 # ADD to the stream again

    return x  # same shape as we received — ready for the next block

def feed_forward(x):
    # A tiny 2-layer MLP applied to EACH token position independently.
    # The hidden layer is usually 4x wider than d_model — lots of capacity;
    # this is where much of the model's factual "knowledge" is believed to live.
    h = gelu(x @ W1 + b1)   # expand + nonlinearity
    return h @ W2 + b2      # project back to d_model

# The full model is just: embed -> [block, block, ... N times] -> unembed -> softmax
def forward(token_ids):
    x = embed(token_ids) + positional_encoding(token_ids)  # stage 2
    for block in blocks:            # stage 3: the stack
        x = block(x)
    logits = unembed(x[-1])         # stage 4: last position -> vocab scores
    return softmax(logits)          # stage 5: probabilities for the next token`, caption: 'The two residual adds are the whole trick to training deep networks. Everything else is matrix multiplication.' },
        { type: 'p', text: "Now assemble the pipeline yourself. This playground is a *cartoon* forward pass in plain JavaScript — the operations are fake (real ones are matrix multiplications on a GPU), but the **data flow and stages are exactly right**. Run it and watch a representation get built up stage by stage, then collapse into a single predicted token." },
        { type: 'playground', id: 'toy-forward-pass', title: 'A tiny forward pass, stage by stage', height: 460, code: `// A cartoon transformer forward pass. The math is fake; the PIPELINE is real.
// Goal: watch a token's representation get BUILT UP, then resolved to a prediction.

const vocab = ["the", "cat", "sat", "on", "mat", "dog", "ran"]

// Stage 1: tokenize (just index lookup here)
const prompt = ["the", "cat", "sat", "on", "the"]
console.log("1. TOKENS:", prompt)

// Stage 2: embed + positional encoding (add order info)
// Each token -> a tiny 3-number vector; we ADD a position signal.
const embed = (t) => [t.length, t.charCodeAt(0) % 7, 1]      // fake embedding
const posEnc = (i) => [i * 0.1, 0, i * 0.01]                 // fake position
let stream = prompt.map((t, i) => embed(t).map((v, k) => v + posEnc(i)[k]))
console.log("2. EMBED+POS (residual stream starts):", stream[stream.length - 1])

// Stage 3: a stack of blocks. Each block ADDS to the stream (never replaces).
function block(stream, layer) {
  // fake "attention": each token nudged by the average of all tokens (context)
  const avg = stream[0].map((_, k) => stream.reduce((s, v) => s + v[k], 0) / stream.length)
  const afterAttn = stream.map((v) => v.map((x, k) => x + avg[k] * 0.1))   // x = x + attn
  // fake "FFN": a per-token nonlinear nudge (knowledge)
  const afterFFN = afterAttn.map((v) => v.map((x) => x + Math.tanh(x) * 0.1)) // x = x + ffn
  return afterFFN
}
const N = 4
for (let layer = 0; layer < N; layer++) {
  stream = block(stream, layer)
  console.log(\`3. after block \${layer + 1}: last-token vector = \` +
    stream[stream.length - 1].map((x) => x.toFixed(2)).join(", "))
}

// Stage 4: unembed the LAST position -> one score (logit) per vocab word
const last = stream[stream.length - 1]
const logits = vocab.map((w, i) => last.reduce((s, x) => s + x * ((i % 3) + 1), 0))
console.log("4. LOGITS:", vocab.map((w, i) => \`\${w}:\${logits[i].toFixed(1)}\`).join("  "))

// Stage 5: softmax -> probabilities -> pick the argmax (greedy)
function softmax(xs) {
  const m = Math.max(...xs)
  const ex = xs.map((x) => Math.exp(x - m))
  const sum = ex.reduce((a, b) => a + b, 0)
  return ex.map((e) => e / sum)
}
const probs = softmax(logits)
const best = probs.indexOf(Math.max(...probs))
console.log("5. NEXT TOKEN ->", vocab[best], "(" + (probs[best] * 100).toFixed(0) + "%)")`, solution: `// SOLUTION: make depth visible. Print how much each block CHANGES the stream,
// proving each block only ADDS a nudge (the residual stream in action).
const vocab = ["the", "cat", "sat", "on", "mat", "dog", "ran"]
const prompt = ["the", "cat", "sat", "on", "the"]
const embed = (t) => [t.length, t.charCodeAt(0) % 7, 1]
const posEnc = (i) => [i * 0.1, 0, i * 0.01]
let stream = prompt.map((t, i) => embed(t).map((v, k) => v + posEnc(i)[k]))

const mag = (v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0))
function block(stream) {
  const avg = stream[0].map((_, k) => stream.reduce((s, v) => s + v[k], 0) / stream.length)
  const afterAttn = stream.map((v) => v.map((x, k) => x + avg[k] * 0.1))
  return afterAttn.map((v) => v.map((x) => x + Math.tanh(x) * 0.1))
}
for (let layer = 0; layer < 8; layer++) {
  const before = mag(stream[stream.length - 1])
  stream = block(stream)
  const after = mag(stream[stream.length - 1])
  console.log(\`block \${layer + 1}: stream magnitude \${before.toFixed(2)} -> \${after.toFixed(2)} \` +
    \`(added \${(after - before).toFixed(3)})\`)
}
console.log("Every block nudged the SAME vector forward — it never reset to zero.")`, caption: '**Exercise:** add a line inside the block loop that prints the *magnitude* of the last-token vector before and after each block. Confirm the number keeps growing gradually — visual proof the residual stream accumulates rather than resets. (Solution provided.)' },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'In one transformer block, what is the correct order of the two main sub-layers?',
            options: [
              'Feed-forward network, then multi-head attention',
              'Multi-head attention, then feed-forward network',
              'Softmax, then attention',
              'Positional encoding, then unembedding',
            ],
            answer: 1,
            explain: 'Each block runs multi-head attention first (tokens gather context from each other), then the feed-forward network (each token is processed independently). Both are wrapped in residual connections. Positional encoding happens once at the bottom; softmax happens once at the very top — not inside every block.',
          },
          {
            q: 'A residual (skip) connection means a sub-layer\'s output is…',
            options: [
              'Discarded if it is too small',
              'ADDED back onto its input (x = x + sublayer(x)), not used to replace it',
              'Sent to a different GPU for parallelism',
              'Multiplied by the attention scores',
            ],
            answer: 1,
            explain: 'The defining move: `x = x + sublayer(x)`. Each block ADDS its contribution to the running representation (the residual stream) rather than overwriting it. This preserves the original signal and creates a clean gradient path, which is why 96-layer models still train.',
          },
          {
            q: 'What is the specific job of the feed-forward network (FFN) inside a block?',
            options: [
              'To let tokens exchange information with each other',
              'To convert token ids into embeddings',
              'To transform each token position independently — where much factual knowledge is stored',
              'To apply the softmax that produces probabilities',
            ],
            answer: 2,
            explain: 'Division of labor: attention MOVES information between tokens; the FFN THINKS about each token on its own via a per-position MLP. Interpretability research suggests a large share of a model\'s stored facts live in these FFN weights. Mixing up "attention moves, FFN processes" is the classic interview trip-up.',
          },
          {
            q: 'Why are today\'s chat models called "decoder-only" and "autoregressive"?',
            options: [
              'They can only decode images, not text',
              'They use a single stack of blocks and predict the next token from prior tokens only, never peeking ahead',
              'They decode faster than they encode',
              'They require a separate encoder model to run',
            ],
            answer: 1,
            explain: 'Decoder-only = one stack of blocks (the 2017 paper\'s encoder was dropped). Autoregressive = each new token is generated from all previous tokens, and masked attention forbids peeking at future positions. This is precisely the next-token loop from Module 1, now with its engine revealed.',
          },
          {
            q: 'Roughly what changes as a token\'s vector flows from the bottom of the stack to the top?',
            options: [
              'Its dimensionality shrinks by half at every block',
              'Its shape stays constant; its contents get progressively richer/more contextual',
              'It is replaced by a brand-new random vector at each block',
              'Nothing changes until the final softmax',
            ],
            answer: 1,
            explain: 'The vector keeps the same size (e.g. 768 numbers) at every layer — that uniform shape is what lets you stack blocks arbitrarily deep. What changes is the *content*: each block adds context and knowledge, so early layers hold surface features and later layers hold abstract, task-relevant meaning. Depth buys richer representations.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm5-l3-c1', front: 'The 5 stages of a transformer forward pass?', back: '**Tokenize** → **embed + positional encoding** → **N transformer blocks** → **unembed** (last position → logits) → **softmax + sample**. The output token is appended and the loop repeats.' },
          { id: 'm5-l3-c2', front: 'The three moves inside one transformer block?', back: '**Multi-head attention** (tokens gather context) → **add & norm** (residual + layer norm) → **feed-forward network** (per-token processing) → **add & norm** again.' },
          { id: 'm5-l3-c3', front: 'What is the residual stream?', back: 'The running representation flowing up the middle of the stack. Each block ADDS its output to it (`x = x + sublayer(x)`) rather than replacing it — so signal is never lost and gradients flow cleanly.' },
          { id: 'm5-l3-c4', front: 'Attention vs feed-forward network — who does what?', back: '**Attention** MOVES information *between* tokens (context). **FFN** processes each token *independently* (knowledge). Attention mixes; the FFN thinks.' },
          { id: 'm5-l3-c5', front: 'What does "decoder-only, autoregressive" mean?', back: 'One stack of blocks (no separate encoder) that predicts the next token from prior tokens only. Masked attention forbids peeking ahead — this IS the Module 1 next-token loop.' },
          { id: 'm5-l3-c6', front: 'Why does depth (more layers) help?', back: 'The vector keeps a constant shape but gets progressively richer as each block adds context and knowledge. Early layers = surface features; deep layers = abstract meaning. More blocks → more refined representations.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'A transformer IS the "score every token" step of the Module 1 loop: text → embeddings+position → N blocks → logits → softmax → next token.',
          'One block = multi-head attention (move info between tokens) + FFN (process each token), each wrapped in a residual add & norm.',
          'The [[Residual Stream]] is the backbone: every block ADDS to a running representation instead of replacing it (`x = x + sublayer(x)`).',
          'The FFN is where much factual knowledge lives; attention is where context routing happens. Don\'t conflate the two.',
          'Chat models are decoder-only and autoregressive; depth (more identical blocks) buys richer representations at constant vector shape.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Thinking each layer replaces the previous representation', text: 'It doesn\'t — it ADDS to it. The residual stream is a running sum, not a relay of hand-offs. If you picture "layer 5 throws away layer 4\'s work," you\'ll never understand why deep models train or how features accumulate.' },
          { title: 'Believing attention does the "thinking"', text: 'Attention only ROUTES information between token positions. The actual per-token transformation — and a large fraction of stored knowledge — lives in the feed-forward network. Both matter; they do different jobs.' },
          { title: 'Confusing embeddings with the block stack', text: 'Embedding is the one-time lookup at the bottom (token id → vector). The transformer blocks are the tall repeated middle that refines those vectors. "Embedding" is stage 2; the transformer is stage 3.' },
          { title: 'Forgetting positional encoding exists', text: 'Attention alone is order-blind — it would treat "dog bites man" and "man bites dog" identically. Positional encoding, added right after embedding, is what injects word order. Leave it out and the model reads a bag of words.' },
        ] },
        { type: 'interview', items: [
          { q: '"Walk me through what happens when a transformer processes a prompt, end to end."', a: 'Tokenize the text into token ids. Look up an embedding vector for each and add a positional encoding so order is preserved. Feed the sequence up through N identical blocks; each block runs multi-head attention (tokens gather context from one another) then a per-token feed-forward network, with a residual connection and normalization around each sub-layer, so every block ADDS to a running representation. Take the final vector at the last position, unembed it to get a logit per vocabulary token, softmax to probabilities, and sample the next token. Append and repeat — that\'s the autoregressive loop.' },
          { q: '"What\'s the difference between the attention sub-layer and the feed-forward sub-layer?"', a: 'Attention moves information BETWEEN token positions — it\'s how a token pulls in context from other tokens (resolving "it," linking a verb to its subject). The feed-forward network operates on each token position INDEPENDENTLY through a small 2-layer MLP; it\'s where a lot of the model\'s factual knowledge is stored. Slogan: attention mixes, the FFN thinks. Both sit inside every block, each wrapped in a residual connection.' },
          { q: '"Why can transformers be made so deep — 90-plus layers — without failing to train?"', a: 'The residual (skip) connections. Because each sub-layer computes `x = x + f(x)`, there\'s an identity path straight through every block, so gradients flow back to early layers without vanishing, and each layer only has to learn a small residual correction rather than reconstruct the whole signal. The residual stream also gives a stable, same-shape "highway" that information rides from bottom to top. Layer norm keeps the magnitudes in check. Remove the skip connections and deep transformers become nearly untrainable.' },
          { q: '"What does \'decoder-only\' mean and why did the field converge on it for LLMs?"', a: 'It means a single stack of transformer blocks that predicts the next token from the tokens before it, using masked (causal) attention so a position can never attend to future positions. The original 2017 architecture also had an encoder for tasks like translation, but for general text generation a decoder-only stack trained on next-token prediction turned out to be simpler, scale beautifully, and cover encoder use cases too — so GPT, Claude, and Llama are all decoder-only.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Reading model dimensions from a config', text: 'Every open model ships a config with `num_hidden_layers`, `hidden_size`, `num_attention_heads`. Now those aren\'t magic numbers — they\'re "how many blocks," "how wide the residual stream," and "how many attention heads per block."' },
          { title: 'Mechanistic interpretability', text: 'Teams at Anthropic and elsewhere probe the residual stream and FFN neurons to find where concepts live and how features are built up layer by layer. The whole field is built on the picture you just learned.' },
          { title: 'Choosing model size for latency', text: 'Depth is compute: a 96-block model does far more work per token than a 32-block one. Understanding "each token flows through every block" explains why bigger models are slower and pricier per token.' },
          { title: 'Debugging fine-tuning and LoRA', text: 'LoRA adapters inject trainable low-rank updates into specific sub-layers (often attention projections). Knowing exactly which matrices live in a block tells you what you\'re actually adapting when you fine-tune.' },
        ] },
        { type: 'project', title: 'Trace two blocks by hand', goal: 'Cement the data flow by drawing (in words, ASCII, or a diagram tool) a complete trace of one token passing through TWO transformer blocks, labeling every component and every "add."', steps: [
          'Start at the bottom: pick a 4-token prompt (e.g. "the cat sat on"). Show tokenize → embed → +positional encoding, and label the resulting vectors as "residual stream, layer 0."',
          'Block 1: draw multi-head attention pulling context between tokens, then the residual add (`x = x + attn`), then layer norm, then the FFN, then its residual add. Label each arrow.',
          'Block 2: repeat the same shape, feeding block 1\'s output in. Explicitly note the vector shape is unchanged.',
          'At the top: unembed the LAST position into logits, softmax to probabilities, and circle the predicted next token.',
          'Annotate two sentences: one saying what attention did, one saying what the FFN did — in your own words.',
        ], deliverable: 'A transformer-trace.md (or an image) showing the full two-block data path with every component labeled, plus your two annotation sentences.' },
        { type: 'challenge', title: 'The residual-stream metaphor, in 5 sentences', text: 'Explain, in exactly five sentences and in your own words, why very deep transformers still train successfully. You must use the residual-stream / "running representation that layers add to" metaphor, and you must correctly connect it to gradients flowing back to early layers. Bonus: make one sentence an analogy a non-engineer would understand.', hints: [
          'Anchor on `x = x + sublayer(x)`: there is always an identity path straight through each block.',
          'Because of that path, gradients don\'t have to squeeze through every transformation — they reach early layers intact.',
          'Each layer only learns a small correction to the running representation, not the whole thing from scratch.',
        ] },
        { type: 'reading', links: [
          { label: 'The Illustrated Transformer — Jay Alammar', url: 'https://jalammar.github.io/illustrated-transformer/', note: 'The canonical visual walkthrough of every component you just met. If one link cements this lesson, it\'s this one.' },
          { label: 'LLM Visualization (3D) — Brendan Bycroft', url: 'https://bbycroft.net/llm', note: 'An interactive 3D fly-through of a real GPT doing this exact forward pass, block by block. Unmissable.' },
          { label: 'Attention Is All You Need (original paper)', url: 'https://arxiv.org/abs/1706.03762', note: 'The 2017 paper that introduced the architecture. Skim it now — with this lesson\'s map, the figures finally make sense.' },
        ] },
      ],
    },
  ],
}
