/** The GenAI stack: apps → APIs → models → hardware, with value flowing up. */

const LAYERS = [
  { y: 20, label: 'Products & apps', items: ['ChatGPT · Copilot · Notion AI · your next app'], cls: 'fill-emerald-500/10 stroke-emerald-500/50', text: 'fill-emerald-600 dark:fill-emerald-400' },
  { y: 90, label: 'APIs & platforms', items: ['Anthropic · OpenAI · Google · AWS Bedrock · Azure'], cls: 'fill-brand-500/10 stroke-brand-400/60', text: 'fill-brand-600 dark:fill-brand-300' },
  { y: 160, label: 'Models', items: ['Claude · GPT · Gemini  |  open: Llama · Mistral · Qwen'], cls: 'fill-sky-500/10 stroke-sky-500/50', text: 'fill-sky-600 dark:fill-sky-400' },
  { y: 230, label: 'Compute', items: ['NVIDIA GPUs · TPUs · inference clusters'], cls: 'fill-amber-500/10 stroke-amber-500/50', text: 'fill-amber-600 dark:fill-amber-400' },
]

export default function DiagramStack() {
  return (
    <svg viewBox="0 0 760 300" className="w-full" role="img" aria-label="The generative AI stack: hardware at the bottom, then models, then APIs, then products">
      {LAYERS.map((l) => (
        <g key={l.label}>
          <rect x="90" y={l.y} width="580" height="52" rx="12" className={l.cls} strokeWidth="1.2" />
          <text x="110" y={l.y + 22} fontSize="13" fontWeight="700" className={l.text}>{l.label}</text>
          <text x="110" y={l.y + 40} fontSize="11" className="fill-zinc-500 dark:fill-zinc-400">{l.items[0]}</text>
        </g>
      ))}
      {/* value flowing up */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <line x1={710} y1={LAYERS[i + 1].y + 2} x2={710} y2={LAYERS[i].y + 50} className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.5" strokeDasharray="3 4" />
          <circle r="3.5" cx="710" className="fill-brand-500">
            <animate attributeName="cy" values={`${LAYERS[i + 1].y + 4};${LAYERS[i].y + 48}`} dur="2.2s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;0" dur="2.2s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      <text x="726" y="160" fontSize="10" transform="rotate(90 726 160)" className="fill-zinc-400 dark:fill-zinc-500">capability flows up</text>
      {/* you are here */}
      <g>
        <rect x="20" y="26" width="58" height="40" rx="10" className="fill-brand-500" opacity="0.9">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
        </rect>
        <text x="49" y="43" textAnchor="middle" fontSize="9" fontWeight="700" className="fill-white">YOU</text>
        <text x="49" y="56" textAnchor="middle" fontSize="8" className="fill-white">build here</text>
        <line x1="78" y1="46" x2="90" y2="46" className="stroke-brand-400" strokeWidth="1.5" />
      </g>
      <text x="380" y="296" textAnchor="middle" fontSize="11" className="fill-zinc-500 dark:fill-zinc-400">AI engineers live at the top two layers — you rent everything below via an API key</text>
    </svg>
  )
}
