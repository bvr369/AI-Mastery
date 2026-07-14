// Small shared helpers. Keep this file dependency-free.

export const cn = (...parts) => parts.filter(Boolean).join(' ')

/** Local date key: 'YYYY-MM-DD' in the user's timezone (not UTC). */
export const dateKey = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const todayKey = () => dateKey(new Date())

export const addDays = (d, n) => {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

export const yesterdayKey = () => dateKey(addDays(new Date(), -1))

/** '90' -> '1h 30m', '45' -> '45m' */
export const fmtMinutes = (min) => {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export const fmtNumber = (n) => n.toLocaleString('en-US')

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

export const pct = (done, total) => (total === 0 ? 0 : Math.round((done / total) * 100))

/** Trigger a JSON file download in the browser. */
export const downloadJSON = (filename, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export const greeting = () => {
  const h = new Date().getHours()
  if (h < 5) return 'Burning the midnight oil'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
