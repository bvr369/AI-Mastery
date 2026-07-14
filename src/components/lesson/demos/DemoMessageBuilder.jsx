import { useState } from 'react'
import { Plus, Trash2, Eye } from 'lucide-react'
import { cn } from '../../../lib/utils'

/** Build a messages array by hand and see exactly what the model receives. */

const CANNED_REPLIES = [
  'Sure — here\'s a concise answer based on the conversation so far.',
  'Good follow-up. Given what you said earlier, I\'d suggest option B.',
  'Here\'s the summary you asked for, in three bullets.',
]

export default function DemoMessageBuilder({ onInteract }) {
  const [system, setSystem] = useState('You are a helpful assistant for a React developer. Be concise.')
  const [messages, setMessages] = useState([{ role: 'user', content: 'What is a token?' }])
  const [showJSON, setShowJSON] = useState(false)

  const addUser = () => {
    onInteract?.()
    setMessages((m) => [...m, { role: 'user', content: 'And why do they matter for cost?' }])
  }
  const addAssistant = () => {
    onInteract?.()
    setMessages((m) => [...m, { role: 'assistant', content: CANNED_REPLIES[m.length % CANNED_REPLIES.length] }])
  }
  const update = (i, content) => setMessages((m) => m.map((msg, j) => (j === i ? { ...msg, content } : msg)))
  const remove = (i) => setMessages((m) => m.filter((_, j) => j !== i))

  const payload = { model: 'claude-sonnet-5', max_tokens: 500, system, messages }
  const tokens = Math.ceil(JSON.stringify(payload).length / 4)

  return (
    <div>
      <div className="mb-3 rounded-xl border border-brand-400/40 bg-brand-500/5 p-3">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-500 dark:text-brand-300">system (invisible to users, obeyed above them)</div>
        <textarea value={system} onChange={(e) => { onInteract?.(); setSystem(e.target.value) }} rows={2} className="w-full resize-none bg-transparent font-mono text-xs txt-1 focus:outline-none" />
      </div>

      <div className="space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={cn('rounded-xl border p-3', m.role === 'user' ? 'border-zinc-300 dark:border-zinc-700' : 'border-emerald-500/40 bg-emerald-500/5')}>
            <div className="mb-1 flex items-center justify-between">
              <span className={cn('text-[10px] font-bold uppercase tracking-widest', m.role === 'user' ? 'txt-3' : 'text-emerald-500')}>{m.role}</span>
              <button onClick={() => remove(i)} className="txt-3 hover:text-rose-500" aria-label="Delete message"><Trash2 size={12} /></button>
            </div>
            <textarea value={m.content} onChange={(e) => update(i, e.target.value)} rows={1} className="w-full resize-none bg-transparent font-mono text-xs txt-1 focus:outline-none" />
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={addUser} className="btn-outline px-3 py-1.5 text-xs"><Plus size={12} /> user turn</button>
        <button onClick={addAssistant} className="btn-outline px-3 py-1.5 text-xs"><Plus size={12} /> assistant turn</button>
        <button onClick={() => { onInteract?.(); setShowJSON((s) => !s) }} className="btn-ghost px-3 py-1.5 text-xs"><Eye size={12} /> {showJSON ? 'Hide' : 'Show'} exact payload</button>
        <span className="ml-auto chip-zinc">~{tokens} tokens/call</span>
      </div>

      {showJSON && (
        <pre className="mt-3 max-h-64 animate-fade-up overflow-auto rounded-xl bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-emerald-300">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}

      <p className="mt-3 text-xs leading-relaxed txt-3">
        This exact JSON is what hits the wire on every turn — including all the history. Delete an assistant turn and notice:
        the model would simply never know it said that. <strong className="txt-2">The array is the conversation.</strong>
      </p>
    </div>
  )
}
