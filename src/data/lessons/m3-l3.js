// Lesson 3.3 — Chain-of-Thought & Reasoning Techniques

export default {
  sections: [
    {
      id: 'room-to-think',
      title: 'Give the model room to think',
      blocks: [
        { type: 'p', text: "Remember Module 1's loop: the model commits to one token at a time with no take-backs. So if you demand the final answer immediately on a hard problem, it has to *blurt* — pattern-matching to a plausible-looking answer before it's actually worked anything out. The fix is beautifully simple: **let it reason out loud first.** This is [[Chain-of-Thought]] prompting, and on hard tasks it's the single biggest quality lever in this whole module." },
        { type: 'diagram', id: 'chain-of-thought', caption: 'Blurting hits the intuitive trap. Reasoning first turns one hard leap into easy sequential steps.' },
        { type: 'p', text: "Why does it work? Each reasoning token becomes part of the context for the next one. By writing \"let ball = x, bat = x + 1\", the model puts the right intermediate state into its own context — and then the next step is easy. **Reasoning tokens are scratch paper the model gets to read.** Deny the scratch paper and you force everything into a single impossible jump." },
        { type: 'callout', variant: 'analogy', title: 'Analogy: mental math vs showing your work', text: "Ask someone \"what's 17 × 24?\" and demand an instant answer — they'll guess. Say \"take your time, work it out\" and they'll do 17 × 24 = 17 × 20 + 17 × 4 = 340 + 68 = 408. Same person, same brain. The reasoning steps aren't decoration; they're how the answer gets computed. Models are identical: their 'thinking' is literally the tokens they write before the answer." },
      ],
    },
    {
      id: 'see-it',
      title: 'See it: the same trap, two ways',
      blocks: [
        { type: 'p', text: 'These are classic "cognitive reflection" problems designed to trip fast intuition. Answer directly and watch the trap spring; think step-by-step and watch it dissolve.' },
        { type: 'demo', id: 'cot-reveal' },
      ],
    },
    {
      id: 'techniques',
      title: 'The reasoning toolkit',
      blocks: [
        { type: 'table', headers: ['Technique', 'How', 'When'], rows: [
          ['**Zero-shot CoT**', 'Add "Let\'s think step by step" (or "reason before answering")', 'The cheapest win — try it first on any hard task'],
          ['**Few-shot CoT**', 'Show examples that include the reasoning, not just the answer', 'When you want a specific reasoning STYLE or structure'],
          ['**Structured reasoning**', 'Ask for reasoning in `<thinking>` tags, answer in `<answer>` tags', 'Production: reason internally, parse only the answer'],
          ['**Reasoning models**', 'Use o-series / extended-thinking models that reason automatically', 'Hard math, logic, planning — thinking is built in'],
          ['**Self-consistency**', 'Sample the reasoning N times, take the majority answer', 'High-stakes accuracy, when you can afford N calls'],
        ] },
        { type: 'playground', id: 'cot-lab', title: 'Reason then answer', height: 340, code: `// Force reasoning before the answer, then you can parse just the answer.
const problem = "A store had 120 apples. They sold 25%, then received a delivery " +
                "that doubled what remained. How many apples now?"

// WITHOUT reasoning room
console.log("=== direct ===")
console.log(await llm(problem + " Answer with just the number."))

// WITH reasoning room (structured)
console.log("\\n=== chain-of-thought ===")
const system = "Show your reasoning step by step, then end with a line: 'Answer: <number>'."
console.log(await llm(problem, { system }))`, solution: `// Solution: reason in tags, then EXTRACT only the answer for your app.
const problem = "A store had 120 apples. They sold 25%, then received a delivery " +
                "that doubled what remained. How many apples now?"

const system = \`Reason inside <thinking> tags, then give the final answer inside <answer> tags.
Example: <thinking>...steps...</thinking><answer>42</answer>\`

const raw = await llm(problem, { system })
console.log("full response:", raw)

// parse out just the answer — the reasoning was scaffolding, not output
const match = raw.match(/<answer>(.*?)<\\/answer>/s)
console.log("\\nparsed answer:", match ? match[1].trim() : "(no answer tag)")
// Production pattern: the model THINKS (better accuracy), your app
// only SHOWS the clean answer. Best of both — the user never sees the scratch work.
// Correct math: 120 -> sold 25% (30) -> 90 left -> doubled -> 180.`, caption: '**Exercise:** have the model reason in `<thinking>` tags and answer in `<answer>` tags, then extract ONLY the answer with a regex — so your app gets accuracy AND a clean output. Solution shows the full parse.' },
        { type: 'callout', variant: 'tip', text: "Production nuance: chain-of-thought costs **output tokens** (all that reasoning is generated text — Lesson 1.4). Two mitigations: (1) reason in tags and only *display* the answer, keeping quality while hiding verbosity; (2) use a [[Reasoning Model]] for genuinely hard tasks — it's trained to think efficiently and you don't manage the prompt. For easy tasks, skip CoT entirely; it's pure overhead." },
      ],
    },
    {
      id: 'quiz',
      title: 'Quiz — lock it in',
      blocks: [
        { type: 'quiz', questions: [
          {
            q: 'Why does "think step by step" improve accuracy on hard problems?',
            options: [
              'It makes the model try harder emotionally',
              'Each reasoning token enters the context, so the model builds up correct intermediate state instead of forcing one impossible leap',
              'It switches to a smarter model',
              'It increases the temperature',
            ],
            answer: 1,
            explain: 'Reasoning tokens are scratch paper the model reads. Writing the intermediate steps puts the right state into context, making each next step easy. Deny the scratch paper and you force a single blurt.',
          },
          {
            q: 'In production, how do you get CoT accuracy WITHOUT showing users the verbose reasoning?',
            options: [
              'You can\'t — reasoning is always visible',
              'Have the model reason inside tags (e.g. <thinking>) and parse out only the <answer> for display',
              'Set max_tokens very low',
              'Use temperature 0',
            ],
            answer: 1,
            explain: 'Structured reasoning: the model thinks in <thinking> tags (accuracy), your app extracts only <answer> (clean UX). The reasoning is scaffolding, not final output.',
          },
          {
            q: 'When is chain-of-thought the WRONG choice?',
            options: [
              'For hard math problems',
              'For simple tasks like "classify this as spam/not-spam" — it just adds cost and latency for no accuracy gain',
              'For logic puzzles',
              'For multi-step planning',
            ],
            answer: 1,
            explain: 'CoT costs output tokens and latency. On easy tasks the model gets it right instantly anyway, so reasoning is pure overhead. Reserve it for problems that genuinely need working-out.',
          },
          {
            q: 'What is a "reasoning model" (o-series, extended thinking)?',
            options: [
              'A model that only does math',
              'A model trained to produce extended internal chain-of-thought automatically before answering',
              'A model with a bigger context window',
              'A model that never hallucinates',
            ],
            answer: 1,
            explain: 'Reasoning models bake CoT into training — they think internally before answering, so you get the benefit without prompt engineering. Great for hard reasoning; overkill (and pricey) for simple tasks.',
          },
          {
            q: 'What is self-consistency?',
            options: [
              'Setting temperature to 0',
              'Sampling the reasoning multiple times and taking the majority answer, trading cost for accuracy on high-stakes questions',
              'Making the model agree with the user',
              'A caching strategy',
            ],
            answer: 1,
            explain: 'Self-consistency runs the reasoning N times (with some temperature) and votes. Different reasoning paths that converge on the same answer boost confidence. Costs N× but meaningfully improves hard-problem accuracy.',
          },
        ] },
      ],
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      blocks: [
        { type: 'flashcards', cards: [
          { id: 'm3-l3-c1', front: 'Why does chain-of-thought work?', back: 'Reasoning tokens enter the context and become scratch paper the model reads — building correct intermediate state instead of forcing one impossible leap.' },
          { id: 'm3-l3-c2', front: 'Cheapest way to trigger CoT?', back: 'Add "Let\'s think step by step" (zero-shot CoT). Try it first on any hard task before fancier techniques.' },
          { id: 'm3-l3-c3', front: 'Production CoT without verbose output?', back: 'Reason inside <thinking> tags, answer inside <answer> tags, then parse/display only the answer. Accuracy + clean UX.' },
          { id: 'm3-l3-c4', front: 'When is CoT the WRONG choice?', back: 'Simple tasks (classification, easy lookups). It adds output-token cost and latency with no accuracy gain — pure overhead.' },
          { id: 'm3-l3-c5', front: 'What is a reasoning model?', back: 'One trained to produce internal chain-of-thought automatically (o-series, extended thinking). Built-in CoT for hard tasks; pricey overkill for easy ones.' },
          { id: 'm3-l3-c6', front: 'What is self-consistency?', back: 'Sample the reasoning N times, take the majority answer. Trades N× cost for higher accuracy on high-stakes questions.' },
        ] },
      ],
    },
    {
      id: 'wrap-up',
      title: 'Wrap-up & practice',
      blocks: [
        { type: 'summary', points: [
          'Hard problems need reasoning ROOM — the model computes answers by writing intermediate steps.',
          'Reasoning tokens are scratch paper it reads; denying them forces a wrong blurt.',
          'Toolkit: zero-shot CoT, few-shot CoT, tagged reasoning, reasoning models, self-consistency.',
          'Production: reason in tags, display only the answer; reserve CoT for tasks that need it (it costs tokens).',
          'Reasoning models make CoT automatic for the hardest tasks.',
        ] },
        { type: 'mistakes', items: [
          { title: 'Chain-of-thought on everything', text: 'Wrapping every call in "think step by step" doubles cost and latency for tasks that never needed it. CoT is a hard-problem tool, not a default. Measure whether it actually helps your task before shipping it.' },
          { title: 'Asking for reasoning AFTER the answer', text: 'The order is load-bearing. "Give the answer, then explain" produces a blurt followed by a rationalization of the blurt — the reasoning didn\'t inform the answer. Reasoning must come BEFORE the conclusion to help.' },
          { title: 'Showing users the raw reasoning', text: 'Verbose chains of thought clutter UX and sometimes reveal things you\'d rather not (uncertain reasoning, internal rubrics). Reason in tags, parse the answer, display clean.' },
          { title: 'Trusting the reasoning as ground truth', text: 'CoT improves accuracy but the stated reasoning can still be post-hoc or subtly wrong while landing the right answer (or vice versa). It\'s a quality technique, not a guarantee or an audit trail — verify high-stakes outputs.' },
        ] },
        { type: 'interview', items: [
          { q: '"What is chain-of-thought prompting and why does it work?"', a: 'It\'s prompting the model to produce intermediate reasoning before the final answer. It works because generation is sequential and stateless per token — writing the reasoning puts correct intermediate state into the context, so each subsequent step is easier than one giant leap. Practically I trigger it with "think step by step," few-shot reasoning examples, or a reasoning model, and in production I have it reason in tags so I can parse just the answer.' },
          { q: '"When would you NOT use chain-of-thought, and what are its costs?"', a: 'Skip it for simple tasks — classification, extraction, lookups — where it adds output-token cost and latency without accuracy gain. The costs are real: reasoning is generated text you pay for, it slows responses, and raw chains can leak into UX. Mitigations: tag-and-parse to hide reasoning, and reserve reasoning models for genuinely hard problems where the accuracy justifies the spend.' },
          { q: '"How do reasoning models differ from prompting CoT yourself?"', a: 'Reasoning models are trained to think internally before answering, so the chain-of-thought is automatic and often more efficient than what you\'d hand-prompt. You trade control and cost (they\'re pricier, sometimes hide the reasoning) for capability on hard math, logic, and planning. Rule of thumb: prompt CoT on standard models for moderate tasks; reach for reasoning models when the problem is genuinely hard.' },
        ] },
        { type: 'usecases', items: [
          { title: 'Math & data analysis features', text: 'Any feature doing multi-step calculation reasons first — or delegates the arithmetic to a tool (Module 8), since even CoT math can slip.' },
          { title: 'Agent planning', text: 'Agents "think" before acting — CoT is the reasoning half of the reason→act→observe loop you\'ll build in Module 8.' },
          { title: 'Complex classification & triage', text: 'Nuanced routing ("is this a security incident?") improves when the model weighs evidence in tags before deciding.' },
          { title: 'Structured decision support', text: 'Legal/medical/financial assistants reason through criteria explicitly, then present a clean recommendation — reasoning hidden, answer shown, human verifies.' },
        ] },
        { type: 'project', title: 'The reasoning A/B', goal: 'Quantify when CoT actually helps — turning a technique into a measured decision.', steps: [
          'Assemble 12 problems in 3 buckets: 4 easy (simple classification/lookup), 4 medium (multi-step word problems), 4 hard (logic puzzles or multi-constraint reasoning).',
          'Run each problem twice: direct answer, and with "reason step by step, then answer."',
          'Score accuracy per bucket for both approaches. Also note the token/length difference.',
          'Chart it: where did CoT help, where was it wasted overhead? (Expected: big gains on hard, negligible on easy.)',
          'Write your rule of thumb for when to spend tokens on reasoning — you\'ll use it in every future AI feature.',
        ], deliverable: 'reasoning-ab.md with the accuracy-by-bucket table and your when-to-use-CoT rule.' },
        { type: 'challenge', title: 'The tag-and-parse pattern', text: 'Build a small function that takes any question, prompts the model to reason in <thinking> tags and answer in <answer> tags, then returns ONLY the parsed answer (with a fallback if the tags are missing). Test it on 5 questions. This is a genuinely production-useful utility — you get accuracy and clean output.', hints: [
          'Regex: /<answer>(.*?)<\\/answer>/s — the s flag lets . match newlines.',
          'Fallback matters: models occasionally forget the tags. Handle the null case gracefully (Lesson 2.6).',
          'Bonus: log the <thinking> content to your server for debugging, but never send it to the client.',
        ] },
        { type: 'reading', links: [
          { label: 'Chain-of-Thought Prompting (Wei et al.)', url: 'https://arxiv.org/abs/2201.11903', note: 'The original paper. Figures 1-3 tell the whole story.' },
          { label: 'Anthropic: let Claude think (CoT guidance)', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/chain-of-thought', note: 'Provider-official patterns including the tag approach.' },
          { label: 'Anthropic: extended thinking', url: 'https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking', note: 'How reasoning models expose (or hide) their thinking.' },
        ] },
      ],
    },
  ],
}
