import { useEffect, useRef, useState } from 'react'
import {
  Play, Square, Save, Trash2, History, FileText, Zap, Clock, ChevronDown, Sparkles, BookmarkPlus,
} from 'lucide-react'
import { MODELS, getModel, streamSynthesize, estimateUsage, approxTokens } from '../lib/mockModel'
import { usePlayground, selectSavedPrompts, TEMPLATES } from '../store/playground'
import { useStore } from '../store/store'
import { cn, copyText } from '../lib/utils'

function Slider({ label, value, min, max, step, onChange, fmt, note }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-mono font-medium txt-1">{label}</span>
        <span className="tabular-nums text-brand-500 dark:text-brand-300">{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-brand-500" aria-label={label} />
      {note && <div className="mt-0.5 text-[10px] txt-3">{note}</div>}
    </div>
  )
}

function OutputPanel({ model, state }) {
  const m = getModel(model)
  return (
    <div className="card flex min-h-[200px] flex-col p-0">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <Sparkles size={13} className={m.color} />
        <span className="text-xs font-bold txt-1">{m.label}</span>
        <span className="chip-zinc">{m.tier}</span>
        {state?.ms != null && <span className="ml-auto text-[10px] txt-3">{state.ttft}ms TTFT · {state.ms}ms</span>}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {!state && <p className="text-sm italic txt-3">Output appears here after you Run.</p>}
        {state?.text != null && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed txt-1">
            {state.text}
            {state.streaming && <span className="ml-0.5 inline-block h-4 w-[7px] animate-pulse-soft bg-brand-500 align-middle" />}
          </p>
        )}
      </div>
      {state?.usage && (
        <div className="flex items-center gap-3 border-t border-zinc-200 px-3 py-1.5 text-[10px] txt-3 dark:border-zinc-800">
          <span>{state.usage.inTok} in / {state.usage.outTok} out</span>
          <span className="ml-auto tabular-nums">${state.usage.cost.toFixed(6)}</span>
        </div>
      )}
    </div>
  )
}

export default function Playground() {
  const [system, setSystem] = useState(TEMPLATES[5].system)
  const [user, setUser] = useState(TEMPLATES[5].user)
  const [temperature, setTemperature] = useState(0.7)
  const [topP, setTopP] = useState(1)
  const [maxTokens, setMaxTokens] = useState(300)
  const [selected, setSelected] = useState(['sonnet-sim'])
  const [outputs, setOutputs] = useState({})
  const [running, setRunning] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [copiedCurl, setCopiedCurl] = useState(false)
  const runToken = useRef(0)

  const saved = usePlayground((s) => s.saved)
  const history = usePlayground((s) => s.history)
  const savePrompt = usePlayground((s) => s.savePrompt)
  const deletePrompt = usePlayground((s) => s.deletePrompt)
  const pushHistory = usePlayground((s) => s.pushHistory)
  const clearHistory = usePlayground((s) => s.clearHistory)
  const bumpCounter = useStore((s) => s.bumpCounter)
  const touch = useStore((s) => s.touch)

  const savedList = selectSavedPrompts(saved)

  const toggleModel = (id) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]).sort((a, b) => MODELS.findIndex((m) => m.id === a) - MODELS.findIndex((m) => m.id === b)))

  const run = async () => {
    if (running || selected.length === 0 || !user.trim()) return
    const myRun = ++runToken.current
    setRunning(true)
    touch()
    bumpCounter('playgroundRuns')
    setOutputs(Object.fromEntries(selected.map((id) => [id, { text: '', streaming: true }])))

    await Promise.all(
      selected.map(async (id) => {
        const t0 = performance.now()
        let ttft = null
        const text = await streamSynthesize(
          user,
          { system, temperature, maxTokens, model: id },
          (tok) => {
            if (runToken.current !== myRun) return
            if (ttft == null) ttft = Math.round(performance.now() - t0)
            setOutputs((o) => ({ ...o, [id]: { ...o[id], text: (o[id]?.text || '') + tok, streaming: true, ttft } }))
          }
        )
        if (runToken.current !== myRun) return
        const usage = estimateUsage({ system, prompt: user, output: text, model: id })
        setOutputs((o) => ({ ...o, [id]: { text, streaming: false, ttft, ms: Math.round(performance.now() - t0), usage } }))
      })
    )
    if (runToken.current === myRun) {
      setRunning(false)
      pushHistory({ system, user, temperature, models: [...selected], preview: (user || '').slice(0, 60) })
    }
  }

  const stop = () => { runToken.current++; setRunning(false); setOutputs((o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { ...v, streaming: false }]))) }

  const loadConfig = (c) => {
    setSystem(c.system ?? ''); setUser(c.user ?? '')
    setTemperature(c.temperature ?? 0.7); setTopP(c.topP ?? 1); setMaxTokens(c.maxTokens ?? 300)
    setShowLibrary(false)
    setOutputs({})
  }

  const onSave = () => {
    const name = window.prompt('Name this prompt:', user.slice(0, 40))
    if (name === null) return
    savePrompt({ name, system, user, temperature, topP, maxTokens })
  }

  const copyCurl = async () => {
    const body = JSON.stringify({ model: 'claude-sonnet-5', max_tokens: maxTokens, temperature, system, messages: [{ role: 'user', content: user }] }, null, 2)
    const curl = `curl https://api.anthropic.com/v1/messages \\\n  -H "x-api-key: $ANTHROPIC_API_KEY" \\\n  -H "anthropic-version: 2023-06-01" \\\n  -H "content-type: application/json" \\\n  -d '${body}'`
    if (await copyText(curl)) { setCopiedCurl(true); setTimeout(() => setCopiedCurl(false), 1500) }
  }

  const totalTokens = approxTokens(system) + approxTokens(user)

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight txt-1">Prompt Playground</h1>
          <p className="mt-1 text-sm txt-2">Write prompts, tune the knobs, compare models side by side. Runs on a simulated model — no key needed.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <button onClick={() => setShowLibrary((v) => !v)} className="btn-outline"><FileText size={14} /> Templates & saved <ChevronDown size={13} /></button>
            {showLibrary && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowLibrary(false)} />
                <div className="card absolute right-0 z-40 mt-2 max-h-96 w-80 overflow-y-auto p-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest txt-3">Templates</div>
                  {TEMPLATES.map((t) => (
                    <button key={t.name} onClick={() => loadConfig(t)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-brand-500/10">
                      <Sparkles size={13} className="shrink-0 text-brand-500 dark:text-brand-300" />
                      <span className="truncate txt-1">{t.name}</span>
                    </button>
                  ))}
                  {savedList.length > 0 && <div className="mt-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest txt-3">Your saved prompts</div>}
                  {savedList.map((p) => (
                    <div key={p.id} className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-brand-500/10">
                      <button onClick={() => loadConfig(p)} className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm">
                        <BookmarkPlus size={13} className="shrink-0 text-amber-500" />
                        <span className="truncate txt-1">{p.name}</span>
                      </button>
                      <button onClick={() => deletePrompt(p.id)} className="txt-3 hover:text-rose-500" aria-label="Delete"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={onSave} className="btn-outline"><Save size={14} /> Save</button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* config column */}
        <div className="space-y-4">
          <div className="card p-4">
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-brand-500 dark:text-brand-300">System prompt</label>
            <textarea value={system} onChange={(e) => setSystem(e.target.value)} rows={4} className="input resize-y font-mono text-xs" placeholder="You are a helpful assistant…" />
            <label className="mb-1 mt-3 block text-[10px] font-bold uppercase tracking-widest txt-3">User message</label>
            <textarea value={user} onChange={(e) => setUser(e.target.value)} rows={4} className="input resize-y font-mono text-xs" placeholder="Ask something…" />
            <div className="mt-1.5 text-right text-[10px] txt-3">~{totalTokens} input tokens</div>
          </div>

          <div className="card space-y-3 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest txt-3">Parameters</div>
            <Slider label="temperature" value={temperature} min={0} max={2} step={0.05} onChange={setTemperature} fmt={(v) => v.toFixed(2)} note={temperature <= 0.2 ? 'deterministic' : temperature <= 1 ? 'balanced' : 'creative / risky'} />
            <Slider label="top_p" value={topP} min={0.1} max={1} step={0.05} onChange={setTopP} fmt={(v) => v.toFixed(2)} note={topP < 1 ? `nucleus cutoff at ${Math.round(topP * 100)}%` : 'off (keep all tokens)'} />
            <Slider label="max_tokens" value={maxTokens} min={20} max={1000} step={10} onChange={setMaxTokens} note="output budget / cost brake" />
          </div>

          <div className="card p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest txt-3">Compare models</div>
            <div className="space-y-1.5">
              {MODELS.map((m) => (
                <label key={m.id} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm transition-colors', selected.includes(m.id) ? 'border-brand-400/60 bg-brand-500/5' : 'border-zinc-200 dark:border-zinc-800')}>
                  <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggleModel(m.id)} className="accent-brand-500" />
                  <Sparkles size={13} className={m.color} />
                  <span className="font-medium txt-1">{m.label}</span>
                  <span className="ml-auto text-[10px] txt-3">{m.blurb}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {running ? (
              <button onClick={stop} className="btn flex-1 bg-rose-600 text-white hover:bg-rose-500"><Square size={14} /> Stop</button>
            ) : (
              <button onClick={run} disabled={selected.length === 0 || !user.trim()} className="btn-primary flex-1"><Play size={15} /> Run {selected.length > 1 ? `×${selected.length}` : ''}</button>
            )}
            <button onClick={copyCurl} className="btn-ghost" title="Copy as curl">{copiedCurl ? '✓' : 'curl'}</button>
          </div>
        </div>

        {/* output column */}
        <div className="space-y-4">
          {selected.length === 0 ? (
            <div className="card p-10 text-center text-sm txt-3">Select at least one model to compare.</div>
          ) : (
            <div className={cn('grid gap-3', selected.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1')}>
              {selected.map((id) => <OutputPanel key={id} model={id} state={outputs[id]} />)}
            </div>
          )}

          {history.length > 0 && (
            <div className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest txt-3"><History size={12} /> Recent runs</span>
                <button onClick={clearHistory} className="text-[10px] txt-3 hover:text-rose-500">clear</button>
              </div>
              <div className="space-y-1">
                {history.slice(0, 8).map((h) => (
                  <button key={h.id} onClick={() => loadConfig(h)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-brand-500/10">
                    <Clock size={11} className="shrink-0 txt-3" />
                    <span className="truncate txt-2">{h.preview || h.user?.slice(0, 60)}</span>
                    <span className="ml-auto flex shrink-0 items-center gap-1 txt-3"><Zap size={9} />{h.temperature?.toFixed?.(1)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-xs txt-3">
            This is a <strong className="txt-2">simulated</strong> model for safe, key-free practice — it mimics system-prompt obedience, temperature, and tier differences, not real intelligence. The <span className="font-mono">curl</span> button gives you the real request to run against a live API.
          </p>
        </div>
      </div>
    </div>
  )
}
