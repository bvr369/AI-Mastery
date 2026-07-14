import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import Toasts from '../ui/Toasts'
import CommandPalette from '../ui/CommandPalette'
import { useUI } from '../../store/ui'

export default function AppLayout() {
  const setPalette = useUI((s) => s.setPalette)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette(!useUI.getState().paletteOpen)
      } else if (e.key === 'Escape' && useUI.getState().paletteOpen) {
        setPalette(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPalette])

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
          <Outlet />
        </main>
      </div>
      <Toasts />
      <CommandPalette />
    </div>
  )
}
