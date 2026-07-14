import { Component } from 'react'

/**
 * Catches any runtime crash and shows a readable recovery screen
 * instead of a blank page. Styled inline so it renders even if CSS failed.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('AI Mastery crashed:', error, info?.componentStack)
    this.setState({ stack: info?.componentStack })
  }

  render() {
    if (!this.state.error) return this.props.children
    const box = {
      maxWidth: 560, margin: '10vh auto', padding: 28, borderRadius: 16,
      background: '#18181b', border: '1px solid #3f3f46', color: '#e4e4e7',
      fontFamily: 'system-ui, sans-serif',
    }
    const btn = {
      padding: '10px 16px', borderRadius: 10, border: '1px solid #52525b',
      background: '#27272a', color: '#e4e4e7', cursor: 'pointer', marginRight: 10, fontSize: 14,
    }
    return (
      <div style={box}>
        <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>😵 Something crashed</h1>
        <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.6 }}>
          The app hit a runtime error. A <strong>hard refresh</strong> (Ctrl+Shift+R) fixes stale-cache issues.
          If it keeps happening, clear the saved data below (exports your progress first is wise — Settings → Export).
        </p>
        <pre style={{ fontSize: 12, color: '#f87171', background: '#09090b', padding: 12, borderRadius: 10, overflowX: 'auto' }}>
          {String(this.state.error?.message || this.state.error)}
        </pre>
        {this.state.stack && (
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 12, color: '#a1a1aa', cursor: 'pointer' }}>Where it happened (share this when reporting)</summary>
            <pre style={{ fontSize: 11, color: '#71717a', background: '#09090b', padding: 12, borderRadius: 10, overflowX: 'auto', maxHeight: 180 }}>
              {this.state.stack.trim()}
            </pre>
          </details>
        )}
        <div style={{ marginTop: 16 }}>
          <button style={btn} onClick={() => location.reload()}>Reload</button>
          <button
            style={{ ...btn, borderColor: '#7f1d1d', color: '#fca5a5' }}
            onClick={() => { localStorage.removeItem('ai-mastery-v1'); location.reload() }}
          >
            Clear saved data &amp; reload
          </button>
        </div>
      </div>
    )
  }
}
