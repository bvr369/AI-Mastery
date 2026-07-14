// Lesson 5.2 — Attention: The Idea That Changed Everything

export default {
  sections: [
    {
      id: 'the-it-problem',
      title: 'The word "it" is a lookup, and models used to fail it',
      blocks: [
        { type: 'p', text: "Read this sentence: *\"The trophy didn't fit in the suitcase because **it** was too big.\"* What does **it** refer to — the trophy or the suitcase? Obviously the trophy. Now swap one word: *\"...because it was too **small**.\"* Suddenly **it** is the suitcase. You resolved that instantly by *looking back* at the other words and weighing which one matters. That act of looking back and weighing is [[Attention]] — the single mechanism that made modern AI possible." },
        { type: 'p', text: "Here's the problem attention solves. The meaning of a token is almost never self-contained. `bank` means something different next to `river` than next to `money`. `it` is a pointer with no meaning until you resolve what it points at. To understand any token, the model needs to **pull in relevant information from the other tokens** — and crucially, *which* tokens are relevant changes with every sentence. There's no fixed rule; it has to be computed, per token, every time." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the group chat search', text: "Imagine each word is a person in a group chat trying to understand a message. Instead of reading every prior message equally, each person shouts a **question** (\"who is *it*?\"), everyone else holds up a little **label** describing what they offer (\"I'm a big noun!\", \"I'm a verb!\"), and you pay most attention to whoever's label best matches your question. Then you copy down what those best-matching people actually said. That three-step move — ask, match, copy — is attention in one breath." },
        { type: 'p', text: "Before attention, the dominant architecture was the [[RNN]] (recurrent neural network): it read text one word at a time, squeezing everything it had seen so far into a single fixed-size memory vector. Two fatal problems. First, that memory is a bottleneck — by word 300 the details of word 3 are a smudge (the *long-range dependency* problem). Second, it's inherently **sequential**: word 50 can't be processed until words 1–49 are done, so you can't parallelize across a sentence. Attention demolished both, and this lesson is about how." },
      ],
    },
    {
      id: 'query-key-value',
      title: 'Query, Key, Value — the whole idea in three roles',
      blocks: [
        { type: 'p', text: "Attention gives every token three roles, and the names are worth memorizing because they *are* the intuition:" },
        { type: 'list', items: [
          "**Query** — *\"what am I looking for?\"* The current token's question. For `it`, the query is roughly \"I need the noun I refer to.\"",
          "**Key** — *\"what do I offer?\"* Every token advertises a label describing what it is. `trophy`'s key says \"I'm a concrete object, a plausible antecedent.\"",
          "**Value** — *\"what do I pass along if you pick me?\"* The actual information a token hands over once it's been attended to. Keys are for *matching*; values are for *content*.",
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: dating profiles vs. the actual date', text: "The **key** is the dating-profile blurb — a compressed advertisement optimized to *get matched*. The **value** is who the person actually is when you show up. You swipe based on keys (does this match my query?), but the information you walk away with is the value. Splitting \"how findable am I\" from \"what I actually contain\" is the quiet genius of the design — a token can be easy to find for one reason and useful for another." },
        { type: 'h', text: 'The one gentle formula' },
        { type: 'p', text: "For a given token, attention does exactly this: (1) compare its **query** against **every** token's **key** to get a raw relevance score — the comparison is just a dot product, i.e. *how aligned are these two vectors*; (2) push all those scores through `softmax` (the same four-line function from Lesson 1.2) so they become weights that sum to 1; (3) take the **weighted average of every token's value** using those weights. That blended vector is the token's new, context-aware representation. Written compactly:" },
        { type: 'code', lang: 'python', filename: 'the_formula.py', code: `# Scaled dot-product attention, the one equation from "Attention Is All You Need"
#
#     Attention(Q, K, V) = softmax( (Q @ Kᵀ) / sqrt(d_k) ) @ V
#
#   Q @ Kᵀ        -> every query dotted with every key = a grid of raw scores
#   / sqrt(d_k)   -> "scaling": keeps scores from getting huge as dimension grows,
#                    which would push softmax into all-or-nothing spikes
#   softmax(...)  -> turn each row of scores into weights that sum to 1
#   ... @ V       -> weighted average of the value vectors = the output

# That's it. No recurrence, no loops over time. Just three matrix multiplies
# and a softmax — which is exactly why a GPU can do a whole sentence at once.`, caption: 'The `@` is matrix multiply. Everything else you already know — dot products (alignment) and softmax (Lesson 1.2). No new math, just three familiar pieces stacked.' },
        { type: 'callout', variant: 'tip', text: "Don't let `sqrt(d_k)` intimidate you — it's a *stabilizer*, not a concept. As vectors get longer, dot products naturally get bigger, and huge scores make softmax collapse to picking one token. Dividing by the square root of the key dimension keeps the scores in a sane range. If you forget it, attention still works; it just trains worse." },
      ],
    },
    {
      id: 'visualizer',
      title: 'See it: click a token, watch where it looks',
      blocks: [
        { type: 'p', text: "This is the whole lesson made tangible. Click any token in the sentence and the highlights show **where that token's attention flows** — brighter means a higher softmax weight. Watch `it` light up its antecedent. Then switch **heads** (top control) and notice the pattern completely changes: one head tracks what-refers-to-what, another hugs adjacent words, another locks onto the verb. Same sentence, different questions being asked in parallel." },
        { type: 'demo', id: 'attention-viz' },
        { type: 'p', text: "Two things to internalize while you play. **One:** attention is *soft* — a token doesn't pick a single other token, it takes a weighted blend of all of them (the weights just happen to be lumpy). **Two:** every token computes its own attention *simultaneously* — there's no left-to-right march. That simultaneity is the parallelism that RNNs could never offer, and it's why Transformers train on GPUs so fast." },
      ],
    },
    {
      id: 'heads-and-flavors',
      title: 'Multi-head attention, and self vs. cross',
      blocks: [
        { type: 'p', text: "A single attention calculation can only express *one* notion of relevance at a time. But language has many simultaneous relationships — grammatical subject, coreference (`it` → `trophy`), adjacency, tense agreement. The fix is delightfully brute-force: run attention **many times in parallel**, each with its own learned Query/Key/Value projections. That's [[Multi-Head Attention]]." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: a panel of specialist readers', text: "Hand the same sentence to eight proofreaders. One only checks pronoun references, one only checks subject–verb agreement, one only tracks which adjectives modify which nouns. Each reports back independently, then you staple all their notes together and act on the combined picture. Each proofreader is an attention **head**; \"stapling and combining\" is the concat-then-project step at the end. More heads = more relationship types tracked at once." },
        { type: 'p', text: "You saw this directly in the visualizer: flipping the head selector swapped one attention pattern for a totally different one over the *same* words. Real models like GPT run dozens of heads per layer, across dozens of layers — and researchers have found individual heads that specialize in exactly these human-legible jobs (there's a famous one that does nothing but point every token at the previous token)." },
        { type: 'h', text: 'Self-attention vs. cross-attention (the 20-second version)' },
        { type: 'table', headers: ['', 'Self-attention', 'Cross-attention'], rows: [
          ['Query comes from', 'the sequence itself', 'sequence A (e.g. the answer being written)'],
          ['Keys/Values come from', 'the *same* sequence', 'a *different* sequence B (e.g. the source document)'],
          ['What it does', 'tokens enrich each other with in-context meaning', 'one sequence pulls relevant info out of another'],
          ['Everyday example', 'a sentence understanding itself (`it` → `trophy`)', 'translation / RAG: the output attending over the input'],
        ] },
        { type: 'p', text: "Ninety percent of what happens inside a GPT is **self-attention** — the tokens of your prompt attending to each other, layer after layer, refining meaning. **Cross-attention** shows up when there are two distinct sequences: classic translation models, or any setup where generated text needs to look back at a fixed source. Same mechanism, the only difference is where the Keys and Values come from." },
      ],
    },
    {
      id: 'playground',
      title: 'Attention is just weighted averaging — prove it in JS',
      blocks: [
        { type: 'p', text: "Time to strip away the mystique. Below is single-head attention over four tiny hand-made token vectors — no library, no framework. It computes real dot products, a real `softmax`, and a real weighted sum of value vectors. Run it and watch which token attends most strongly to which. This is the *exact* computation happening billions of times inside GPT, just at toy scale." },
        { type: 'playground', id: 'attention-lab', title: 'Single-head attention from scratch', height: 460, lang: 'javascript', code: `// Four "tokens", each a tiny 3-D vector. In a real model these come from
// learned Q/K/V projections; here we hand-make them so you can see the mechanics.
// Pretend the sentence is:  robot   ate   the   apple
const tokens = ["robot", "ate", "the", "apple"]

// query[i], key[i], value[i] for each token (kept identical Q=K here for clarity)
const Q = [[1, 0, 1], [0, 2, 0], [0, 0, 1], [1, 1, 0]]
const K = [[1, 0, 1], [0, 2, 0], [0, 0, 1], [1, 1, 0]]
const V = [[10, 0, 0], [0, 10, 0], [1, 1, 1], [0, 0, 10]]  // "content" to pass along

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)

function softmax(scores) {
  const m = Math.max(...scores)                 // subtract max for numeric stability
  const exps = scores.map((s) => Math.exp(s - m))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

// Compute attention for ONE query token against all keys, then blend the values.
function attend(qIndex) {
  const dk = Q[qIndex].length
  const raw = K.map((k) => dot(Q[qIndex], k) / Math.sqrt(dk))  // scaled scores
  const weights = softmax(raw)

  // weighted average of the value vectors
  const output = [0, 0, 0]
  weights.forEach((w, j) => V[j].forEach((v, d) => { output[d] += w * v }))

  const pct = weights.map((w, j) => tokens[j] + " " + (w * 100).toFixed(0) + "%")
  console.log("'" + tokens[qIndex] + "' attends to -> " + pct.join(" | "))
  return output
}

tokens.forEach((_, i) => attend(i))
// Read the output: each token's attention is a soft blend, and the token most
// aligned with the query (highest dot product) grabs the biggest slice.`, solution: `// SOLUTION / extension: return the blended output vectors too, and find the
// single strongest attention link in the whole sentence.
let best = { from: null, to: null, w: -1 }
tokens.forEach((_, i) => {
  const dk = Q[i].length
  const weights = softmax(K.map((k) => dot(Q[i], k) / Math.sqrt(dk)))
  weights.forEach((w, j) => {
    if (i !== j && w > best.w) best = { from: tokens[i], to: tokens[j], w }
  })
})
console.log(\`Strongest cross-token link: '\${best.from}' -> '\${best.to}' (\${(best.w*100).toFixed(0)}%)\`)`, caption: '**Exercise:** change one row of `V` (say, make `apple` = `[0,0,99]`) and rerun. The *weights* stay identical (they depend on Q·K only) but every blended output shifts — proof that keys decide *who* you listen to and values decide *what you hear*.' },
        { type: 'callout', variant: 'info', text: "Notice what's *not* here: no loop over previous outputs, no hidden state carried forward. Every token's attention is an independent, embarrassingly-parallel computation. Swap `forEach` for real matrix multiplies on a GPU and you have a Transformer layer." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'In the sentence "The chicken didn\'t cross the road because it was too tired," how does self-attention help the model handle "it"?',
            options: [
              'It looks up "it" in a dictionary of pronoun meanings',
              'Its query matches most strongly against the key of "chicken," so it blends in that token\'s value',
              'It replaces "it" with a random earlier noun',
              'It waits until the sentence ends, then rereads from the start',
            ],
            answer: 1,
            explain: '"it" emits a query ("what noun do I refer to?"), that query has the highest dot-product similarity with "chicken"\'s key, softmax gives "chicken" the biggest weight, and its value dominates the blend. That\'s coreference resolution as pure weighted averaging.',
          },
          {
            q: 'Why split each token into a separate KEY and VALUE instead of using one vector for both?',
            options: [
              'It halves the memory the model needs',
              'Keys decide *who gets matched* while values decide *what information is passed* — separating findability from content is more expressive',
              'It is required by the softmax function',
              'Values are encrypted and keys are not',
            ],
            answer: 1,
            explain: 'A token can be worth matching on for one reason (its key) yet carry different useful content (its value). The dating-profile-vs-actual-date split lets a token be easy to find AND carry rich, unrelated information — strictly more expressive than tying them together.',
          },
          {
            q: 'A colleague says "multi-head attention just makes the model bigger for no reason." Best correction?',
            options: [
              'They\'re right; one head is always enough',
              'Each head learns a different *kind* of relationship (coreference, syntax, adjacency) in parallel, so the model tracks many relations at once',
              'Multiple heads exist only to speed up training, not to add capability',
              'Heads are copies of each other for redundancy',
            ],
            answer: 1,
            explain: 'One attention pattern can express one notion of relevance. Multiple heads with independent Q/K/V projections capture distinct relationship types simultaneously — the panel-of-specialist-proofreaders idea. It\'s about expressiveness, not redundancy or raw speed.',
          },
          {
            q: 'What did attention give Transformers that RNNs fundamentally lacked?',
            options: [
              'The ability to run on GPUs at all',
              'Parallel processing of a whole sequence AND direct long-range links between any two tokens',
              'Support for languages other than English',
              'A smaller total number of parameters',
            ],
            answer: 1,
            explain: 'RNNs are sequential (token N waits for token N−1) and funnel history through one shrinking memory vector, blurring long-range detail. Attention lets every token look directly at every other token in one parallel step — killing both the sequential bottleneck and the long-range-forgetting problem.',
          },
          {
            q: 'You\'re building translation: the English output should draw from the French input. Which mechanism is that, and where do the Keys/Values come from?',
            options: [
              'Self-attention; keys/values from the English output',
              'Cross-attention; keys/values from the French input while queries come from the English output',
              'Self-attention; keys/values from the French input',
              'Neither — attention only works within one sentence',
            ],
            answer: 1,
            explain: 'When one sequence pulls information from a *different* sequence, that\'s cross-attention: the output being generated supplies the queries, and the source (French) supplies the keys and values. Same math as self-attention; the only change is where K and V originate.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm5-l2-c1', front: 'What problem does attention solve?', back: 'A token\'s meaning depends on context (`it` → which noun? `bank` → river or money?). Attention lets each token pull in relevant information from the other tokens, with *which* tokens are relevant computed fresh every time.' },
          { id: 'm5-l2-c2', front: 'Query, Key, Value — in one line each?', back: '**Query** = what I\'m looking for. **Key** = what I advertise (for matching). **Value** = the content I hand over if picked. Match on keys, gather values.' },
          { id: 'm5-l2-c3', front: 'The attention formula in words?', back: 'Dot every query with every key → scale by √dₖ → softmax into weights that sum to 1 → take the weighted average of the value vectors. `softmax(QKᵀ/√dₖ)V`.' },
          { id: 'm5-l2-c4', front: 'What is multi-head attention?', back: 'Run attention many times in parallel, each head with its own learned Q/K/V projections, so different heads capture different relationships (coreference, syntax, adjacency) at once. Then concat + project.' },
          { id: 'm5-l2-c5', front: 'Self-attention vs. cross-attention?', back: 'Self: Q, K, V all from the *same* sequence (a sentence understanding itself). Cross: Q from one sequence, K/V from a *different* one (translation/RAG — output attending over a source).' },
          { id: 'm5-l2-c6', front: 'Why did attention beat RNNs?', back: 'Parallelism (every token attends simultaneously — no left-to-right wait) plus direct long-range links (any token can look straight at any other, no shrinking memory bottleneck).' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Attention = for each token, compute a relevance weight to every other token, then take a weighted blend of their information. That\'s the entire idea.',
          'Query / Key / Value = "what I\'m looking for / what I advertise / what I pass along." Match on keys, gather values — keeping findability separate from content.',
          'The one formula: `softmax(Q·Kᵀ / √dₖ) · V` — dot products for alignment, softmax for weights, weighted average for the output. No new math.',
          'Multi-head attention runs many attention patterns in parallel; self-attention stays within one sequence, cross-attention pulls from another.',
          'Attention beat RNNs by being parallel (whole sequence at once) and giving every token a direct link to every other — solving the long-range-memory bottleneck.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Thinking a token attends to just one other token', text: 'Attention is *soft*: it produces a weighted blend over ALL tokens. The weights are lumpy (one token may get 80%) but it\'s never a hard pick. Treating it as a discrete lookup will mislead you when reasoning about how information mixes.' },
          { title: 'Conflating keys and values', text: 'Keys are for *matching* (they meet the query); values are the *content* that flows through. A token can be easy to find for one reason and carry entirely different information. Blur them and multi-head attention stops making sense.' },
          { title: 'Believing more heads is always better', text: 'Heads add expressiveness but also cost and redundancy — studies show many heads can be pruned with little loss. Head count is a tuned hyperparameter, not a "bigger = smarter" dial. Same trap as cranking temperature for quality.' },
          { title: 'Forgetting attention alone has no sense of order', text: 'Pure attention is permutation-blind — shuffle the tokens and the math barely notices. Order is injected separately via positional encodings (next lesson). Assuming attention "knows" word order is a classic misconception.' },
        ] },
        { type: 'interview', items: [
          { q: '"Explain self-attention to me like I\'m a strong engineer who\'s never done ML."', a: 'For every token I build three vectors: a query (what I\'m looking for), a key (what I advertise), and a value (what I\'ll contribute). I dot my query against every token\'s key to get relevance scores, softmax those into weights that sum to 1, and take the weighted average of everyone\'s value vectors. That blended vector is my new, context-aware representation. It\'s just alignment-scoring plus weighted averaging — done for every token in parallel.' },
          { q: '"Why did the Transformer replace RNNs and LSTMs?"', a: 'Two reasons. Parallelism: RNNs process token N only after N−1, so you can\'t use a GPU across the sequence; attention computes all tokens\' interactions at once. And long-range dependencies: RNNs funnel history through one fixed memory that blurs distant tokens, while attention gives any token a direct, full-strength link to any other regardless of distance. Faster training plus better long-context modeling.' },
          { q: '"What does the √dₖ scaling factor do, and why does it matter?"', a: 'As the key dimension grows, dot products grow in magnitude, which pushes softmax into a near one-hot spike where gradients vanish and the model can barely learn. Dividing the scores by the square root of the key dimension keeps them in a well-behaved range so softmax stays smooth and training is stable. It doesn\'t change the concept, just the numerical health.' },
          { q: '"What\'s the difference between self-attention and cross-attention?"', a: 'The mechanism is identical; the only difference is where queries, keys, and values come from. In self-attention all three come from the same sequence — tokens enriching each other. In cross-attention the queries come from one sequence (say the text being generated) while keys and values come from a different one (the source document or input sentence), which is how translation and retrieval-augmented setups let output look back at a source.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Every LLM you\'ll ever call', text: 'GPT, Claude, Llama — all are stacks of self-attention layers. When you tune a prompt and later tokens "understand" earlier ones, that\'s attention flowing across your prompt, layer after layer.' },
          { title: 'Retrieval-augmented generation (RAG)', text: 'When a model answers using retrieved documents, cross-attention-style mechanics let the generated answer pull relevant spans from the source — the backbone of Module 7\'s RAG systems.' },
          { title: 'Attention as an interpretability lens', text: 'Researchers and debugging tools visualize attention weights (exactly like this lesson\'s demo) to see which input tokens a model "looked at" — useful for spotting why a model latched onto the wrong word.' },
          { title: 'Beyond text: vision and audio', text: 'Vision Transformers apply the identical attention math to image patches, and audio models to sound frames. The same "weight every element by relevance, then blend" idea generalized across every modality.' },
        ] },
        { type: 'project', title: 'Hand-build single-head attention', goal: 'Cement the mechanics by implementing attention end-to-end over a tiny, hand-made set of token vectors — and reading off who attends to whom.', steps: [
          'Write down 4 tokens and give each a small Q, K, and V vector by hand (start from the playground\'s numbers, then invent your own so `apple` and `robot` are clearly "aligned").',
          'Implement `dot(a, b)` and a numerically-stable `softmax(scores)` (subtract the max before `exp`).',
          'For each token: compute scaled scores (`Q·Kⱼ / √dₖ`) against all keys, softmax them into weights, then compute the weighted sum of the value vectors.',
          'Print, for every token, the attention weights as percentages so you can literally see the distribution (e.g. `robot attends to -> apple 71% | ate 18% | ...`).',
          'Deliberately edit one token\'s KEY to make it align with another token\'s query and confirm the weights shift; then edit only a VALUE and confirm the weights *don\'t* move but the outputs do.',
        ], deliverable: 'An `attention.js` (or `.py`) that prints each token\'s attention distribution, plus a two-sentence note on what changing a key did versus changing a value.' },
        { type: 'challenge', title: 'Add a second, positional head', text: 'Extend your single-head implementation into two heads and combine them. Give head 2 a **positional bias**: before softmax, add a term that rewards attending to *nearby* tokens (e.g. subtract the distance |i − j| from the score). Run both heads on the same sentence and compare their attention maps — head 1 should follow content/alignment, head 2 should hug neighbors. This is a miniature of what real multi-head attention discovers on its own.', hints: [
          'Keep head 1 exactly as-is; head 2 is the same code with `score = dot(q, k)/√dₖ − Math.abs(i - j)` before softmax.',
          'Combine heads by concatenating their output vectors (real Transformers then multiply by a learned projection — you can skip that and just print both).',
          'Print both heads\' weight rows side by side for the same query token; the contrast between "content" and "position" attention is the whole point.',
        ] },
        { type: 'reading', links: [
          { label: 'The Illustrated Transformer — Jay Alammar', url: 'https://jalammar.github.io/illustrated-transformer/', note: 'The definitive visual walkthrough of Q/K/V and multi-head attention. If you read one thing, read this.' },
          { label: 'Attention Is All You Need (2017)', url: 'https://arxiv.org/abs/1706.03762', note: 'The original paper. Skim the abstract and Figures 1–2 — you now have the vocabulary to read the scaled-dot-product diagram.' },
          { label: '3Blue1Brown: Attention in transformers (visual)', url: 'https://www.youtube.com/watch?v=eMlx5fFNoYc', note: 'Grant Sanderson\'s geometric intuition for attention — the perfect complement to Alammar\'s diagrams.' },
        ] },
      ],
    },
  ],
}
