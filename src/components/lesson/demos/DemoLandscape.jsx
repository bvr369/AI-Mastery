import { useState } from 'react'
import { Cloud, Package } from 'lucide-react'
import { cn } from '../../../lib/utils'

/** Filterable map of the model landscape (representative, not exhaustive). */

const MODELS = [
  { name: 'Claude (Opus/Sonnet/Haiku)', provider: 'Anthropic', access: 'closed', modality: 'text+vision', bestFor: 'Coding, agents, long documents, careful reasoning' },
  { name: 'GPT-4o / o-series', provider: 'OpenAI', access: 'closed', modality: 'text+vision+audio', bestFor: 'General purpose, huge ecosystem, realtime voice' },
  { name: 'Gemini', provider: 'Google', access: 'closed', modality: 'text+vision+audio', bestFor: 'Massive context windows, Google integration' },
  { name: 'Llama family', provider: 'Meta', access: 'open', modality: 'text+vision', bestFor: 'The default open model — huge community, every size' },
  { name: 'Mistral / Mixtral', provider: 'Mistral AI', access: 'open', modality: 'text', bestFor: 'Efficient European open models, solid small sizes' },
  { name: 'Qwen', provider: 'Alibaba', access: 'open', modality: 'text+vision', bestFor: 'Strong multilingual + coding open models' },
  { name: 'DeepSeek', provider: 'DeepSeek', access: 'open', modality: 'text', bestFor: 'Open reasoning models at aggressive cost' },
  { name: 'Stable Diffusion / FLUX', provider: 'Stability / BFL', access: 'open', modality: 'image', bestFor: 'Self-hosted image generation' },
  { name: 'DALL·E / gpt-image', provider: 'OpenAI', access: 'closed', modality: 'image', bestFor: 'API image generation inside products' },
  { name: 'Whisper', provider: 'OpenAI', access: 'open', modality: 'audio', bestFor: 'Speech-to-text — open weights, runs anywhere' },
  { name: 'ElevenLabs', provider: 'ElevenLabs', access: 'closed', modality: 'audio', bestFor: 'Production text-to-speech voices' },
  { name: 'Embedding models (voyage, text-embedding-3…)', provider: 'various', access: 'both', modality: 'embeddings', bestFor: 'Semantic search & RAG — Module 6' },
]

const ACCESS = [['all', 'All'], ['closed', 'Closed API'], ['open', 'Open weights']]
const MODS = ['all', 'text', 'vision', 'image', 'audio', 'embeddings']

export default function DemoLandscape({ onInteract }) {
  const [access, setAccess] = useState('all')
  const [mod, setMod] = useState('all')

  const visible = MODELS.filter(
    (m) =>
      (access === 'all' || m.access === access || m.access === 'both') &&
      (mod === 'all' || m.modality.includes(mod))
  )

  const set = (fn) => (v) => { onInteract?.(); fn(v) }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {ACCESS.map(([v, l]) => (
          <button key={v} onClick={() => set(setAccess)(v)} className={access === v ? 'chip-brand' : 'chip-zinc'}>{l}</button>
        ))}
        <span className="mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
        {MODS.map((v) => (
          <button key={v} onClick={() => set(setMod)(v)} className={mod === v ? 'chip-brand' : 'chip-zinc'}>{v}</button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {visible.map((m) => (
          <div key={m.name} className="card card-hover p-3.5">
            <div className="flex items-center gap-2">
              <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', m.access === 'open' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-brand-500/15 text-brand-500 dark:text-brand-300')}>
                {m.access === 'open' ? <Package size={14} /> : <Cloud size={14} />}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold txt-1">{m.name}</div>
                <div className="text-[10px] txt-3">{m.provider} · {m.modality}</div>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed txt-2">{m.bestFor}</p>
          </div>
        ))}
        {visible.length === 0 && <p className="col-span-2 p-6 text-center text-sm txt-3">No models match that combo — which is itself a useful market insight.</p>}
      </div>
      <p className="mt-3 text-xs txt-3">Representative names to anchor the landscape — specific model versions rotate every few months; the *categories* are what you're learning.</p>
    </div>
  )
}
