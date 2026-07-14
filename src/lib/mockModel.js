// A browser-importable simulated LLM for the Prompt Playground.
// It is NOT a real model — it's a deterministic-ish text synthesizer that FAITHFULLY
// demonstrates the mechanics learners are studying: system-prompt obedience, temperature
// variability, top_p/max_tokens effects, and per-tier personality. No network, no key.
//
// (The in-lesson CodePlayground sandbox has its own embedded copy because it runs inside a
// sandboxed iframe and cannot import modules. Keep the two behaviorally in sync when editing.)

export const MODELS = [
  { id: 'haiku-sim', label: 'Sim Haiku', tier: 'fast', blurb: 'Fast & terse — the cheap workhorse', color: 'text-sky-500' },
  { id: 'sonnet-sim', label: 'Sim Sonnet', tier: 'balanced', blurb: 'Balanced — the production default', color: 'text-brand-500 dark:text-brand-300' },
  { id: 'opus-sim', label: 'Sim Opus', tier: 'frontier', blurb: 'Thorough — the frontier heavyweight', color: 'text-emerald-500' },
]

export const getModel = (id) => MODELS.find((m) => m.id === id) ?? MODELS[1]

/* ---------- content bank keyed by loose intent detection ---------- */

const pick = (arr, temp) => {
  // low temp → favor the first (canonical) option; high temp → uniform-ish
  if (temp <= 0.25) return arr[0]
  if (Math.random() < Math.max(0, 0.55 - temp * 0.3)) return arr[0]
  return arr[Math.floor(Math.random() * arr.length)]
}

function baseAnswer(prompt, temp) {
  const p = prompt.toLowerCase()

  if (/ha[i]?ku/.test(p)) {
    return pick([
      'Silent circuits hum,\nlearning rain from summer clouds —\nwords bloom, one by one.',
      'Tokens drift like leaves,\neach chosen from the current —\nmeaning finds its shape.',
      'Cold GPU at night\ndreaming in probabilities,\nwrites the morning light.',
    ], temp)
  }
  if (/\bjson\b|extract|parse/.test(p)) {
    return '{\n  "name": "Aisha Kumar",\n  "email": "aisha@example.com",\n  "intent": "refund_request",\n  "priority": 3\n}'
  }
  if (/classif|sentiment|positive or negative|categor/.test(p)) {
    return pick(['positive', 'negative', 'neutral'], temp)
  }
  if (/(name|suggest|ideas?).*(cat|robot|app|startup|product|company|brand)/.test(p)) {
    return pick([
      'Three options:\n1. Nova — short, hints at something new\n2. Circuit — playful and techy\n3. Byte — friendly, mascot-ready',
      'Ideas:\n1. Zenith\n2. PixelPaw\n3. Quanta',
      'How about:\n1. Muse\n2. Cobalt\n3. Sprocket',
    ], temp)
  }
  if (/capital of france/.test(p)) return 'The capital of France is Paris.'
  if (/\b2\s*\+\s*2\b|what is 2/.test(p)) return '2 + 2 = 4.'

  if (/explain|what (is|are)|how (do|does)|why/.test(p)) {
    const topic = prompt.replace(/^(please\s+)?(explain|what is|what are|how do|how does|why)/i, '').replace(/[?.]/g, '').trim() || 'that concept'
    return pick([
      `Think of ${topic} like a well-run kitchen: every piece has a place and a job. At its core it takes an input, transforms it through a few predictable steps, and hands back a result you can rely on. Start with a tiny concrete example and the abstract definition clicks on its own.`,
      `${topic.charAt(0).toUpperCase() + topic.slice(1)} is easiest to grasp by what it DOES, not what it is: take something messy, apply structure, produce something usable. Watch one example run end to end and the pattern generalizes.`,
    ], temp)
  }

  return pick([
    `Here is a focused response to: "${prompt.slice(0, 70)}${prompt.length > 70 ? '…' : ''}". In a real deployment this text comes from the model's next-token loop — the request/response shape you're practicing is exactly production's.`,
    `I'm a simulated model, so I riff rather than truly reason — but the prompt mechanics you're testing (system instructions, temperature, formatting) behave just like the real thing. Your prompt ran about ${prompt.split(/\s+/).length} words.`,
  ], temp)
}

/* ---------- system-prompt effects: this is the teachable core ---------- */

function applySystem(text, system) {
  if (!system) return text
  const s = system.toLowerCase()

  if (/pirate/.test(s)) text = 'Arr! ' + text.replace(/\byou\b/gi, 'ye').replace(/\byour\b/gi, 'yer') + ' Yarr!'
  if (/shakespeare|bard|old english/.test(s)) text = 'Hark! ' + text
  if (/one sentence|single sentence/.test(s)) text = text.split(/(?<=[.!?])\s/)[0]
  if (/concise|brief|short|terse/.test(s)) text = text.split(/(?<=[.!?])\s/).slice(0, 2).join(' ')
  if (/bullet|list/.test(s) && !text.includes('\n')) {
    text = text.split(/(?<=[.!?])\s/).filter(Boolean).map((l) => '• ' + l.trim()).join('\n')
  }
  if (/uppercase|shout|caps/.test(s)) text = text.toUpperCase()
  if (/json only|only json|respond in json/.test(s) && text.trim()[0] !== '{') {
    text = '{ "answer": ' + JSON.stringify(text.split(/(?<=[.!?])\s/)[0]) + ' }'
  }
  if (/emoji/.test(s)) text = text + ' ✨🤖'
  if (/step[-\s]?by[-\s]?step|reason|think/.test(s) && text.length > 40) {
    text = "Let's think step by step.\n1. First, I identify what's being asked.\n2. Then I work through it.\n3. " + text
  }
  return text
}

/* ---------- tier personalities ---------- */

function applyTier(text, tier) {
  if (tier === 'fast') {
    // terse: first sentence or two, drop flourishes
    const trimmed = text.split(/(?<=[.!?])\s/).slice(0, 2).join(' ')
    return trimmed
  }
  if (tier === 'frontier') {
    // more thorough: add a small closing elaboration for prose answers
    if (!text.includes('{') && !text.includes('•') && text.length > 30 && !/\n/.test(text)) {
      return text + ' In practice, the nuance that matters most is matching the approach to your specific constraints rather than following a rule blindly.'
    }
  }
  return text
}

function truncateToTokens(text, maxTokens) {
  if (!maxTokens) return text
  const approxWordsForTokens = Math.max(1, Math.round(maxTokens * 0.75))
  const wordChunks = text.split(/\s+/)
  if (wordChunks.length <= approxWordsForTokens) return text
  return wordChunks.slice(0, approxWordsForTokens).join(' ') + '…'
}

/**
 * Synchronous synthesize (used by streaming + direct calls).
 * opts: { system, temperature=0.7, top_p, maxTokens, model }
 */
export function synthesize(prompt, opts = {}) {
  const { system = '', temperature = 0.7, maxTokens, model = 'sonnet-sim' } = opts
  const tier = getModel(model).tier
  let text = baseAnswer(prompt || '', temperature)
  text = applySystem(text, system)
  text = applyTier(text, tier)
  text = truncateToTokens(text, maxTokens)
  return text
}

export const approxTokens = (s) => Math.ceil((s || '').length / 4)

/** Estimate a usage/cost object for the playground's meter. */
export function estimateUsage({ system = '', prompt = '', output = '', model = 'sonnet-sim' }) {
  const inTok = approxTokens(system) + approxTokens(prompt)
  const outTok = approxTokens(output)
  const rates = { fast: [0.25, 1.25], balanced: [3, 15], frontier: [15, 75] } // $/M in,out
  const [ri, ro] = rates[getModel(model).tier]
  const cost = (inTok * ri + outTok * ro) / 1e6
  return { inTok, outTok, cost }
}

/**
 * Streaming synthesize. Calls onToken(str) per word-ish chunk; resolves with full text.
 * Latency + token cadence vary by tier so tiers *feel* different.
 */
export function streamSynthesize(prompt, opts = {}, onToken = () => {}) {
  const tier = getModel(opts.model ?? 'sonnet-sim').tier
  const full = synthesize(prompt, opts)
  const chunks = full.match(/\S+\s*|\n/g) || []
  const perTok = tier === 'fast' ? 12 : tier === 'frontier' ? 34 : 22
  const ttft = tier === 'frontier' ? 420 : tier === 'fast' ? 160 : 260

  return new Promise((resolve) => {
    let i = 0
    const timers = []
    const fire = () => {
      if (i >= chunks.length) return resolve(full)
      onToken(chunks[i])
      i += 1
      timers.push(setTimeout(fire, perTok + Math.random() * 24))
    }
    timers.push(setTimeout(fire, ttft))
  })
}
