// Lesson 6.2 — Similarity Without Tears

export default {
  sections: [
    {
      id: 'angle-not-distance',
      title: 'Cosine similarity is just "do these two arrows point the same way?"',
      blocks: [
        { type: 'p', text: "You survived embeddings (Lesson 5.1): text becomes a vector, similar meanings land near each other. This lesson zooms in on the one measurement that powers every retriever you'll ever build — [[Cosine Similarity]] — and does it **code-first, math-anxiety-free**. No proofs, no Greek letters you have to decode. If you can write a `for` loop, you already know enough linear algebra for this." },
        { type: 'p', text: "Here's the entire idea in one sentence. Every embedding is an **arrow** pointing out from the origin. Cosine similarity measures the **angle** between two arrows — nothing else. Point the same way? Score near **1**. Perpendicular? Near **0**. Opposite? Near **−1**. That's the whole concept; everything below is just making it concrete." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: two people pointing at the horizon', text: "Stand two people back-to-back at the same spot and ask each to point at something. Cosine similarity ignores *how far away* the thing is and *how long their arms are* — it only asks **how aligned their pointing directions are**. Both pointing at the same mountain → aligned → score ~1. One points north, one points east → perpendicular → ~0. One points north, the other south → opposite → −1. Meaning-space works the same way: which direction you point *is* your meaning; the length of the arrow is noise." },
        { type: 'p', text: "Why the angle and not the plain distance between the arrow tips? Because in embedding space **direction carries meaning and length mostly carries other stuff** — how long the text is, how emphatic it is, quirks of the model. A one-line note and a five-paragraph essay about the same bug should count as similar. They point the same way; one arrow is just longer. Cosine throws the length away on purpose so those two still match." },
        { type: 'callout', variant: 'info', title: 'You already met this in 5.1 — now we go deep', text: "Lesson 5.1 introduced cosine as a four-line function so semantic search would make sense. This lesson is the deep dive: *why* it ignores magnitude, when that helps and when it bites, how it relates to dot product and Euclidean distance, and — critically — how to read the actual scores without fooling yourself. This is the math interviewers probe and juniors get wrong." },
      ],
    },
    {
      id: 'the-formula-as-code',
      title: 'The formula, as four lines of JavaScript',
      blocks: [
        { type: 'p', text: "Textbooks write cosine similarity as `cos(θ) = (a · b) / (‖a‖ ‖b‖)` and half the room checks out. Ignore the notation. Translated to code it's three tiny helpers and a division — and each piece has a plain-English job." },
        { type: 'code', lang: 'javascript', filename: 'cosine.js', code: `// The whole thing. Three helpers, one division.

// 1) dot product: multiply the vectors element-by-element, add it all up.
//    Big when the arrows point the same way; near zero when perpendicular.
function dot(a, b) {
  return a.reduce((sum, x, i) => sum + x * b[i], 0)
}

// 2) norm = length of the arrow (Pythagoras in N dimensions).
//    It's literally sqrt(dot(a, a)).
function norm(a) {
  return Math.sqrt(dot(a, a))
}

// 3) cosine = dot product of the two DIRECTIONS.
//    Dividing by the lengths cancels magnitude, leaving pure angle.
function cosine(a, b) {
  return dot(a, b) / (norm(a) * norm(b))
}`, caption: 'No trig, no calculus. dot() adds up element-wise products; norm() is the arrow length; cosine() divides the magnitude out.' },
        { type: 'p', text: "Read the pieces slowly, because this is the entire mental model:" },
        { type: 'list', items: [
          "**`dot(a, b)`** — walk both vectors in lockstep, multiply matching slots, sum. When two arrows point the same way their components have the same signs, so the products are positive and the sum is large. When they're perpendicular, positives and negatives cancel and it lands near 0. The dot product already *smells* alignment — but it's also inflated by long arrows.",
          "**`norm(a)`** — the length of the arrow, `sqrt(a·a)`. Just Pythagoras extended past 2D. Nothing mysterious.",
          "**`cosine(a, b)`** — divide the raw dot product by both lengths. That division is the magic step: it strips out \"how long\" and leaves only \"which way,\" i.e. the cosine of the angle. Range is always −1 to 1, no matter how big the vectors are.",
        ] },
        { type: 'callout', variant: 'tip', title: 'Why the range is guaranteed −1…1', text: "Because you divided by the lengths, you normalized both arrows to unit length before comparing. The dot product of two unit-length arrows is *by definition* the cosine of the angle between them — and cosine of any angle lives in [−1, 1]. So a cosine score can never be 7 or 40; if you see that, you computed a raw dot product, not cosine." },
        { type: 'code', lang: 'javascript', filename: 'sanity-checks.js', code: `cosine([1, 0], [1, 0])     // 1     — identical direction
cosine([1, 0], [0, 1])     // 0     — perpendicular / unrelated
cosine([1, 0], [-1, 0])    // -1    — exact opposite
cosine([2, 1], [4, 2])     // 1     — same direction, arrow twice as long: STILL 1
cosine([1, 0], [1, 1])     // 0.707 — 45° apart` , caption: 'The fourth line is the point of the whole lesson: doubling a vector\'s length does not change its cosine to anything. Direction only.' },
      ],
    },
    {
      id: 'ignores-magnitude',
      title: 'Why cosine ignores length — and the one time that hurts',
      blocks: [
        { type: 'p', text: "\"Ignores magnitude\" sounds like a limitation. Usually it's the feature. But a good engineer knows the edge where it turns into a bug, so let's nail both sides." },
        { type: 'h', text: 'When ignoring length is exactly right (the common case)' },
        { type: 'p', text: "For text retrieval, magnitude is mostly a distraction. A tweet and a manual chapter about the same topic differ wildly in arrow length but should still count as related. Cosine says \"same direction, who cares about length\" and matches them. This is why cosine is the default for semantic search, RAG retrieval, clustering, and recommendations — the tasks you'll actually ship." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: volume vs. words', text: "Two people say \"I love this product.\" One whispers, one shouts. Cosine hears the *words* (direction) and calls them identical; a magnitude-sensitive metric would treat the shout as a different, \"bigger\" statement. For meaning, you want to hear the words, not the volume." },
        { type: 'h', text: 'When ignoring length bites you' },
        { type: 'p', text: "Sometimes magnitude *is* the signal and cosine happily throws it away. Classic traps:" },
        { type: 'list', items: [
          "**Counts and intensities.** If your vectors are raw word counts or ratings, a document that says \"refund\" 50 times and one that says it once point the same way — cosine calls them equal, even though the strength differs. When *amount* matters, cosine is blind to it.",
          "**Very short or empty text.** A near-empty string embeds to a tiny, noisy arrow whose direction is basically random. Cosine still returns a confident-looking number. Garbage direction in, garbage score out — length would have warned you the input was thin.",
          "**Non-normalized feature vectors** (outside learned embeddings) where the scale of each axis is meaningful. Cosine assumes only angle matters; if your axes have real units, that assumption erases information.",
        ] },
        { type: 'callout', variant: 'warn', title: 'The fix is usually upstream', text: "You rarely \"fix\" cosine — you fix the vectors. For learned text embeddings (OpenAI, Cohere, etc.) magnitude is already mostly meaningless, so cosine is correct and you move on. If you're in a regime where length matters, either pick a magnitude-aware metric (Euclidean) or engineer the magnitude into the direction. Know which regime you're in before you pick the metric." },
      ],
    },
    {
      id: 'the-demo',
      title: 'Play with it: pick two sentences, watch the angle',
      blocks: [
        { type: 'p', text: "This is the centerpiece — spend real time here. Pick two sentences, watch the cosine score **and** the angle between the two arrows update live. The goal is to build a gut feel: which sentence pairs land near 1, which drift toward 0, and how a paraphrase (different words, same meaning) still scores high." },
        { type: 'demo', id: 'cosine-playground' },
        { type: 'p', text: "Things to try, deliberately:" },
        { type: 'list', items: [
          "**A paraphrase pair** — \"how do I reset my password\" vs \"I forgot my login.\" Almost no shared words, high cosine. That gap between word-overlap and meaning-overlap is the entire reason embeddings beat keyword search.",
          "**An unrelated pair** — a sentence about cooking vs one about databases. Watch the angle open up toward 90° and the score fall toward 0.",
          "**A same-topic, different-length pair** — a terse sentence vs a wordy one on the same subject. Notice the score stays high: cosine shrugged off the length difference, exactly as designed.",
        ] },
        { type: 'callout', variant: 'tip', text: "The angle picture is a 2D shadow for your intuition — real embeddings live in hundreds of dimensions where you can't draw the angle. But the *math* is identical: cosine is the angle between the arrows no matter how many dimensions they have. The picture lies a little about position; it tells the truth about the idea." },
      ],
    },
    {
      id: 'metric-family',
      title: 'Dot product vs. cosine vs. Euclidean: pick the right ruler',
      blocks: [
        { type: 'p', text: "Cosine has two cousins you'll see in vector-DB configs and interview questions. They're all ways to measure \"closeness,\" but they answer subtly different questions. Get this table into your bones and you'll never mis-configure a retriever." },
        { type: 'table', headers: ['Metric', 'Question it answers', 'Sensitive to length?', 'Typical use'], rows: [
          ['**Dot product** `a·b`', 'How aligned AND how long?', 'Yes — longer arrows score higher', 'Fast retrieval when vectors are already normalized (then it *equals* cosine)'],
          ['**Cosine** `a·b / (‖a‖‖b‖)`', 'How aligned (angle only)?', 'No — magnitude divided out', 'Default for text similarity, semantic search, RAG'],
          ['**Euclidean** `‖a − b‖`', 'How far apart are the tips?', 'Yes — position and length both matter', 'Clustering, image/geo features, when magnitude is meaningful'],
        ] },
        { type: 'p', text: "The relationship that trips people up: **on normalized (unit-length) vectors, cosine and dot product are literally the same number**, and Euclidean distance becomes a simple function of cosine. Once every arrow has length 1, \"angle between them\" and \"dot product\" and \"straight-line gap\" all encode the same ordering — they just relabel it." },
        { type: 'code', lang: 'javascript', filename: 'normalized-equivalence.js', code: `const dot  = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (a) => Math.sqrt(dot(a, a))
const cosine = (a, b) => dot(a, b) / (norm(a) * norm(b))

// Normalize = scale an arrow to length 1, keeping its direction.
const normalize = (a) => { const n = norm(a); return a.map(x => x / n) }

const a = [3, 4]        // length 5
const b = [4, 3]        // length 5

console.log("raw dot:     ", dot(a, b))              // 24  (inflated by lengths)
console.log("cosine:      ", cosine(a, b))           // 0.96

const an = normalize(a), bn = normalize(b)
console.log("unit dot:    ", dot(an, bn))            // 0.96  <-- same as cosine!
console.log("cosine(unit):", cosine(an, bn))         // 0.96  (unchanged)

// Lesson: after normalizing, dot product == cosine similarity.
// That's WHY vector databases store unit vectors and run raw dot products:
// same answer, one fewer division, hardware-optimized at scale.`, caption: 'Normalize once at write-time, then the fast raw dot product IS cosine. This is the single most useful performance fact about similarity.' },
        { type: 'callout', variant: 'info', title: 'Higher score vs. lower distance', text: "One directional gotcha: cosine and dot product are **similarities** — bigger is more alike. Euclidean is a **distance** — smaller is more alike. When you configure a vector DB, check whether it wants a metric where you *maximize* (cosine/dot) or *minimize* (L2/Euclidean). Getting this backwards silently returns your worst matches as your best." },
      ],
    },
    {
      id: 'reading-scores',
      title: 'Reading the scores without fooling yourself',
      blocks: [
        { type: 'p', text: "Here's the mistake that separates juniors from people who've shipped retrieval: **there is no universal \"similar\" threshold.** A cosine of 0.82 is not objectively \"a match.\" Scores are **relative and dataset-dependent** — you interpret them *within one model, one corpus*, by ranking, not by a magic cutoff." },
        { type: 'h', text: 'Why 0.7 means nothing on its own' },
        { type: 'list', items: [
          "**Different models compress the range differently.** Some embedding models pack almost everything into 0.6–0.9, so 0.75 might be \"unrelated\" for that model. Others spread scores wide. The number without the model is meaningless.",
          "**Anisotropy.** Many embedding spaces are \"cone-shaped\": vectors cluster in one region, so even random unrelated texts score a suspiciously high baseline (say 0.4+). The *floor* isn't 0. What matters is how far above that model's floor a pair sits.",
          "**The task sets the bar.** For deduplication you might need 0.95+. For \"vaguely related, feed it to the LLM anyway\" retrieval, 0.3 above the noise floor might be plenty. Same metric, totally different useful threshold.",
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: grading on a curve', text: "A raw exam score of 72 tells you nothing until you know the class. In a class where everyone scores 90+, a 72 is failing; in a brutal class where the mean is 55, it's an A. Cosine scores are the same: **grade on the curve of your own dataset and model.** Rank the candidates and look at the *gaps* between them, not the absolute number." },
        { type: 'callout', variant: 'warn', title: 'The cardinal sin: comparing scores across models', text: "A 0.85 from OpenAI's `text-embedding-3-small` and a 0.85 from a different model are **not comparable** — they live in different spaces with different distributions. Never hardcode a threshold and reuse it after switching models. Never mix vectors from two models in one index. If you change the embedding model, you re-tune every threshold from scratch." },
        { type: 'p', text: "Practical rule of thumb: **calibrate empirically.** Embed a handful of pairs you *know* are related and a handful you know aren't, look at where the scores actually land for *your* model and *your* data, and set the threshold from that gap. Treat any threshold as a property of (model + corpus + task), never a constant you carry between projects." },
      ],
    },
    {
      id: 'in-code',
      title: 'Build a ranker: three metrics, side by side (runnable)',
      blocks: [
        { type: 'p', text: "Now make it real. The playground below implements cosine, dot product, and Euclidean over small vectors, ranks the same query with each, and shows where they agree and disagree. Run it, read the three rankings, then do the exercise in the caption. This is the exact machinery of a retriever — just with toy vectors instead of 1536-D ones." },
        { type: 'playground', id: 'metric-showdown', title: 'Cosine vs dot vs Euclidean — same data, three rulers', height: 520, code: `// Tiny 2-D "embeddings" so we can reason about them by eye.
// Two point roughly the same DIRECTION; one is just a longer arrow.
const docs = {
  "short note":  [1, 1],     // direction: 45°, length ~1.41
  "long essay":  [5, 5],     // SAME direction, much longer arrow
  "off-topic":   [1, 0],     // different direction (0°)
}

const dot   = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm  = (a) => Math.sqrt(dot(a, a))
const cosine = (a, b) => dot(a, b) / (norm(a) * norm(b))
const euclid = (a, b) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0))

const query = [1, 1]   // points at 45°, same as the two "on-topic" docs

function rankBy(scoreFn, biggerIsBetter) {
  return Object.entries(docs)
    .map(([name, v]) => ({ name, score: scoreFn(query, v) }))
    .sort((a, b) => biggerIsBetter ? b.score - a.score : a.score - b.score)
}

const show = (label, rows) => {
  console.log("\\n" + label)
  for (const { name, score } of rows) console.log(\`  \${name.padEnd(12)} \${score.toFixed(3)}\`)
}

show("COSINE (bigger = better):",    rankBy(cosine, true))
show("DOT PRODUCT (bigger = better):", rankBy(dot, true))
show("EUCLIDEAN (smaller = better):",  rankBy(euclid, false))

// Watch what happens:
// - Cosine: "short note" and "long essay" TIE at 1.0 (same direction).
// - Dot:    "long essay" WINS — the longer arrow inflates the score.
// - Euclid: "short note" wins — its tip is closest to the query's tip.
// Same data, three different "best match." The metric is a design decision.`, solution: `// SOLUTION: normalize every vector first, then cosine == dot,
// and the two agree perfectly. Euclidean on unit vectors also
// falls in line with cosine's RANKING.
const docs = { "short note":[1,1], "long essay":[5,5], "off-topic":[1,0] }

const dot   = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm  = (a) => Math.sqrt(dot(a, a))
const normalize = (a) => { const n = norm(a); return a.map(x => x / n) }
const cosine = (a, b) => dot(a, b) / (norm(a) * norm(b))
const euclid = (a, b) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0))

// Normalize the corpus AND the query to unit length.
const U = Object.fromEntries(Object.entries(docs).map(([k, v]) => [k, normalize(v)]))
const q = normalize([1, 1])

const rank = (fn, big) => Object.entries(U)
  .map(([name, v]) => ({ name, score: fn(q, v) }))
  .sort((a, b) => big ? b.score - a.score : a.score - b.score)

console.log("cosine:", rank(cosine, true))
console.log("dot   :", rank(dot, true))     // identical numbers to cosine now
console.log("euclid:", rank(euclid, false)) // same ORDER as cosine
// Moral: normalize at write-time and your metric choice stops fighting you.`, caption: '**Exercise:** run it and note how cosine ties the two same-direction docs while dot product prefers the longer one and Euclidean prefers the closer tip. Then normalize all vectors and confirm cosine and dot produce identical numbers. (Solution provided.)' },
        { type: 'h', text: 'The one-liner and the ranking loop you\'ll actually write' },
        { type: 'p', text: "In production you call an embedding API and rank real vectors. Here's the idiomatic shape in both languages — the same cosine idea, just with a real model and a batteries-included numeric library." },
        { type: 'code', lang: 'python', filename: 'rank.py', code: `import numpy as np
from openai import OpenAI

client = OpenAI()

def embed(texts):
    resp = client.embeddings.create(model="text-embedding-3-small", input=texts)
    return np.array([d.embedding for d in resp.data])

# One-liner cosine. numpy does the dot and the norms.
def cosine(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

docs = [
    "How to reset your password",
    "Our refund and return policy",
    "Setting up two-factor authentication",
]
doc_vecs = embed(docs)
query_vec = embed(["I forgot my login and can't get in"])[0]

# The ranking loop: score every doc, sort best-first.
scored = sorted(
    ((cosine(query_vec, d), doc) for d, doc in zip(doc_vecs, docs)),
    reverse=True,   # cosine is a similarity: bigger = better
)
for score, doc in scored:
    print(f"{score:.3f}  {doc}")

# Top hit: "How to reset your password" — zero shared keywords with
# "I forgot my login." Meaning won, exactly like the demo showed.`, caption: 'Swap toy vectors for a real embedding model and this ranking loop is a working semantic-search backend.' },
        { type: 'callout', variant: 'tip', title: 'In real systems, batch and normalize', text: "Two production reflexes: (1) embed documents in **batches** (one API call for many texts) — it's far cheaper and faster than one call each. (2) **Normalize once at write-time** and store unit vectors, so query-time is a raw dot product. Real vector databases (pgvector, Pinecone, FAISS) do the nearest-neighbor search for you — you rarely hand-roll the loop past a prototype — but you must still pick the right metric, and now you know how." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'You embed a two-word tweet and a five-paragraph article that are about the exact same topic. You want them to rank as highly similar. Which metric is safest?',
            options: [
              'Euclidean distance, because it measures the true gap between the vectors',
              'Cosine similarity, because it ignores the large magnitude difference and compares direction',
              'Raw dot product, because longer text is more informative',
              'It doesn\'t matter — all three give the same answer here',
            ],
            answer: 1,
            explain: 'The two texts point the same way but have very different arrow lengths. Cosine divides out magnitude, so the length gap doesn\'t hurt them. Euclidean and raw dot product are both magnitude-sensitive and would penalize or distort the pairing.',
          },
          {
            q: 'A vector database lets you store unit-normalized vectors and query with a raw dot product for speed. Why is that a valid substitute for cosine similarity?',
            options: [
              'Dot product is always equal to cosine similarity for any vectors',
              'For unit-length vectors the norms are both 1, so cosine reduces to the plain dot product',
              'Normalizing makes the vectors two-dimensional, which speeds up cosine',
              'The database secretly recomputes cosine anyway',
            ],
            answer: 1,
            explain: 'Cosine is dot(a,b) / (‖a‖·‖b‖). When both vectors have length 1, the denominator is 1·1 = 1, so cosine equals the raw dot product. That\'s why vector DBs normalize at write-time and run hardware-optimized dot products at query-time.',
          },
          {
            q: 'A teammate hardcodes `if cosine_score > 0.8: it\'s a match` and reuses that 0.8 threshold after switching from one embedding model to a different one. What\'s the core problem?',
            options: [
              'The threshold should always be 0.9, not 0.8',
              'Cosine scores are relative to the model and dataset; a threshold from one model doesn\'t transfer to another',
              'Cosine can exceed 1.0, so 0.8 is too low',
              'Thresholds should be applied to Euclidean distance only',
            ],
            answer: 1,
            explain: 'There is no universal "similar" cutoff. Different models compress the score range differently and have different noise floors (anisotropy). A threshold is a property of (model + corpus + task) and must be re-calibrated empirically whenever any of those change.',
          },
          {
            q: 'You compute cosine and get a value of 2.7. What almost certainly happened?',
            options: [
              'The two texts are extremely similar',
              'You computed a raw dot product (or forgot to divide by the norms) — true cosine is bounded to [−1, 1]',
              'One vector had more dimensions than the other',
              'The embedding model was miscalibrated',
            ],
            answer: 1,
            explain: 'Cosine is the cosine of an angle, so it can never leave [−1, 1]. A value above 1 means you skipped the normalization step and are looking at a raw dot product. It\'s the fastest sanity check that your similarity code is wrong.',
          },
          {
            q: 'For a set of 2-D vectors, cosine ranks "short note" [1,1] and "long essay" [5,5] as tied for a query [1,1], but Euclidean ranks "short note" clearly ahead. Why do they disagree?',
            options: [
              'One of the metrics is computed incorrectly',
              'Cosine only sees direction (both docs point at 45°, so they tie), while Euclidean also sees the distance between arrow tips (the long essay\'s tip is farther away)',
              'Euclidean distance ignores direction entirely',
              'They can never disagree; this scenario is impossible',
            ],
            answer: 1,
            explain: 'Both docs share the query\'s 45° direction, so cosine calls them equal. Euclidean measures the straight-line gap between tips, and [5,5] is far from [1,1], so it ranks the short note closer. Same data, different question — which is exactly why the metric is a design decision, and why normalizing first makes them agree.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm6-l2-c1', front: 'What does cosine similarity measure, in one sentence?', back: 'The angle between two vectors — do the arrows point the same way? 1 = aligned/related, 0 = perpendicular/unrelated, −1 = opposite. It ignores arrow length entirely.' },
          { id: 'm6-l2-c2', front: 'Write cosine similarity as code.', back: 'dot(a,b) / (norm(a) * norm(b)), where dot = sum of element-wise products and norm = sqrt(dot(a,a)). Dividing by the norms cancels magnitude, leaving pure direction. Range is always [−1, 1].' },
          { id: 'm6-l2-c3', front: 'Why does cosine ignore magnitude, and when does that hurt?', back: 'For text, direction = meaning and length is noise (essay vs tweet on the same topic still match). It bites when amount matters — raw counts/intensities, or near-empty text whose direction is noise.' },
          { id: 'm6-l2-c4', front: 'Cosine vs dot product vs Euclidean?', back: 'Cosine = angle only (length-invariant). Dot = alignment AND length (bigger arrows score higher). Euclidean = distance between tips (a distance: smaller = closer). On unit vectors, cosine == dot.' },
          { id: 'm6-l2-c5', front: 'Why normalize embeddings to unit length before storing?', back: 'Then norms are 1, so cosine reduces to a raw dot product — same answer, one fewer division, hardware-optimized. Vector DBs store unit vectors and run dot products for speed.' },
          { id: 'm6-l2-c6', front: 'Is there an absolute "similar enough" cosine threshold?', back: 'No. Scores are relative to the model and dataset (range compression, anisotropic noise floors). Calibrate empirically per model+corpus+task, and never reuse a threshold across different models.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Cosine similarity = the angle between two arrows: 1 aligned, 0 unrelated, −1 opposite. It ignores length on purpose.',
          'The formula is four lines of code: dot(a,b) / (norm(a) * norm(b)). No trig, no proofs. Range is always [−1, 1].',
          'Ignoring magnitude is right for text (essay vs tweet on the same topic match) but blind when amount/intensity is the signal.',
          'Cosine, dot product, Euclidean answer different questions. On unit-normalized vectors, cosine == dot product — the key performance fact.',
          'There is no universal "similar" threshold. Scores are relative to model + dataset; calibrate empirically and never compare across models.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Treating a cosine score as an absolute verdict', text: '0.82 is not objectively "a match." Score ranges and noise floors differ by model and corpus. Grade on the curve of your own data — rank candidates and look at the gaps, then set a threshold empirically.' },
          { title: 'Reusing a threshold after switching models', text: 'A 0.8 cutoff tuned for one embedding model is meaningless for another; they live in different spaces with different distributions. Re-calibrate every threshold from scratch whenever you change the model — and never mix two models\' vectors in one index.' },
          { title: 'Mixing normalized and raw vectors in one index', text: 'If some vectors are unit-length and some aren\'t, your rankings are silently wrong. Pick one convention. If everything is normalized, cosine = dot product; if not, always divide by the norms. Consistency over cleverness.' },
          { title: 'Getting the similarity/distance direction backwards', text: 'Cosine and dot are similarities (bigger = better); Euclidean/L2 is a distance (smaller = better). Configure your vector DB for the right optimization direction, or it will return your worst matches as your top results.' },
        ] },
        { type: 'interview', items: [
          { q: '"Explain cosine similarity to me like I don\'t know linear algebra."', a: 'Every embedding is an arrow pointing out from the origin. Cosine similarity measures the angle between two arrows: same direction scores 1, perpendicular scores 0, opposite scores −1. In code it\'s the dot product of the two vectors divided by their lengths — the division cancels out magnitude so you\'re comparing pure direction. We use it for text because direction encodes meaning while length is mostly noise, so a short and a long document about the same thing still match.' },
          { q: '"When would you choose cosine over Euclidean distance, or vice versa?"', a: 'Cosine when only direction/meaning matters and magnitude is a distraction — the default for learned text embeddings, semantic search, and RAG retrieval. Euclidean when the actual position and magnitude of the vectors carry information, like clustering feature vectors or geometric/image data. Key detail: if you normalize vectors to unit length, cosine and dot product become identical and Euclidean ranks in the same order, so the choice mostly collapses — which is why production systems normalize and then run fast dot products.' },
          { q: '"A cosine score of 0.75 — is that a good match?"', a: 'On its own, unknowable. Cosine scores are relative to the specific model and dataset. Some models compress everything into a narrow high band, and many embedding spaces are anisotropic, so even unrelated pairs sit well above zero. The right move is to calibrate empirically: embed known-related and known-unrelated pairs, see where scores actually fall for this model and corpus, and set the threshold from that gap. And I\'d never reuse that threshold after switching embedding models.' },
          { q: '"Why do vector databases store normalized vectors and use dot product instead of cosine?"', a: 'Because for unit-length vectors the norms are both 1, so cosine reduces exactly to the raw dot product — same result, but you skip the two norm computations and the division. Dot product is a single fused multiply-add that maps beautifully onto SIMD/GPU hardware, so at millions of vectors it\'s meaningfully faster. You pay the normalization cost once at write-time and get cheap dot-product queries forever.' },
        ] },
        { type: 'usecases', items: [
          { title: 'RAG retrieval', text: 'Every "chat with your docs" system embeds chunks, then ranks them against the question by cosine similarity to pick the top-k to feed the LLM. Cosine is the ranking function at the heart of retrieval (Module 6).' },
          { title: 'Semantic help-center & product search', text: 'A user types a natural-language query; cosine over embeddings surfaces the right article even with zero shared keywords, beating the old keyword box on exactly the paraphrase cases keyword search misses.' },
          { title: 'Recommendations and "more like this"', text: 'Embed products, songs, or articles once; "related items" is nearest-neighbor by cosine in embedding space. E-commerce rails and content feeds run on this same distance math.' },
          { title: 'Deduplication and clustering', text: 'Group near-duplicate support tickets or reviews by cosine proximity (often with a high threshold like 0.95+), turning a pile of free text into structured, deduplicated themes without manual tagging.' },
        ] },
        { type: 'project', title: 'Nearest-neighbor search from scratch', goal: 'Implement cosine similarity by hand and use it to build a 10-sentence semantic search, then verify the rankings against your own intuition.', steps: [
          'Write 10 short sentences spanning 3 loose themes (e.g. cooking, programming, travel). These are your documents.',
          'Get vectors: call a real embedding model (`text-embedding-3-small`) for the honest version, or reuse the JS toy-vector approach for a fully offline version.',
          'Implement `cosine(a, b)` from scratch — dot product over the product of norms, the four-line version from this lesson. No libraries for the similarity itself.',
          'Write `search(query, k)`: embed the query with the SAME model, score all 10 sentences by cosine, sort descending, return the top-k.',
          'Run 3 queries including one that shares NO keywords with its best match (e.g. "I\'m starving" against a pasta sentence). Confirm the ranking matches your intuition and note any surprises.',
        ], deliverable: 'A `nn_search.py` (or `.js`) that prints ranked results for 3 queries, including one keyword-free query that still finds the right sentence, plus a note on whether the scores matched your gut.' },
        { type: 'challenge', title: 'Make cosine and Euclidean openly disagree', text: 'Construct a small set of vectors and a query where cosine similarity and Euclidean distance return DIFFERENT top matches. Then explain, in two sentences, exactly why — and show that normalizing all the vectors to unit length makes them agree again.', hints: [
          'The trick is magnitude: give two candidates the same direction as the query but very different lengths (e.g. [1,1] and [6,6] against query [1,1]).',
          'Cosine will tie the same-direction candidates; Euclidean will prefer whichever tip is physically closer to the query\'s tip.',
          'After normalizing everything to length 1, all arrows sit on the unit circle — now "angle" and "tip distance" encode the same ordering, so the disagreement vanishes.',
        ] },
        { type: 'reading', links: [
          { label: 'Cosine similarity — a clear visual explainer (Machine Learning Mastery)', url: 'https://machinelearningmastery.com/cosine-similarity-for-machine-learning/', note: 'Walks through the formula, the geometry, and worked numeric examples — a gentle reinforcement of this lesson.' },
          { label: 'OpenAI: Embeddings guide (use cases & similarity)', url: 'https://platform.openai.com/docs/guides/embeddings', note: 'The provider-official how-to on embedding text and computing cosine similarity, including normalization notes and code.' },
          { label: 'MTEB: Massive Text Embedding Benchmark (leaderboard & paper)', url: 'https://huggingface.co/spaces/mteb/leaderboard', note: 'How embedding models are actually compared across retrieval/similarity tasks — context for why "which model" changes your scores and thresholds.' },
        ] },
      ],
    },
  ],
}
