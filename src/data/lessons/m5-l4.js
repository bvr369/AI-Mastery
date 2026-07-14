// Lesson 5.4 — Tokenizers Deep Dive

export default {
  sections: [
    {
      id: 'why-subwords',
      title: 'Back to tokens — but this time, under the hood',
      blocks: [
        { type: 'p', text: "Way back in Lesson 1.2 you met the [[Token]]: the chunk a model actually reads and writes, ~4 characters, priced per-token. We waved a hand and said *\"a tokenizer chops text into pieces.\"* This lesson opens that black box. **How** does the tokenizer decide the pieces? Why does `strawberry` split weirdly? Why does the *same paragraph* cost more tokens in Spanish than English, and more again as code? The answer to all three is one algorithm: [[BPE]]." },
        { type: 'p', text: "Before the algorithm, the design question it answers. You want to turn text into a fixed vocabulary of integer IDs the model can embed (Lesson 5.1). There are three obvious ways to slice text, and two of them are traps." },
        { type: 'h', text: 'Option A — one token per word' },
        { type: 'p', text: "Feels natural. It's a disaster. English alone has millions of word forms (`run`, `runs`, `running`, `runner`, `run's`…), plus names, typos, URLs, and every new coinage. Your vocabulary explodes toward infinity, the embedding table becomes enormous, and the moment a user types a word you've never seen — `skibidi`, a new API name, a rare surname — you have **no token for it at all**. That's the dreaded *out-of-vocabulary* (OOV) problem: the model literally cannot represent the input." },
        { type: 'h', text: 'Option B — one token per character' },
        { type: 'p', text: "The opposite extreme. A vocabulary of ~100 characters never has an OOV problem — anything can be spelled out. But now the sequences are *brutally* long: `tokenizer` becomes 9 tokens instead of 1. Since every token is a full forward pass (Lesson 1.2) and attention cost grows with sequence length (Lesson 5.3), you've made everything slower and more expensive, and you've forced the model to relearn that `t-h-e` means \"the\" from scratch, every time." },
        { type: 'h', text: 'Option C — subwords (the winner)' },
        { type: 'p', text: "The compromise that every modern LLM ships: a vocabulary of **subword** pieces. Common whole words get their own token (`the`, ` react`, ` function`). Rare words break into reusable fragments (`tokenizer` → ` token` + `izer`). You get a **fixed, manageable vocabulary** (typically 50k–200k pieces), you **never** hit OOV because worst case you fall back to characters, and common text stays short. Best of both worlds — and BPE is how the vocabulary gets built." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: LEGO for language', text: "Word-level tokenization is buying a unique pre-molded LEGO piece for every object you might ever build — you'd need infinite bins and you're stuck the moment someone wants a shape you don't stock. Character-level is building everything from 1×1 studs — universal, but a castle takes ten thousand pieces. Subwords are a smart LEGO set: whole pre-built chunks for the parts you use constantly (a wall, a window), tiny studs for the weird custom bits. Frequent things are cheap; nothing is impossible to build." },
      ],
    },
    {
      id: 'bpe-algorithm',
      title: 'BPE: the whole algorithm in five sentences',
      blocks: [
        { type: 'p', text: "[[BPE]] stands for **Byte-Pair Encoding**. It started life in the 1990s as a *text compression* trick and got repurposed for tokenization. The genius is that it's not hand-written rules — it's **learned from a giant corpus** by a loop so simple you'll implement it yourself in a minute." },
        { type: 'p', text: "Here is the entire training algorithm:" },
        { type: 'list', items: [
          "**1 · Start from characters.** Every word is initially a sequence of single-character tokens. Vocabulary = the set of characters (or bytes).",
          "**2 · Count adjacent pairs.** Scan the whole corpus and tally how often each *pair* of neighboring tokens occurs. In English, `t` followed by `h` is wildly common.",
          "**3 · Merge the most frequent pair.** Take the #1 pair, glue it into a single new token, and add it to the vocabulary. Every `t`+`h` in the corpus becomes one `th` token.",
          "**4 · Repeat.** Re-count pairs (now `th`+`e` is a candidate), merge the top one, add it. Then again, and again.",
          "**5 · Stop at a target vocab size.** After ~50k merges you have a vocabulary of learned pieces, and an *ordered list of merge rules* — that ordered list IS the tokenizer.",
        ] },
        { type: 'callout', variant: 'info', title: 'Training vs. encoding', text: "Two phases, don't conflate them. **Training** (above) runs once, offline, on a huge corpus, and produces the merge rules — you almost never do this. **Encoding** is what happens on every API call: your text is split into characters, then the learned merges are applied *in the same order they were learned* until no more apply. Fast, deterministic, and the reason token counts are perfectly reproducible." },
        { type: 'p', text: "Notice the emergent magic: because merges follow *frequency*, the pieces that end up as single tokens are exactly the ones that appear most in the training data. Common English words get fully merged into one token. A rare word — or a word in a language that was scarce in training — never accumulates enough merges, so it stays fragmented. **Frequency in the training corpus decides who's cheap.** Hold that thought; it explains the entire cost section." },
      ],
    },
    {
      id: 'watch-it-run',
      title: 'Watch BPE learn a vocabulary',
      blocks: [
        { type: 'p', text: "Reading the algorithm is one thing; *watching* it eat a corpus is where it clicks. Step through the merges below on a tiny training set. Each step finds the most frequent adjacent pair and fuses it into a new token — exactly steps 2–4 above. Watch how `low`, `lower`, `newest`, `widest` gradually assemble common chunks like `est` and `low` out of raw letters." },
        { type: 'demo', id: 'bpe-builder' },
        { type: 'p', text: "Two things to notice as you step. First, the **order** of merges is fixed and meaningful — `es` must form before `est` can, because `est` is built by merging `es`+`t`. That ordered list of merges is the entire trained tokenizer. Second, after a handful of merges, a frequent suffix like `est` is a **single token**, so `newest` and `widest` now share it — the model gets to reuse what it learned about `est` everywhere it appears. That reuse is *why* subwords beat characters: structure gets captured once." },
        { type: 'callout', variant: 'tip', text: "This is the same shape of algorithm as Huffman coding or any greedy-merge compressor you may have seen: repeatedly fuse the most common thing. If you've ever built a frequency map and pulled the top entry in a loop, you already know BPE — you just didn't know it had a fancy name." },
      ],
    },
    {
      id: 'consequences',
      title: 'The consequences: cost, languages, and counting letters',
      blocks: [
        { type: 'p', text: "BPE isn't trivia — its mechanics leak directly into your bills, your latency, and a famous class of model failures. Once you see *why*, these stop being surprises." },
        { type: 'h', text: 'Consequence 1 — different content tokenizes at different rates (this is money)' },
        { type: 'p', text: "Because merges are learned from a corpus that was **mostly English prose**, English is the most efficiently packed. Everything else pays a tax:" },
        { type: 'table', headers: ['Content', 'Roughly...', 'Why'], rows: [
          ['English prose', '~1 token / 4 chars', 'The corpus was mostly this — common words are single tokens.'],
          ['Code', '~1 token / 2–3 chars', 'Symbols, indentation, `camelCase`, and `snake_case` fragment; whitespace becomes its own tokens.'],
          ['Non-English (e.g. Spanish, Hindi)', '~1.5–3× the tokens of the English equivalent', 'Underrepresented in training → fewer merges → words stay in small pieces. CJK and many scripts fare worse.'],
          ['Random strings / IDs / base64', 'close to 1 token / char', 'No learnable structure to merge — it degrades toward character-level.'],
        ] },
        { type: 'callout', variant: 'warn', title: 'This is a real fairness and cost issue', text: "The same sentence can cost a Hindi or Thai user **2–3× more tokens** — and therefore more money and more of the context window — than an English user, for identical meaning. If you build for a global audience, budget tokens per *language*, not per *character count*. It's a documented equity problem, not an edge case." },
        { type: 'h', text: 'Consequence 2 — why models "can\'t count the letters in strawberry"' },
        { type: 'p', text: "The infamous *\"how many r's in strawberry?\"* stumble (you met it in Lesson 1.5) is a **tokenization** artifact, not a reasoning failure. The model never sees `s-t-r-a-w-b-e-r-r-y`. It sees something like `[str][aw][berry]` — three opaque token IDs. Asking it to count `r`s is like asking you to count the letter `r` in three flashcards showing *pictures* of syllables, without ever spelling them. The letters were dissolved into IDs before the model ever got them." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: counting bricks by looking at walls', text: "You hand someone photos of three pre-built wall sections and ask \"how many red bricks total?\" They can *guess* from experience, but they can't *count* — the individual bricks were fused into wall-chunks before they saw them. That's the model with `strawberry`. The fix isn't a smarter model; it's giving it a tool that operates on raw characters (Module 8), or asking it to spell the word out letter-by-letter first so the characters re-enter the token stream." },
        { type: 'h', text: 'Consequence 3 — whitespace and casing are part of the token' },
        { type: 'p', text: "A subtlety that bites everyone eventually: in most modern tokenizers the **leading space is part of the token**. ` the` (with a space) and `the` (without) are *different token IDs*, and `The`, `THE`, `the` can all differ too. That's why a stray double-space or an unusual capitalization can quietly change your token count — and why concatenating strings without minding spaces can tokenize worse than you'd expect." },
        { type: 'callout', variant: 'info', title: 'A nod to byte-level BPE', text: "Modern tokenizers (GPT-2 onward, and `tiktoken`) run BPE not over characters but over **raw bytes** (UTF-8). This is the clever move that *guarantees* zero OOV forever: any input — an emoji, a Klingon glyph, a corrupted byte — is just a sequence of bytes, and bytes are always in the vocabulary. The trade-off is that non-ASCII characters span multiple bytes, so a single emoji or CJK character can cost several tokens. Byte-level BPE is why you can paste literally anything into a modern model and it never errors on unknown characters." },
      ],
    },
    {
      id: 'code-and-play',
      title: 'Count real tokens, then run the algorithm yourself',
      blocks: [
        { type: 'p', text: "In practice you rarely implement BPE — you *use* a tokenizer to estimate cost and stay under limits before you ship. For OpenAI models that's `tiktoken`; every provider ships an equivalent. Here's the real thing counting real tokens, so you can see the language/code tax in actual numbers:" },
        { type: 'code', lang: 'python', filename: 'count_tokens.py', code: `import tiktoken

# Load the tokenizer for a specific model family.
# "o200k_base" is used by GPT-4o / o-series; "cl100k_base" by GPT-4/3.5.
enc = tiktoken.encoding_for_model("gpt-4o")

def report(label, text):
    ids = enc.encode(text)
    print(f"{label:>10}: {len(ids):>3} tokens, {len(text):>3} chars  ->  {ids[:8]}...")

report("english", "The quick brown fox jumps over the lazy dog.")
report("spanish", "El rápido zorro marrón salta sobre el perro perezoso.")
report("code",    "const sum = (a, b) => a + b;  // add two numbers")
report("weird",   "strawberry")

# See the actual pieces, not just the count:
for tid in enc.encode(" strawberry"):
    print(repr(enc.decode([tid])))   # -> ' straw', 'berry'  (leading space kept!)

# Rough cost estimate before an API call:
tokens = len(enc.encode(my_prompt))
cost   = tokens / 1_000_000 * 2.50   # $ per 1M input tokens (illustrative)
print(f"~{tokens} tokens, ~"+ f"$ {cost:.4f}")`, caption: 'The English/Spanish/code lines will show visibly different token-per-character rates — the cost tax made concrete. `tiktoken` is deterministic, so these counts are exactly what you\'ll be billed for input.' },
        { type: 'p', text: "Now run the *training* side yourself. The playground below implements one BPE merge step in plain JavaScript: count every adjacent pair across a tiny corpus, find the most frequent, and merge it. Run it, then bump `NUM_MERGES` up and watch a vocabulary assemble itself out of raw letters — the exact loop the demo animated." },
        { type: 'playground', id: 'bpe-merge', title: 'Toy BPE: watch merges form', height: 460, code: `// A minimal Byte-Pair Encoding TRAINER in ~25 lines.
// Corpus is a word->frequency map (BPE weights by how often a word appears).
const corpus = { "low": 5, "lower": 2, "newest": 6, "widest": 3 }

// Each word starts as a list of single-character tokens.
let words = Object.entries(corpus).map(([w, freq]) => ({
  tokens: w.split(""),
  freq,
}))

const NUM_MERGES = 4   // <-- try 1, then 8. Watch the vocab grow.
const merges = []

for (let step = 0; step < NUM_MERGES; step++) {
  // 1) Count every adjacent pair, weighted by word frequency.
  const pairCounts = {}
  for (const { tokens, freq } of words) {
    for (let i = 0; i < tokens.length - 1; i++) {
      const pair = tokens[i] + "\\u0000" + tokens[i + 1]  // null-join = safe key
      pairCounts[pair] = (pairCounts[pair] || 0) + freq
    }
  }
  if (Object.keys(pairCounts).length === 0) break

  // 2) Find the most frequent pair.
  const [bestKey, bestCount] = Object.entries(pairCounts)
    .sort((a, b) => b[1] - a[1])[0]
  const [a, b] = bestKey.split("\\u0000")
  merges.push(a + b)
  console.log(\`merge #\${step + 1}: "\${a}" + "\${b}"  (seen \${bestCount}x)  ->  "\${a + b}"\`)

  // 3) Apply the merge everywhere: replace a,b with the fused token.
  words = words.map(({ tokens, freq }) => {
    const out = []
    for (let i = 0; i < tokens.length; i++) {
      if (i < tokens.length - 1 && tokens[i] === a && tokens[i + 1] === b) {
        out.push(a + b); i++            // consume both
      } else out.push(tokens[i])
    }
    return { tokens: out, freq }
  })
}

console.log("\\nLearned merges (the tokenizer):", merges)
console.log("Final tokenization:")
for (const { tokens } of words) console.log("  ", tokens.join(" | "))`, solution: `// SOLUTION / EXTENSION: encode a NEW word using the learned merges.
// (Same trainer as above; then apply 'merges' in order to a test word.)
const corpus = { "low": 5, "lower": 2, "newest": 6, "widest": 3 }
let words = Object.entries(corpus).map(([w, freq]) => ({ tokens: w.split(""), freq }))
const merges = []
for (let step = 0; step < 8; step++) {
  const pc = {}
  for (const { tokens, freq } of words)
    for (let i = 0; i < tokens.length - 1; i++) {
      const p = tokens[i] + "\\u0000" + tokens[i + 1]; pc[p] = (pc[p] || 0) + freq
    }
  if (!Object.keys(pc).length) break
  const [best] = Object.entries(pc).sort((a, b) => b[1] - a[1])[0]
  const [a, b] = best.split("\\u0000"); merges.push([a, b])
  words = words.map(({ tokens, freq }) => {
    const out = []
    for (let i = 0; i < tokens.length; i++) {
      if (i < tokens.length - 1 && tokens[i] === a && tokens[i + 1] === b) { out.push(a + b); i++ }
      else out.push(tokens[i])
    }
    return { tokens: out, freq }
  })
}

// ENCODE a brand-new word: start from chars, apply learned merges in order.
function encode(word) {
  let toks = word.split("")
  for (const [a, b] of merges) {
    const out = []
    for (let i = 0; i < toks.length; i++) {
      if (i < toks.length - 1 && toks[i] === a && toks[i + 1] === b) { out.push(a + b); i++ }
      else out.push(toks[i])
    }
    toks = out
  }
  return toks
}
console.log("Learned merges:", merges.map(([a, b]) => a + b))
console.log("encode('lowest') ->", encode("lowest"))   // reuses 'low' + learned pieces
console.log("encode('newer')  ->", encode("newer"))`, caption: '**Exercise:** run it as-is, then change `NUM_MERGES` to 8 and watch `est`, `low`, `wid` assemble. Stretch (in the solution): keep the learned `merges` and write an `encode(word)` that tokenizes a *new* word like `lowest` by replaying the merges in order — that\'s exactly how encoding works on every API call.' },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Why do modern LLMs use subword tokenization instead of one-token-per-word?',
            options: [
              'Subwords are faster to render in the UI',
              'Word-level vocab explodes toward infinity and hits out-of-vocabulary words it can\'t represent; subwords keep a fixed vocab with no OOV',
              'Words contain too much meaning for the model to process',
              'It\'s a legal requirement from model providers',
            ],
            answer: 1,
            explain: 'Word-level tokenization needs a near-infinite vocabulary and still breaks on any unseen word (OOV). Subwords give a fixed 50k–200k vocab and gracefully fall back to smaller pieces (down to bytes), so nothing is ever unrepresentable.',
          },
          {
            q: 'In BPE training, how is the next merge chosen at each step?',
            options: [
              'The longest possible pair is merged first',
              'A human linguist labels which pairs are meaningful',
              'The most frequent adjacent pair in the corpus is merged into one new token',
              'Pairs are merged in random order until the vocab is full',
            ],
            answer: 2,
            explain: 'BPE is a greedy frequency loop: count all adjacent pairs, merge the single most frequent one, add it to the vocab, repeat. Frequency — not length or hand-labeling — drives every merge, which is why common words end up as single tokens.',
          },
          {
            q: 'A user reports your app costs far more for Hindi text than English of the same length. The root cause?',
            options: [
              'Hindi Unicode characters are a bug in the API',
              'The tokenizer was trained mostly on English, so Hindi accumulates fewer merges and stays fragmented into more tokens',
              'Hindi requires a slower, more expensive model',
              'The context window shrinks for non-English languages',
            ],
            answer: 1,
            explain: 'Merges are learned from a mostly-English corpus, so English words fuse into single tokens while underrepresented languages stay in small pieces — often 1.5–3× more tokens for identical meaning. More tokens = more cost and more context consumed. Budget tokens per language.',
          },
          {
            q: 'Why does a model struggle to count the number of "r"s in "strawberry"?',
            options: [
              'The model is bad at arithmetic in general',
              'It sees a few opaque token IDs like [str][aw][berry], not individual letters — the characters were fused away before it ever received the word',
              'The temperature is set too high',
              'Strawberry isn\'t in the model\'s vocabulary',
            ],
            answer: 1,
            explain: 'It\'s a tokenization artifact, not a reasoning flaw. The word arrives as a handful of subword IDs, so the individual letters are invisible to the model. Fixes: give it a character-level tool (Module 8), or have it spell the word out first so the letters re-enter the token stream.',
          },
          {
            q: 'What does byte-level BPE (GPT-2 / tiktoken) buy you over character-level BPE?',
            options: [
              'It makes every language cost the same number of tokens',
              'It guarantees zero out-of-vocabulary inputs forever, because any input is just bytes and every byte is in the vocab',
              'It removes the need for embeddings',
              'It lets the model count letters accurately',
            ],
            answer: 1,
            explain: 'Running BPE over raw UTF-8 bytes means literally any input — emoji, rare scripts, corrupted data — decomposes into bytes that are always in the vocabulary, so OOV becomes impossible. The trade-off: multi-byte characters (emoji, CJK) can cost several tokens each.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm5-l4-c1', front: 'Why subwords instead of words or characters?', back: 'Words → vocab explodes + out-of-vocabulary failures. Characters → sequences too long/expensive. Subwords are the compromise: fixed vocab, no OOV, common words stay one token.' },
          { id: 'm5-l4-c2', front: 'The BPE training loop in one line?', back: 'Start from characters → count adjacent pairs → merge the most frequent pair into a new token → repeat until target vocab size. The ordered list of merges IS the tokenizer.' },
          { id: 'm5-l4-c3', front: 'Why do common words become single tokens?', back: 'Merges follow frequency, so the most common character sequences get fused first. Rare words never accumulate enough merges and stay fragmented into pieces.' },
          { id: 'm5-l4-c4', front: 'Why does the same text cost more tokens in some languages / in code?', back: 'The corpus was mostly English prose. Underrepresented languages and symbol-heavy code get fewer merges → more tokens for the same meaning → more cost and context used.' },
          { id: 'm5-l4-c5', front: 'Why can\'t models reliably count letters in a word?', back: 'The word arrives as a few opaque subword token IDs (e.g. [str][aw][berry]); the individual characters were dissolved before the model saw them. It\'s tokenization, not reasoning.' },
          { id: 'm5-l4-c6', front: 'What is byte-level BPE and why use it?', back: 'BPE run over raw UTF-8 bytes instead of characters. Guarantees zero OOV forever (everything is bytes), at the cost of multi-byte chars like emoji/CJK spanning several tokens.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Tokenizers pick subwords because words explode the vocabulary (and hit OOV) while characters make sequences too long — subwords are the fixed-vocab, no-OOV compromise.',
          'BPE learns the vocabulary by a greedy loop: start from characters, repeatedly merge the most frequent adjacent pair, stop at a target size. The ordered merges are the tokenizer.',
          'Frequency decides cost: common English words become single tokens; rare words, code, and underrepresented languages fragment — often 1.5–3× more tokens for the same meaning.',
          'The "count the r\'s in strawberry" failure is a tokenization artifact: the model sees opaque subword IDs, not letters.',
          'Byte-level BPE runs over raw UTF-8 bytes, guaranteeing zero out-of-vocabulary inputs; leading spaces and casing are part of the token, so they change counts.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Estimating cost from character count alone', text: 'Chars-per-token varies wildly by content: ~4 for English, ~2–3 for code, far worse for non-English or random IDs. Always run the real tokenizer (`tiktoken` or the provider\'s) on representative text before budgeting or setting limits.' },
          { title: 'Blaming the model for the "strawberry" letter-counting miss', text: 'It\'s not a reasoning bug you can prompt around with "think harder." The letters are gone before the model receives them. Fix it structurally: a character-level tool, or make it spell the word out first.' },
          { title: 'Ignoring leading spaces and casing', text: '` the`, `the`, `The`, and `THE` can be different token IDs. Sloppy string concatenation or double spaces quietly inflate token counts and can even shift model behavior. Mind the spaces when you build prompts programmatically.' },
          { title: 'Assuming all languages cost the same', text: 'Shipping a global app on English token budgets under-provisions non-English users on both cost and context window. Measure token rates per target language and size limits accordingly — it\'s a real equity and reliability issue.' },
        ] },
        { type: 'interview', items: [
          { q: '"Explain how a tokenizer decides where to split text."', a: 'Modern LLMs use subword tokenization, and the vocabulary is learned by Byte-Pair Encoding. Training starts with every word as characters, then repeatedly counts adjacent token pairs across a big corpus and merges the most frequent pair into a new token, stopping at a target vocab size (say 100k). Encoding replays those learned merges in order on new text. Because merges follow frequency, common words become single tokens and rare words stay fragmented — that\'s the whole reason token counts vary by language and content type.' },
          { q: '"Why can\'t GPT models reliably count characters or reverse a word?"', a: 'Tokenization. The model never sees raw characters — text is split into subword token IDs before it reaches the network, so `strawberry` might arrive as three opaque pieces. Character-level operations are asking it to introspect information that was destroyed at the input boundary. The production fix is a tool call that works on raw characters, or prompting the model to spell the word out letter-by-letter so the characters re-enter the token stream.' },
          { q: '"How would you estimate the API cost of a feature before building it?"', a: 'Run the actual tokenizer (`tiktoken` for OpenAI, the provider\'s equivalent otherwise) over representative real inputs — not character-count heuristics, because code and non-English tokenize much denser than English. Multiply token counts by the per-token input/output prices, account for the system prompt and any RAG context that rides along on every call, and test across the languages you\'ll actually serve since non-English can cost several times more for the same content.' },
          { q: '"What is byte-level BPE and why does it matter?"', a: 'It runs the BPE merge algorithm over raw UTF-8 bytes instead of Unicode characters. The payoff is that out-of-vocabulary becomes impossible — any input, including emoji, rare scripts, or corrupted data, decomposes into bytes that are always in the vocabulary, so the model never errors on unknown characters. The cost is that multi-byte characters like emoji or CJK span several tokens each, contributing to the cross-language cost gap.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Pre-flight cost & limit guards', text: 'Production apps tokenize prompts before sending — to reject or trim inputs that would blow the context window, and to show users a live token/cost meter. All of it runs on the same BPE tokenizer the model uses.' },
          { title: 'Chunking for RAG', text: 'When you split documents for retrieval (Module 6), you chunk by *token* count, not character count, so each chunk reliably fits the embedding model\'s limit. A tokenizer is a mandatory dependency of any RAG pipeline.' },
          { title: 'Multilingual pricing & UX decisions', text: 'Teams serving non-English markets measure the token tax per language to set fair usage quotas, choose models with better multilingual tokenizers, and decide where the economics actually work.' },
          { title: 'Prompt compression', text: 'Because output tokens cost the most, teams tune prompts and formats to tokenize efficiently — favoring words the tokenizer packs tightly and trimming whitespace/boilerplate that fragments into extra tokens.' },
        ] },
        { type: 'project', title: 'Build a toy BPE tokenizer', goal: 'Cement the algorithm by training and using your own BPE tokenizer on a small corpus, then observing how it slices a word it never saw.', steps: [
          'Take a small corpus (a paragraph, or a word→frequency map like the playground\'s). Represent every word as a list of single-character tokens.',
          'Write the merge loop: count all adjacent pairs weighted by word frequency, find the most frequent, fuse it into a new token, and record the merge. Run it for N merges (try N = 10).',
          'Print the ordered list of learned merges — that list is your trained tokenizer — and the final tokenization of each corpus word.',
          'Write an `encode(word)` that tokenizes a brand-new test word (e.g. `lowest`, `newer`) by replaying the learned merges in order, starting from characters.',
          'Compare your `encode` output against a real tokenizer on the same words (paste into the OpenAI tokenizer playground). Note where yours splits differently and why — corpus size and content decide everything.',
        ], deliverable: 'A `bpe.js` (or `bpe.py`) that prints the learned merges, the corpus tokenization, and the tokenization of two unseen test words, plus a short note comparing it to a real tokenizer.' },
        { type: 'challenge', title: 'The multilingual token tax', text: 'Take one identical paragraph (~100 words) and produce three versions: plain English prose, the same content as a code snippet/config, and a faithful translation into a non-Latin-script language (e.g. Hindi, Japanese, or Arabic). Tokenize all three with a real tokenizer and record the token counts. Then write up the cost implication: at a given per-token price, how much more does each version cost, and what would that mean for a global product at scale?', hints: [
          'Use the OpenAI tokenizer playground or `tiktoken` so the counts are the real billed numbers, not estimates.',
          'Normalize by *meaning*, not character count — the whole point is that equal meaning costs unequal tokens.',
          'Tie it back to the mechanism in your write-up: fewer training-corpus occurrences → fewer merges → more tokens. That sentence is the interview answer.',
        ] },
        { type: 'reading', links: [
          { label: 'The Illustrated GPT-2 — Jay Alammar', url: 'https://jalammar.github.io/illustrated-gpt2/', note: 'The classic visual explainer; its tokenization section makes byte-level BPE click.' },
          { label: 'tiktoken (OpenAI\'s tokenizer) — GitHub', url: 'https://github.com/openai/tiktoken', note: 'The real, fast BPE tokenizer used by GPT-4/4o. Read the README and run the examples on your own text.' },
          { label: 'Hugging Face NLP course — Byte-Pair Encoding', url: 'https://huggingface.co/learn/nlp-course/chapter6/5', note: 'A step-by-step BPE walkthrough with training and encoding code — the rigorous companion to this lesson.' },
        ] },
      ],
    },
  ],
}
