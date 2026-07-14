// Lesson 3.1 — Anatomy of a Great Prompt

export default {
  sections: [
    {
      id: 'why-structure',
      title: 'Prompting is engineering, not magic words',
      blocks: [
        { type: 'p', text: "There's a myth that prompt engineering is about secret incantations — \"you are a world-class expert\" sprinkled like fairy dust. It isn't. **Good prompting is just clear specification**, the same skill you use writing a ticket a junior can actually implement. Vague ticket, vague result. This module makes that skill systematic, and it starts with a template you'll reuse for the rest of your career." },
        { type: 'p', text: "You already met the [[System Prompt]] in Module 2 — where your app's standing rules live. This module is about crafting the *instructions themselves*, system or user, so the model does what you actually meant." },
        { type: 'diagram', id: 'prompt-anatomy', caption: 'The five parts. Use the ones your task needs — but when output is bad, a missing part is usually the reason.' },
        { type: 'h', text: 'The five parts, decoded' },
        { type: 'list', items: [
          "**Role** — who the model should act as. Sets vocabulary, depth, and assumptions. \"Explain recursion\" vs \"You're a patient CS tutor for a beginner: explain recursion.\"",
          "**Context** — what it needs to know: the data, the constraints, the situation. The single biggest lever for relevance. Most bad outputs are starved of context.",
          "**Task** — the actual instruction, stated as one clear imperative. \"Summarize\" is weak; \"Summarize in 3 bullets for a busy exec\" is a spec.",
          "**Format** — the shape of the output. Markdown? JSON? Max length? This is what makes output *usable by code or humans* (whole lesson: 3.4).",
          "**Examples** — show, don't just tell. One or two input→output pairs pin down exactly what you want (whole lesson: 3.2).",
        ] },
        { type: 'callout', variant: 'analogy', title: 'Analogy: briefing a freelancer', text: "Imagine hiring a brilliant freelancer for one hour who then vanishes. \"Make me a logo\" gets you a gamble. \"You're a minimalist brand designer (role). It's for a fintech app called Ledger, audience is CFOs (context). Design a wordmark logo (task). Deliver as a description I can hand to a designer, plus 3 color hex codes (format). Similar vibe to Stripe's wordmark (example).\" — now you get something usable. The model is that freelancer, every single call." },
      ],
    },
    {
      id: 'build-it',
      title: 'Watch a prompt come together',
      blocks: [
        { type: 'p', text: 'Toggle the parts on one at a time and watch a vague, useless answer sharpen into something you could ship. The jump when **Task** and **Format** land is the whole lesson in one motion.' },
        { type: 'demo', id: 'prompt-builder' },
      ],
    },
    {
      id: 'in-playground',
      title: 'Feel it in the Playground',
      blocks: [
        { type: 'p', text: "The mock model responds to structure. Run the weak prompt, then the structured one, and compare. (This runnable block uses the same simulated model as the [Prompt Playground](/playground) — try your own variations there too.)" },
        { type: 'playground', id: 'anatomy-lab', title: 'Weak vs structured prompt', height: 340, code: `// Same underlying question, two prompt qualities.

console.log("=== WEAK: task only ===")
console.log(await llm("tell me about my startup's problems", { system: "You are an assistant." }))

console.log("\\n=== STRUCTURED: role + context + task + format ===")
const system = \`You are a senior startup advisor.
Context: the user runs a SaaS at $40k MRR with 8% monthly churn.
Be concrete and specific to those numbers.\`
const task = "Identify the single biggest risk. Answer in 3 one-sentence bullets."
console.log(await llm(task, { system }))`, solution: `// Solution: add an EXAMPLE to lock the format (few-shot preview)
const system = \`You are a senior startup advisor.
Context: the user runs a SaaS at $40k MRR with 8% monthly churn.
Be concrete and specific to those numbers.
Format each bullet like this example:
"• Churn: at 8%/mo you lose ~63% of customers yearly — a leaking bucket."\`
const task = "Identify the top 3 risks. One bullet each, following the example format exactly."
console.log(await llm(task, { system }))
// Notice: the example does more than the instruction alone —
// it shows tone, structure, and specificity in one shot.`, caption: '**Exercise:** the structured version is good — now add a formatted EXAMPLE bullet to the system prompt to lock the output shape even tighter. (Preview of Lesson 3.2.)' },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'A teammate says "the AI gives useless generic answers." The MOST likely missing prompt part?',
            options: [
              'Role — it needs a persona',
              'Context — generic answers usually mean the model wasn\'t told the specifics of the situation',
              'A politeness phrase',
              'Higher temperature',
            ],
            answer: 1,
            explain: 'Generic output is the signature of missing context. The model can only be specific about things it was told. Role and format help, but context is the biggest relevance lever.',
          },
          {
            q: 'Which is the strongest TASK instruction?',
            options: [
              '"Help with my code"',
              '"Look at this"',
              '"Rewrite this function to be O(n) instead of O(n²), keeping the same signature, and explain the change in one sentence"',
              '"Make it better"',
            ],
            answer: 2,
            explain: 'A strong task is a precise imperative with success criteria. "Better" and "help" force the model to guess your intent — and it will guess wrong at the worst moment.',
          },
          {
            q: 'Why does the FORMAT part matter so much for production apps?',
            options: [
              'It makes responses prettier',
              'It makes output consumable — parseable by code or scannable by humans — instead of unpredictable prose',
              'It reduces token cost',
              'Models refuse to answer without it',
            ],
            answer: 1,
            explain: 'Format turns "some text" into "data your app can use." A classification that returns one lowercase word (not a paragraph) is the difference between a working pipeline and a parsing nightmare (Lesson 2.6).',
          },
          {
            q: 'The "magic words" theory of prompting (secret phrases that unlock quality) is mostly wrong because…',
            options: [
              'Models ignore all instructions',
              'Quality comes from clear specification — role, context, task, format, examples — not incantations',
              'Only temperature matters',
              'It\'s actually completely correct',
            ],
            answer: 1,
            explain: 'Prompting is specification, not spellcasting. "World-class expert" adds little; telling the model the actual context and desired output shape adds everything. Clarity beats flattery.',
          },
          {
            q: 'You have all five parts but output is still off. Best FIRST move?',
            options: [
              'Add more adjectives to the role',
              'Add a worked EXAMPLE showing exactly the input→output you want',
              'Raise temperature to 1.5',
              'Switch providers immediately',
            ],
            answer: 1,
            explain: 'Examples are the highest-leverage fix when instructions alone aren\'t landing — they show tone, structure, and edge-case handling at once. That\'s the entire next lesson.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm3-l1-c1', front: 'The five parts of a prompt?', back: 'Role (who), Context (what it needs to know), Task (the imperative), Format (output shape), Examples (show don\'t tell). Use the ones your task needs.' },
          { id: 'm3-l1-c2', front: 'What is prompt engineering, really?', back: 'Clear specification — the same skill as writing a ticket a junior can implement. Not magic words or flattery.' },
          { id: 'm3-l1-c3', front: 'Signature of a missing-context prompt?', back: 'Generic, useless answers. The model can only be specific about what it was told — context is the biggest relevance lever.' },
          { id: 'm3-l1-c4', front: 'Weak vs strong TASK?', back: 'Weak: "help with my code", "make it better". Strong: a precise imperative with success criteria ("rewrite to O(n), keep the signature").' },
          { id: 'm3-l1-c5', front: 'Why does FORMAT matter in production?', back: 'It makes output consumable by code or humans instead of unpredictable prose — the difference between a working pipeline and a parsing mess.' },
          { id: 'm3-l1-c6', front: 'Highest-leverage fix when instructions don\'t land?', back: 'Add a worked EXAMPLE (input→output). It conveys tone, structure, and edge cases at once — the core of few-shot prompting.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Prompting = specification, not incantation. Clarity beats flattery.',
          'The five parts: role, context, task, format, examples — reach for what the task needs.',
          'Missing context → generic output; weak task → wrong guesses; missing format → unusable prose.',
          'Examples are the highest-leverage fix and the bridge to few-shot (next lesson).',
          'Treat every model call like briefing a brilliant freelancer who then vanishes.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Flattery instead of specification', text: '"You are a world-class genius expert" does almost nothing; "here is the exact data and the exact output format" does everything. Spend your tokens on context and constraints, not adjectives.' },
          { title: 'Burying the task in a wall of text', text: 'A crisp instruction lost in three paragraphs of preamble gets diluted. Put the task clearly, ideally near the end, and use structure (headings, tags) so the model can find it.' },
          { title: 'Assuming the model shares your context', text: 'You know it\'s about the checkout flow of your React app; the model knows nothing you didn\'t type. Every unstated assumption is a coin flip. Over-specify context, especially the first time.' },
          { title: 'Skipping format until output is wrong', text: 'Not specifying format means accepting whatever shape you get — then writing brittle parsers for it. Decide the output contract up front; it\'s cheaper than cleaning up prose later.' },
        ] },
        { type: 'interview', items: [
          { q: '"How do you approach writing a prompt for a new feature?"', a: 'Structured, not trial-and-error: define role (who the model acts as), gather the context it genuinely needs, write the task as a precise imperative with success criteria, specify the output format for downstream consumption, and add 1-2 examples if the task is nuanced. Then iterate against test cases (Lesson 3.7), not vibes. I treat the prompt as a spec I\'d hand a contractor.' },
          { q: '"What separates a good prompt from a bad one?"', a: 'Specificity and structure. A bad prompt assumes shared context and states a vague goal; a good one supplies the actual data, names the exact task, and constrains the output shape. The test: could a competent stranger produce what you want from this prompt alone? If not, the model can\'t either.' },
          { q: '"Is prompt engineering a real skill or will better models make it obsolete?"', a: 'It evolves, it doesn\'t vanish. Better models need less coaxing on FORMAT and reasoning, but they can\'t read your mind about CONTEXT, requirements, and success criteria — that specification work is irreducible. The skill shifts from "coaxing the model" toward "clearly specifying the task and evaluating results," which is just software engineering.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Internal prompt libraries', text: 'Mature AI teams keep a repo of tested prompts with all five parts, versioned and documented — this lesson\'s template as team infrastructure.' },
          { title: 'Prompt-writing copilots', text: 'Tools that "improve your prompt" mostly add the missing anatomy parts — structure, format, examples. Now you can do it deliberately.' },
          { title: 'AI feature specs', text: 'PMs increasingly write the role/context/task/format for AI features directly — a shared vocabulary between product and engineering.' },
          { title: 'Customer-facing prompt fields', text: 'When you let users write prompts (image tools, assistants), scaffolding the five parts in the UI dramatically improves their results.' },
        ] },
        { type: 'project', title: 'The prompt teardown', goal: 'Build the specification instinct by fixing bad prompts — the fastest way to internalize the anatomy.', steps: [
          'Collect 5 lazy prompts you\'d actually type: "summarize this", "fix my code", "write an email", "explain X", "give me ideas".',
          'For each, identify which of the five parts is missing (usually 2-3 are).',
          'Rewrite each with the missing parts filled in. Keep them realistic — real context, real format needs.',
          'Run both versions in the Prompt Playground (or a real chat AI). Save the pairs.',
          'Write one sentence per prompt on which added part helped most. Patterns will emerge — context and format win most often.',
        ], deliverable: 'A prompt-teardown.md with 5 before/after pairs and your notes on which part moved the needle.' },
        { type: 'challenge', title: 'One-part-at-a-time', text: 'Pick one genuinely hard task (e.g., "turn these messy meeting notes into a project plan"). Write it with ONLY a task. Then add one anatomy part per iteration, running each version. Document the output at each of the 5 stages. You\'ll produce a vivid before/after that proves the anatomy to yourself better than any lecture.', hints: [
          'Order matters less than coverage — but context and format usually cause the biggest jumps.',
          'Keep everything else fixed (same model, same temperature) so the prompt is the only variable.',
          'This is a mini-eval: you\'re measuring the marginal value of each part.',
        ] },
        { type: 'reading', links: [
          { label: 'Anthropic: prompt engineering overview', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview', note: 'The provider-official structure — maps closely to this lesson\'s five parts.' },
          { label: 'OpenAI: prompt engineering guide', url: 'https://platform.openai.com/docs/guides/prompt-engineering', note: 'The other lab\'s consensus — the overlap is the real signal.' },
          { label: 'Anthropic prompt library', url: 'https://docs.anthropic.com/en/prompt-library/library', note: 'Dozens of production prompts to reverse-engineer with your new anatomy lens.' },
        ] },
      ],
    },
  ],
}
