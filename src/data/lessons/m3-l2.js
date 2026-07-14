// Lesson 3.2 — Zero-Shot, Few-Shot & In-Context Learning

export default {
  sections: [
    {
      id: 'teach-by-example',
      title: 'Teaching without training',
      blocks: [
        { type: 'p', text: "Here's one of the most useful facts in applied AI: you can **teach a model a new task by showing it examples in the prompt** — no fine-tuning, no dataset, no training run. Put two examples of what you want, and the model picks up the pattern for the third. This is called **few-shot prompting**, and the mechanism behind it — [[In-Context Learning]] — still surprises researchers." },
        { type: 'list', items: [
          '**[[Zero-shot]]** — instructions only, no examples. "Classify the sentiment." Great for simple, common tasks the model already understands.',
          '**One-shot** — a single example. Often the biggest jump: it pins down your exact format.',
          '**[[Few-shot]]** — a handful of examples (2-5 typically). For nuanced tasks, edge cases, or strict output shapes.',
        ] },
        { type: 'diagram', id: 'few-shot', caption: 'Zero-shot guesses your format; few-shot examples teach it exactly. Same model, same call — the examples do the work.' },
        { type: 'callout', variant: 'analogy', title: 'Analogy: the new hire and the sample folder', text: "Zero-shot is telling a new hire \"reply to support tickets\" and hoping. One-shot is handing them ONE great past reply and saying \"like this.\" Few-shot is a folder of 3-4 exemplars covering the tricky cases. The hire hasn't been *retrained* — they're pattern-matching your examples in the moment. Close the folder (end the prompt) and the lesson is gone." },
        { type: 'callout', variant: 'info', text: "Why \"in-context\"? The learning lives entirely in the context window for this one call. It doesn't change the [[Weights]] — nothing persists. That's the difference from fine-tuning (Module 11): few-shot is instant and free per call but re-sent every time; fine-tuning is permanent but costs a training run. Prompt first, fine-tune only when prompting genuinely can't hold the pattern." },
      ],
    },
    {
      id: 'try-it',
      title: 'Try it: examples that transform output',
      blocks: [
        { type: 'p', text: 'Move from zero-shot to few-shot and watch verbose, unparseable answers snap into clean one-word labels. Even the jump from zero to ONE example is dramatic.' },
        { type: 'demo', id: 'few-shot-classifier' },
      ],
    },
    {
      id: 'craft',
      title: 'Crafting good examples',
      blocks: [
        { type: 'p', text: "Few-shot is powerful but has a craft. The examples aren't decoration — they're the specification, so their quality and coverage decide your results:" },
        { type: 'list', items: [
          '**Cover the edge cases, not the easy ones.** The model already handles obvious inputs. Spend examples on the ambiguous cases where it would otherwise guess wrong.',
          '**Be consistent.** Every example must follow the EXACT format you want back. One sloppy example teaches sloppiness — the model copies what it sees.',
          "**Match the distribution.** Examples should look like real inputs. Toy examples teach toy behavior.",
          '**Order can matter.** For classification, avoid putting all of one label together — models can pick up on ordering as a spurious pattern.',
          "**Don't overdo it.** 2-5 examples usually captures the pattern; 20 mostly burns tokens (and context budget — Lesson 1.4).",
        ] },
        { type: 'playground', id: 'fewshot-lab', title: 'Zero-shot vs few-shot, measured', height: 360, code: `// A classifier with a strict label set. Compare approaches.
const labels = "bug, feature, question, billing, praise"

// ZERO-SHOT
const zero = \`Classify this support message into one of: \${labels}.
Message: "I was charged twice this month"\`
console.log("zero-shot:", await llm(zero, { system: "Classify the message." }))

// FEW-SHOT — examples teach the exact one-word format + edge cases
const few = \`Classify into exactly one of: \${labels}. Reply with ONLY the label.
"the app won't load" -> bug
"add dark mode please" -> feature
"you charged me twice" -> billing
"how do I export?" -> question
"I was charged twice this month" ->\`
console.log("few-shot:", await llm(few, { system: "You are a precise classifier. One word only." }))`, solution: `// Solution: a reusable few-shot classifier function
const LABELS = ["bug", "feature", "question", "billing", "praise"]
const SHOTS = [
  ["the app won't load", "bug"],
  ["add dark mode please", "feature"],
  ["you charged me twice", "billing"],
  ["how do I export a report?", "question"],
  ["love the new design!", "praise"],
]

function buildPrompt(message) {
  const examples = SHOTS.map(([t, l]) => \`"\${t}" -> \${l}\`).join("\\n")
  return \`Classify into exactly one of: \${LABELS.join(", ")}. Reply with ONLY the label.
\${examples}
"\${message}" ->\`
}

async function classify(message) {
  const raw = await llm(buildPrompt(message), { system: "Precise classifier. One word." })
  const label = raw.trim().toLowerCase().split(/\\s/)[0]
  return LABELS.includes(label) ? label : "other"   // validate against the set!
}

for (const m of ["it keeps crashing", "can you add SSO?", "refund please", "🎉 amazing"]) {
  console.log(m, "->", await classify(m))
}
// Note the validation: never trust the label blindly — check it's in your set.`, caption: '**Exercise:** wrap few-shot into a reusable `classify(message)` that builds the prompt from an examples array AND validates the output against your label set (Lesson 2.6 energy). Solution has the full pattern.' },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'What is in-context learning?',
            options: [
              'Fine-tuning the model on your examples',
              'The model picking up a task pattern from examples in the prompt, with no weight changes — gone when the prompt ends',
              'The model remembering past conversations',
              'A type of RAG',
            ],
            answer: 1,
            explain: 'Few-shot works via in-context learning: the pattern is inferred from prompt examples for this one call only. No training, nothing persists — which is exactly why it\'s instant and free per call but re-sent every time.',
          },
          {
            q: 'You need a classifier to output exactly one lowercase word, but zero-shot gives paragraphs. Cheapest fix?',
            options: [
              'Fine-tune a custom model',
              'Add 2-4 examples showing input -> label format; the model copies the shape',
              'Lower temperature to 0',
              'Switch to a bigger model',
            ],
            answer: 1,
            explain: 'This is the textbook few-shot use case. Examples pin the format instantly — no training, no cost beyond a few tokens. Temperature 0 helps consistency but won\'t fix the format on its own.',
          },
          {
            q: 'Which examples should you prioritize in a few-shot prompt?',
            options: [
              'The easiest, most obvious inputs',
              'Ambiguous edge cases where the model would otherwise guess wrong',
              'As many as possible, 20+',
              'Random inputs',
            ],
            answer: 1,
            explain: 'The model already nails easy inputs. Examples are precious context budget — spend them on the tricky, ambiguous cases that define your task\'s boundaries. Quality and coverage beat quantity.',
          },
          {
            q: 'One of your few-shot examples has a typo in its output format. Likely effect?',
            options: [
              'No effect — models ignore typos',
              'The model may copy the inconsistency — examples ARE the spec, flaws included',
              'The API rejects the prompt',
              'It improves robustness',
            ],
            answer: 1,
            explain: 'Few-shot examples are teaching by demonstration. A sloppy example teaches sloppiness. Every example must be exactly what you\'d want back — the model imitates what it sees.',
          },
          {
            q: 'When should you fine-tune instead of using few-shot?',
            options: [
              'Always — fine-tuning is strictly better',
              'When the pattern is too complex/lengthy for examples to capture, or you call it at high volume and want to stop re-sending examples every time',
              'Never — few-shot always wins',
              'When you have fewer than 3 examples',
            ],
            answer: 1,
            explain: 'Prompt (few-shot) first — it\'s instant and free to iterate. Fine-tune (Module 11) when examples can\'t hold the pattern, or when high volume makes re-sending them every call expensive enough to justify baking the behavior in.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm3-l2-c1', front: 'Zero-shot vs one-shot vs few-shot?', back: 'Zero: instructions only. One: a single example (often the biggest jump). Few: 2-5 examples for nuance/edge cases/strict format.' },
          { id: 'm3-l2-c2', front: 'What is in-context learning?', back: 'The model learning a task pattern from prompt examples — no weight changes, gone when the prompt ends. Instant, free per call, re-sent each time.' },
          { id: 'm3-l2-c3', front: 'Few-shot vs fine-tuning?', back: 'Few-shot: instant, free to iterate, re-sent every call. Fine-tuning: permanent, costs a training run. Prompt first; fine-tune when prompting can\'t hold the pattern or volume is high.' },
          { id: 'm3-l2-c4', front: 'Which examples earn their place in a prompt?', back: 'Edge cases and ambiguous inputs — the model already handles easy ones. Coverage and consistency beat quantity; 2-5 usually suffices.' },
          { id: 'm3-l2-c5', front: 'Golden rule of example quality?', back: 'Every example must follow the EXACT format you want back — examples are the spec, so flaws get copied.' },
          { id: 'm3-l2-c6', front: 'Always do WHAT with a few-shot classifier\'s output?', back: 'Validate it against your known label set — never trust the raw label blindly (Lesson 2.6 structured-output discipline).' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Few-shot teaches a task via examples in the prompt — no training (in-context learning).',
          'Even one example often transforms format consistency; 2-5 covers most nuance.',
          'Examples are the spec: cover edge cases, stay consistent, match real inputs.',
          'It\'s free and instant per call but re-sent every time — fine-tune only when that stops paying off.',
          'Always validate few-shot outputs against your expected set.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Using few-shot for tasks that don\'t need it', text: 'Simple, common tasks work zero-shot — adding examples just burns tokens. Reach for few-shot when zero-shot output is inconsistent or the format is strict, not reflexively.' },
          { title: 'Inconsistent example formats', text: 'Mixing "positive" and "Positive." and "POSITIVE" across examples teaches the model that any of them is fine — then you get all three back. Ruthless consistency.' },
          { title: 'Only easy examples', text: 'Examples covering only obvious cases leave the model to guess on the hard ones — which are exactly where it fails. Curate for the boundaries.' },
          { title: 'Label leakage / ordering artifacts', text: 'Grouping all "bug" examples together, or accidentally ordering examples by label, can teach a spurious positional pattern. Shuffle, and keep the distribution realistic.' },
        ] },
        { type: 'interview', items: [
          { q: '"Explain few-shot prompting and when you\'d use it."', a: 'Few-shot places worked input→output examples in the prompt so the model infers the pattern via in-context learning — no training. I use it for strict output formats, nuanced classification, or edge-case handling where instructions alone are ambiguous. Key craft: cover ambiguous cases, keep examples perfectly consistent, match real input distribution, and 2-5 usually suffices. I always validate outputs against the expected set.' },
          { q: '"Few-shot vs fine-tuning — how do you decide?"', a: 'Default to few-shot: zero cost to iterate, works immediately, easy to change. Move to fine-tuning when (a) the desired behavior is too complex or long to express in a handful of examples, (b) I\'m at high enough volume that re-sending examples every call is a real cost, or (c) I want to distill a big model\'s behavior into a cheaper one. They compose too — a fine-tuned model can still take few-shot examples.' },
          { q: '"Why does in-context learning work at all?"', a: 'Honest answer: it\'s an emergent property of large-scale pretraining that isn\'t fully understood — the model has seen countless "pattern then continuation" structures in training and generalizes that meta-skill. Practically, I treat it as a reliable tool with known failure modes (sensitive to example quality, order, and consistency) rather than something to over-theorize.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Data extraction & classification', text: 'The bread and butter of few-shot: 3-4 examples turn a general model into a reliable labeler for YOUR categories — no ML pipeline.' },
          { title: 'Style & tone matching', text: 'Give examples of your brand voice and the model mimics it — how "write in our style" features actually work under the hood.' },
          { title: 'Format enforcement', text: 'Legacy system needs a weird output shape? A couple of examples beat pages of format instructions.' },
          { title: 'Bootstrapping fine-tune datasets', text: 'Few-shot a big model to generate labeled examples, then fine-tune a small model on them — the distillation on-ramp (Module 11).' },
        ] },
        { type: 'project', title: 'The few-shot lab', goal: 'Build intuition for how many (and which) examples a task needs — a real applied-AI skill.', steps: [
          'Pick a classification task with 4-5 categories and some genuinely ambiguous inputs (support tickets, PR labels, email intents).',
          'Write 10 test inputs including 3-4 ambiguous edge cases; hand-label them (your golden set — Lesson 3.7 preview).',
          'Run them at 0, 1, 2, and 4 shots (use the Playground or a chat AI). Record accuracy at each.',
          'For the 4-shot version, deliberately curate examples that cover your ambiguous cases. Compare to 4 random examples.',
          'Write up: accuracy vs shot count curve, and the effect of curated-vs-random examples. Expected: sharp gain 0→1, curated beats random.',
        ], deliverable: 'fewshot-lab.md with an accuracy table (by shot count) and your curated-vs-random comparison.' },
        { type: 'challenge', title: 'One example, maximum leverage', text: 'For a nuanced task of your choice, find the SINGLE most valuable example — the one that, added alone, improves output most. Explain why it beats the alternatives. This trains the instinct for what an example actually teaches (format? tone? an edge case? a disambiguation?).', hints: [
          'The best single example usually resolves the model\'s biggest ambiguity about your intent.',
          'Try candidates: a format-defining example vs an edge-case example vs a tone example. Test each alone.',
          'Insight to reach: examples teach multiple things at once — the best ones teach the thing the model is currently getting wrong.',
        ] },
        { type: 'reading', links: [
          { label: 'Anthropic: use examples (multishot prompting)', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting', note: 'Provider-official few-shot guidance and format tips.' },
          { label: 'Language Models are Few-Shot Learners (GPT-3 paper)', url: 'https://arxiv.org/abs/2005.14165', note: 'The paper that put few-shot on the map — read the abstract and figures.' },
          { label: 'Anthropic prompt library', url: 'https://docs.anthropic.com/en/prompt-library/library', note: 'Spot the few-shot structure in real production prompts.' },
        ] },
      ],
    },
  ],
}
