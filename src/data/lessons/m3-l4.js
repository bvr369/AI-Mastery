// Lesson 3.4 — Controlling Format, Tone & Length

export default {
  sections: [
    {
      id: 'shape-output',
      title: 'You control the shape, not just the content',
      blocks: [
        { type: 'p', text: "By default a model outputs whatever prose feels natural — a delight for chat, a nightmare for everything else. But the model will happily produce ANY shape you specify: bullet lists, XML, JSON, a single word, a tweet, a formal memo. **Output shape is just another instruction**, and controlling it is what turns a chatbot into a component you can build on." },
        { type: 'diagram', id: 'format-control', caption: 'Same content, three contracts. You pick the shape by who (or what) consumes it.' },
        { type: 'h', text: 'The three axes of control' },
        { type: 'list', items: [
          '**Format** — the structure. XML tags (most reliable for models to produce AND parse), markdown (human-facing), JSON (machine-facing, Lesson 2.6). Say exactly what you want.',
          '**Tone** — the voice. "Explain like I\'m five" vs "write for a security auditor." Set by role + explicit tone instructions.',
          '**Length** — the size. "In one sentence", "max 3 bullets", "under 280 characters". Also a cost control (fewer output tokens).',
        ] },
        { type: 'callout', variant: 'tip', text: "**XML tags are a prompt engineer's secret weapon.** Models are exceptionally good at both producing and respecting them: `<summary>…</summary><action_items>…</action_items>`. They're unambiguous to parse (Lesson 3.3's tag-and-extract), nest cleanly, and rarely get mangled the way freeform sections do. When you need structure but JSON is overkill, reach for tags." },
      ],
    },
    {
      id: 'try-formats',
      title: 'Control it in the Playground',
      blocks: [
        { type: 'p', text: "The simulated model responds to format and length instructions (\"one sentence\", \"bullet\", \"json only\", \"uppercase\"). Run each and watch the SAME answer reshape. Then open the [Prompt Playground](/playground) and push it further with your own contracts." },
        { type: 'playground', id: 'format-lab', title: 'One question, many shapes', height: 360, code: `const question = "Explain what a context window is"

const contracts = [
  { label: "default", system: "You are a helpful assistant." },
  { label: "one sentence", system: "Answer in one sentence only." },
  { label: "bullets", system: "Answer as a bulleted list." },
  { label: "json only", system: "Respond in json only, with an 'answer' field." },
  { label: "pirate (tone)", system: "You are a pirate. Be concise." },
]

for (const c of contracts) {
  console.log("=== " + c.label + " ===")
  console.log(await llm(question, { system: c.system }))
  console.log("")
}`, solution: `// Solution: a reusable "formatter" that enforces a strict output contract.
async function answer(question, { format = "prose", tone = "neutral", maxWords = 60 } = {}) {
  const formatRule = {
    prose: "Write flowing prose.",
    bullets: "Answer as 2-4 bullet points, each one line.",
    json: "Respond in json only with an 'answer' field, no prose.",
    tags: "Wrap the answer in <answer></answer> tags.",
  }[format]

  const system = [
    "You are a helpful assistant.",
    \`Tone: \${tone}.\`,
    formatRule,
    \`Keep it under about \${maxWords} words.\`,
  ].join("\\n")

  return await llm(question, { system })
}

console.log("BULLETS:\\n", await answer("Explain a context window", { format: "bullets" }))
console.log("\\nJSON:\\n", await answer("Explain a context window", { format: "json", maxWords: 30 }))
console.log("\\nPIRATE PROSE:\\n", await answer("Explain a context window", { tone: "pirate", maxWords: 40 }))
// Output shape is now a PARAMETER of your code, not a hardcoded hope.`, caption: '**Exercise:** build an `answer(question, { format, tone, maxWords })` helper that assembles the system prompt from options — making output shape a parameter of your code. Solution shows the full formatter.' },
      ],
    },
    {
      id: 'techniques',
      title: 'Techniques that actually stick',
      blocks: [
        { type: 'list', items: [
          '**Be specific about length.** "Short" is subjective; "max 3 bullets" or "under 50 words" is enforceable. Vague length instructions get vague adherence.',
          '**Use positive instructions.** "Respond in JSON" works better than "don\'t use prose" — models follow "do X" more reliably than "don\'t do Y" (a quirk worth remembering).',
          '**Prefill to force a start.** Putting `{` or `<answer>` as the start of the assistant turn ([[Prefill]]) nudges the model straight into the format, skipping preambles like "Sure, here\'s...".',
          '**Show the format with an example.** One formatted example (few-shot!) beats a paragraph describing the format. Structure is easier to demonstrate than to explain.',
          '**Separate instructions from content with delimiters.** `"""` or tags around the input keep the model from confusing your data for your instructions (and it\'s a security habit — next lesson).',
        ] },
        { type: 'callout', variant: 'warn', text: "Format instructions are strong but not a hard guarantee — a model can still occasionally break contract (stray prose before your JSON, a missing tag). For anything a machine parses, pair the instruction with **validation + retry** (Lesson 2.6). Prompt for the shape; verify in code. Never assume." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'You need structured output that\'s easy to parse but JSON feels heavy for this case. Strong middle-ground?',
            options: [
              'Freeform prose with headers',
              'XML tags like <summary>…</summary> — models produce and respect them reliably, and they\'re trivial to parse',
              'Comma-separated values',
              'Ask nicely and hope',
            ],
            answer: 1,
            explain: 'XML tags are the prompt-engineer\'s workhorse: unambiguous to produce, easy to extract (Lesson 3.3), and more robust than freeform sections. Great when you need structure without full JSON.',
          },
          {
            q: 'Which length instruction will the model follow most reliably?',
            options: [
              '"Keep it short"',
              '"Be concise"',
              '"Answer in at most 3 bullet points, one sentence each"',
              '"Don\'t write too much"',
            ],
            answer: 2,
            explain: 'Specific, countable constraints are enforceable; subjective ones ("short", "concise") get subjective adherence. Enforceable length is also a cost lever — fewer output tokens.',
          },
          {
            q: 'Why does "respond in JSON" outperform "don\'t write prose"?',
            options: [
              'JSON is shorter',
              'Models follow positive "do X" instructions more reliably than negative "don\'t do Y" ones',
              'Prose is banned by the API',
              'They perform identically',
            ],
            answer: 1,
            explain: 'A known model quirk: positive instructions land better than prohibitions. Tell the model what TO do, not just what to avoid — applies to format, tone, and behavior alike.',
          },
          {
            q: 'What is prefilling, in the format-control context?',
            options: [
              'Pre-training the model',
              'Starting the assistant\'s response for it (e.g. with "{" or "<answer>") to force the output straight into the desired format',
              'Caching the prompt',
              'Adding examples',
            ],
            answer: 1,
            explain: 'Prefill puts the first characters in the assistant turn, so the model continues in that shape — skipping "Sure, here you go!" preambles and locking the format from token one.',
          },
          {
            q: 'You instructed "JSON only" but occasionally get prose before the JSON. The robust fix?',
            options: [
              'Add more emphasis: "JSON ONLY!!! NO PROSE!!!"',
              'Pair the instruction with code-level validation + retry (and/or strip/parse defensively) — never assume format compliance for machine-parsed output',
              'Raise temperature',
              'Give up on JSON',
            ],
            answer: 1,
            explain: 'Format instructions reduce but don\'t eliminate contract breaks. For machine consumption, prompt for the shape AND validate in code with a retry loop (Lesson 2.6). Louder prompts aren\'t a guarantee; validation is.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm3-l4-c1', front: 'The three axes of output control?', back: 'Format (structure: XML/markdown/JSON), Tone (voice), Length (size). All set by explicit instruction — output shape is just another instruction.' },
          { id: 'm3-l4-c2', front: 'Why are XML tags a prompt-engineering favorite?', back: 'Models produce and respect them reliably; they\'re unambiguous to parse and nest cleanly. Ideal structure when JSON is overkill.' },
          { id: 'm3-l4-c3', front: 'Positive vs negative instructions?', back: '"Do X" beats "don\'t do Y" — models follow positive instructions more reliably. "Respond in JSON" > "don\'t use prose".' },
          { id: 'm3-l4-c4', front: 'What is prefilling for format?', back: 'Starting the assistant turn (e.g. with "{" or "<answer>") so the model continues in that shape, skipping preambles and locking format from token one.' },
          { id: 'm3-l4-c5', front: 'Specific vs vague length?', back: '"Max 3 bullets / under 50 words" is enforceable; "short/concise" gets subjective adherence. Specific length also controls output-token cost.' },
          { id: 'm3-l4-c6', front: 'Format instructions guarantee compliance?', back: 'No — models occasionally break contract. For machine-parsed output, prompt for the shape AND validate + retry in code (Lesson 2.6).' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Output shape is an instruction — you control format, tone, and length, not just content.',
          'XML tags are the reliable structure workhorse; JSON for machines, markdown for humans.',
          'Specific beats vague (countable length), positive beats negative ("do X" not "don\'t Y").',
          'Prefill and formatted examples lock the shape harder than descriptions.',
          'Prompt for format, but validate machine-consumed output in code — instructions aren\'t guarantees.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Describing format instead of showing it', text: 'Three sentences explaining your desired structure lose to one example of it. Structure is easier to demonstrate than to describe — reach for a formatted example (few-shot).' },
          { title: 'Negative-only instructions', text: '"Don\'t be verbose, don\'t use jargon, don\'t include caveats" leaves the model guessing what TO do. Flip every prohibition into a positive spec: "Write 2 plain-language sentences."' },
          { title: 'Trusting format for parsed output', text: 'Shipping `JSON.parse(response)` with no validation because the prompt said "JSON only" — until the one call that adds a stray sentence and crashes your pipeline. Format instruction + validation, always.' },
          { title: 'Fighting tone with adjectives', text: '"Be professional but friendly but concise but thorough" cancels out. Tone is best set by a clear role ("You are a support engineer") plus one or two concrete constraints, not a pile of competing adjectives.' },
        ] },
        { type: 'interview', items: [
          { q: '"How do you get consistent, parseable output from an LLM?"', a: 'Layered: (1) instruct the exact format — XML tags or JSON — using positive phrasing, (2) show one formatted example, (3) optionally prefill the assistant turn to lock the opening, (4) for machine consumption, validate the parsed output against a schema and retry with the error on failure (Lesson 2.6). Prompt reduces the failure rate; validation eliminates the consequences. I never call JSON.parse on raw model output without a guard.' },
          { q: '"Why prefer XML tags over other structured formats in prompts?"', a: 'Models are unusually reliable at producing and honoring XML tags — they rarely mangle them, they nest, and extraction is a trivial regex. Compared to freeform markdown sections (fuzzy boundaries) or full JSON (stricter, easier to break on complex content), tags hit a sweet spot for "I need structure I can parse but the content is prose-ish." I use JSON when the consumer is strictly machine, tags when I\'m extracting a few fields from a mostly-text answer.' },
          { q: '"A model keeps adding \'Sure, here you go!\' before the JSON you need. Fixes?"', a: 'Several: prefill the assistant turn with "{" so it continues into JSON directly; add "Respond with ONLY the JSON, no preamble" (positive framing); provide a formatted example; and defensively strip anything before the first "{" while validating. Belt and suspenders — the prefill usually solves it, the strip+validate guarantees it.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Structured extraction pipelines', text: 'Every email→JSON, PDF→fields feature depends on format control + validation — Lessons 3.4 and 2.6 working together.' },
          { title: 'Multi-tone content tools', text: 'One "rewrite" feature offering formal/casual/technical variants is just tone parameters swapped into the same prompt template.' },
          { title: 'Length-constrained UIs', text: 'Tweet generators, meta-description writers, SMS bots — hard length limits enforced by prompt (and truncation as backstop).' },
          { title: 'Agent tool outputs', text: 'Agents need tools to return predictable shapes; format control is how tool-use stays parseable (Module 8).' },
        ] },
        { type: 'project', title: 'The multi-format renderer', goal: 'Build a single "answer engine" that returns the same content in any requested shape — cementing format-as-parameter.', steps: [
          'Write answer(question, { format, tone, maxWords }) that assembles a system prompt from the options (start from this lesson\'s solution).',
          'Support formats: prose, bullets, json, tags. Support tones: neutral, expert, friendly, eli5.',
          'Add validation for the json format: parse it, and on failure retry once with the error (Lesson 2.6).',
          'Build a tiny CLI or page that takes a question and renders it in all four formats side by side.',
          'Test with 3 questions × 4 formats. Note which format+content combos the model handles cleanly vs breaks — real models have quirks.',
        ], deliverable: 'answer-engine.js + a demo showing one question rendered four ways, with JSON validated.' },
        { type: 'challenge', title: 'The prefill experiment', text: 'Take a task where the model tends to add preamble ("Certainly! Here is..."). Get a clean, preamble-free output THREE different ways: (1) an explicit "no preamble" instruction, (2) prefilling the assistant turn, (3) a formatted example. Compare reliability across 5 runs each. Report which is most robust.', hints: [
          'Prefill usually wins for hard format-locking; instructions are easiest but leakiest.',
          'If your API supports it, prefill = adding an assistant message with partial content; in the sandbox, simulate by asking the model to "begin your response with {".',
          'The meta-lesson: multiple tools solve the same problem with different reliability/effort trade-offs.',
        ] },
        { type: 'reading', links: [
          { label: 'Anthropic: use XML tags', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags', note: 'Why and how to structure prompts and outputs with tags.' },
          { label: 'Anthropic: prefill Claude\'s response', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prefill-claudes-response', note: 'The prefill technique, officially.' },
          { label: 'Anthropic: control response format', url: 'https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/increase-consistency', note: 'Consistency and format-enforcement guidance.' },
        ] },
      ],
    },
  ],
}
