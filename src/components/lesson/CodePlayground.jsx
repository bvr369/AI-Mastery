import { useEffect, useRef, useState } from 'react'
import { Play, Square, RotateCcw, Lightbulb, Terminal } from 'lucide-react'
import { highlight } from './CodeBlock'
import { cn } from '../../lib/utils'

/**
 * In-lesson code playground.
 * - Editor: transparent <textarea> over a highlighted <pre> (no editor deps)
 * - Runtime: sandboxed iframe, code delivered via postMessage, console captured back
 * - Simulated `llm()` / `llm.stream()` / mocked fetch for api.anthropic.com & api.openai.com,
 *   so lessons teach real API shapes with zero keys. `llm.failRate` injects 429s for retry lessons.
 */

const RUN_TIMEOUT_MS = 8000

// NOTE: </script> must stay split as <\/script> inside this template string.
const SANDBOX_HTML = `<!doctype html><html><body><script>
(function () {
  var send = function (type, data) { parent.postMessage({ __pg: true, type: type, data: data }, '*') }
  var fmt = function (v) {
    if (typeof v === 'string') return v
    try { return JSON.stringify(v, null, 1) } catch (e) { return String(v) }
  }
  ;['log', 'warn', 'error'].forEach(function (k) {
    console[k] = function () { send(k, Array.prototype.map.call(arguments, fmt).join(' ')) }
  })
  window.onerror = function (msg) { send('error', String(msg)); return true }
  window.onunhandledrejection = function (e) { send('error', 'Unhandled rejection: ' + fmt(e.reason && e.reason.message || e.reason)) }

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms) }) }
  var write = function (t) { send('write', String(t)) }
  var pick = function (arr, t) { return t < 0.3 ? arr[0] : arr[Math.floor(Math.random() * arr.length)] }

  /* ---------- the simulated model ---------- */
  function synthesize(prompt, system, temperature) {
    var p = (prompt || '').toLowerCase()
    var sys = (system || '').toLowerCase()
    var out
    if (p.indexOf('haiku') > -1) {
      out = pick([
        'Silent circuits hum,\\nlearning rain from summer clouds —\\nwords bloom, one by one.',
        'Tokens drift like leaves,\\neach one chosen from the stream —\\nmeaning finds its shape.',
        'Midnight GPU,\\ndreaming in probabilities,\\nwrites the morning sun.',
      ], temperature)
    } else if (p.indexOf('json') > -1 || p.indexOf('extract') > -1) {
      out = '{\\n  "name": "Aisha Kumar",\\n  "email": "aisha@example.com",\\n  "intent": "refund_request",\\n  "order_id": "ORD-4821",\\n  "sentiment": "frustrated"\\n}'
    } else if (p.indexOf('name') > -1 && (p.indexOf('cat') > -1 || p.indexOf('robot') > -1 || p.indexOf('app') > -1 || p.indexOf('startup') > -1)) {
      out = pick([
        'Here are three options:\\n1. Nova — short, memorable, hints at something new\\n2. Circuit — playful and techy\\n3. Byte — friendly for a mascot',
        'Three ideas for you:\\n1. Zenith\\n2. PixelPaw\\n3. Quanta',
      ], temperature)
    } else if (p.indexOf('capital of france') > -1) {
      out = 'The capital of France is Paris.'
    } else if (p.indexOf('explain') > -1 || p.indexOf('what is') > -1 || p.indexOf('what are') > -1) {
      var topic = prompt.replace(/^(explain|what is|what are)/i, '').replace(/[?.]/g, '').trim() || 'that concept'
      out = pick([
        'Think of ' + topic + ' like a well-organized kitchen: every piece has a place and a purpose. At its core, it takes an input, transforms it through a few predictable steps, and hands back a result you can rely on. The details matter less than the pattern: input, transformation, output.',
        topic.charAt(0).toUpperCase() + topic.slice(1) + ' is easiest to understand by what it does, not what it is: it takes something messy, applies structure, and produces something usable. Start with a tiny example, watch it work end to end, and the abstract definition will click on its own.',
      ], temperature)
    } else {
      out = pick([
        'Here is a focused answer to your prompt: "' + prompt.slice(0, 60) + (prompt.length > 60 ? '…' : '') + '". In a real deployment this text would come from the model\\'s next-token loop — the shape of the API call you just made is exactly what production code uses.',
        'Good prompt! I am a simulated model (Phase 3 adds real API keys), but the request/response mechanics you are practicing are identical to production. Your prompt was ' + prompt.split(/\\s+/).length + ' words — roughly ' + Math.ceil(prompt.length / 4) + ' tokens.',
      ], temperature)
    }
    /* system-prompt effects — visible and teachable */
    if (sys.indexOf('pirate') > -1) out = 'Arr! ' + out.replace(/\\byou\\b/g, 'ye').replace(/\\bmy\\b/g, 'me') + ' Yarr!'
    if (sys.indexOf('one sentence') > -1 || sys.indexOf('concise') > -1) out = out.split(/(?<=[.!?])\\s/)[0]
    if (sys.indexOf('uppercase') > -1 || sys.indexOf('shout') > -1) out = out.toUpperCase()
    if (sys.indexOf('json only') > -1 && out.trim()[0] !== '{') out = '{ "answer": ' + JSON.stringify(out.split(/(?<=[.!?])\\s/)[0]) + ' }'
    if (sys.indexOf('emoji') > -1) out = out + ' ✨🤖'
    return out
  }

  function maybeFail() {
    if (llm.failRate > 0 && Math.random() < llm.failRate) {
      var err = new Error('429 Too Many Requests — rate limit exceeded (simulated)')
      err.status = 429
      throw err
    }
  }

  async function llm(prompt, opts) {
    opts = opts || {}
    maybeFail()
    var t = opts.temperature == null ? 0.7 : opts.temperature
    await sleep(250 + Math.random() * 400)
    var text = synthesize(prompt, opts.system, t)
    if (opts.maxTokens) text = text.split(/\\s+/).slice(0, opts.maxTokens).join(' ')
    return text
  }
  llm.failRate = 0
  llm.stream = async function (prompt, opts, onToken) {
    if (typeof opts === 'function') { onToken = opts; opts = {} }
    opts = opts || {}
    maybeFail()
    await sleep(200 + Math.random() * 300) // time to first token
    var text = synthesize(prompt, opts.system, opts.temperature == null ? 0.7 : opts.temperature)
    var tokens = text.match(/\\S+\\s*/g) || []
    for (var i = 0; i < tokens.length; i++) {
      if (onToken) onToken(tokens[i])
      await sleep(20 + Math.random() * 45)
    }
    return text
  }

  /* ---------- mocked fetch for the big two providers ---------- */
  var realFetch = window.fetch ? window.fetch.bind(window) : null
  window.fetch = async function (url, init) {
    var u = String(url)
    var isAnthropic = u.indexOf('api.anthropic.com') > -1
    var isOpenAI = u.indexOf('api.openai.com') > -1
    if (!isAnthropic && !isOpenAI) {
      if (realFetch) return realFetch(url, init)
      throw new Error('fetch blocked in sandbox')
    }
    maybeFail()
    var body = {}
    try { body = JSON.parse(init && init.body || '{}') } catch (e) {}
    var msgs = body.messages || []
    var lastUser = ''
    for (var i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUser = typeof msgs[i].content === 'string' ? msgs[i].content : JSON.stringify(msgs[i].content)
        break
      }
    }
    var sys = body.system || (msgs[0] && msgs[0].role === 'system' ? msgs[0].content : '')
    await sleep(300 + Math.random() * 400)
    var text = synthesize(lastUser, sys, body.temperature == null ? 0.7 : body.temperature)
    var inTok = Math.ceil(JSON.stringify(msgs).length / 4)
    var outTok = Math.ceil(text.length / 4)
    var payload = isAnthropic
      ? { id: 'msg_sim_01', type: 'message', role: 'assistant', model: body.model || 'claude-sonnet-5', content: [{ type: 'text', text: text }], stop_reason: 'end_turn', usage: { input_tokens: inTok, output_tokens: outTok } }
      : { id: 'chatcmpl_sim_01', object: 'chat.completion', model: body.model || 'gpt-4o', choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }], usage: { prompt_tokens: inTok, completion_tokens: outTok, total_tokens: inTok + outTok } }
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  window.addEventListener('message', async function (e) {
    if (!e.data || !e.data.__pgRun) return
    try {
      var fn = new Function('llm', 'sleep', 'write', '"use strict"; return (async () => {\\n' + e.data.code + '\\n})()')
      await fn(llm, sleep, write)
      send('done', null)
    } catch (err) {
      send('error', String(err && err.message || err))
      send('done', null)
    }
  })
  send('ready', null)
})()
<\/script></body></html>`

let seq = 0

export default function CodePlayground({ initialCode, lang = 'javascript', height = 280, solution, onRun }) {
  const [code, setCode] = useState(initialCode.trim())
  const [lines, setLines] = useState([])
  const [running, setRunning] = useState(false)
  const [showingSolution, setShowingSolution] = useState(false)
  const iframeRef = useRef(null)
  const holderRef = useRef(null)
  const preRef = useRef(null)
  const consoleRef = useRef(null)
  const timeoutRef = useRef(null)
  const userCodeRef = useRef(null)
  const idRef = useRef(++seq)

  const pushLine = (kind, text) => {
    setLines((prev) => {
      if (kind === 'write' && prev.length && prev[prev.length - 1].kind === 'write') {
        const copy = prev.slice()
        copy[copy.length - 1] = { kind: 'write', text: copy[copy.length - 1].text + text }
        return copy
      }
      return [...prev, { kind, text }]
    })
  }

  const killIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.remove()
      iframeRef.current = null
    }
  }

  const ensureIframe = () =>
    new Promise((resolve) => {
      if (iframeRef.current?.dataset.ready === '1') return resolve(iframeRef.current)
      killIframe()
      const f = document.createElement('iframe')
      f.setAttribute('sandbox', 'allow-scripts')
      f.style.display = 'none'
      f.srcdoc = SANDBOX_HTML
      const onMsg = (e) => {
        if (e.source === f.contentWindow && e.data?.__pg && e.data.type === 'ready') {
          f.dataset.ready = '1'
          window.removeEventListener('message', onMsg)
          resolve(f)
        }
      }
      window.addEventListener('message', onMsg)
      holderRef.current.appendChild(f)
      iframeRef.current = f
    })

  // route sandbox output for THIS instance
  useEffect(() => {
    const onMsg = (e) => {
      if (!iframeRef.current || e.source !== iframeRef.current.contentWindow || !e.data?.__pg) return
      const { type, data } = e.data
      if (type === 'done') {
        clearTimeout(timeoutRef.current)
        setRunning(false)
      } else if (type !== 'ready') {
        pushLine(type, data)
      }
    }
    window.addEventListener('message', onMsg)
    return () => {
      window.removeEventListener('message', onMsg)
      killIframe()
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // console autoscroll (plain DOM write — no frame dependency)
  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight
  }, [lines])

  const run = async () => {
    if (running) return
    onRun?.()
    setLines([{ kind: 'info', text: '▸ running…' }])
    setRunning(true)
    const frame = await ensureIframe()
    frame.contentWindow.postMessage({ __pgRun: true, code }, '*')
    timeoutRef.current = setTimeout(() => {
      pushLine('error', `Stopped after ${RUN_TIMEOUT_MS / 1000}s — infinite loop? The sandbox was reset.`)
      killIframe()
      setRunning(false)
    }, RUN_TIMEOUT_MS)
  }

  const stop = () => {
    clearTimeout(timeoutRef.current)
    killIframe()
    setRunning(false)
    pushLine('info', '■ stopped')
  }

  const reset = () => {
    stop()
    setShowingSolution(false)
    setCode(initialCode.trim())
    setLines([])
  }

  const toggleSolution = () => {
    if (showingSolution) {
      setCode(userCodeRef.current ?? initialCode.trim())
      setShowingSolution(false)
    } else {
      userCodeRef.current = code
      setCode(solution.trim())
      setShowingSolution(true)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.target
      const { selectionStart: s, selectionEnd: en } = el
      setCode(code.slice(0, s) + '  ' + code.slice(en))
      setTimeout(() => { el.selectionStart = el.selectionEnd = s + 2 }, 0)
    }
  }

  const syncScroll = (e) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop
      preRef.current.scrollLeft = e.target.scrollLeft
    }
  }

  const tokens = highlight(code + '\n', lang)
  const editorStyle = 'm-0 p-4 font-mono text-[13px] leading-relaxed whitespace-pre'

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800" ref={holderRef}>
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-100/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <Terminal size={14} className="text-brand-500 dark:text-brand-300" />
        <span className="text-xs font-bold uppercase tracking-wide txt-3">Code playground</span>
        <span className="chip-zinc">simulated llm() — no API key needed</span>
        <div className="ml-auto flex items-center gap-1.5">
          {solution && (
            <button onClick={toggleSolution} className="btn-ghost px-2.5 py-1 text-xs">
              <Lightbulb size={13} /> {showingSolution ? 'My code' : 'Solution'}
            </button>
          )}
          <button onClick={reset} className="btn-ghost px-2.5 py-1 text-xs"><RotateCcw size={13} /> Reset</button>
          {running ? (
            <button onClick={stop} className="btn bg-rose-600 px-3 py-1 text-xs text-white hover:bg-rose-500"><Square size={12} /> Stop</button>
          ) : (
            <button onClick={run} className="btn-primary px-3 py-1 text-xs"><Play size={12} /> Run</button>
          )}
        </div>
      </div>

      {/* editor */}
      <div className="relative bg-white dark:bg-zinc-950/70" style={{ height }}>
        <pre ref={preRef} aria-hidden className={cn(editorStyle, 'pointer-events-none absolute inset-0 overflow-auto text-zinc-800 dark:text-zinc-200')}>
          <code>{tokens.map((t, i) => (t.cls ? <span key={i} className={t.cls}>{t.text}</span> : t.text))}</code>
        </pre>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={onKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          wrap="off"
          aria-label="Code editor"
          className={cn(editorStyle, 'absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent text-transparent caret-brand-500 outline-none dark:caret-brand-300')}
        />
      </div>

      {/* console */}
      <div ref={consoleRef} className="h-40 overflow-y-auto border-t border-zinc-200 bg-zinc-950 p-3 font-mono text-xs leading-relaxed dark:border-zinc-800">
        {lines.length === 0 && <div className="italic text-zinc-600">Console output appears here — hit Run ▸</div>}
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              'whitespace-pre-wrap break-words',
              l.kind === 'error' && 'text-rose-400',
              l.kind === 'warn' && 'text-amber-300',
              l.kind === 'info' && 'italic text-zinc-500',
              l.kind === 'write' && 'text-emerald-300',
              l.kind === 'log' && 'text-zinc-200'
            )}
          >
            {l.text}
          </div>
        ))}
      </div>
    </div>
  )
}
