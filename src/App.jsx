import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useStore } from './store/store'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Roadmap from './pages/Roadmap'
import Lesson from './pages/Lesson'
import Glossary from './pages/Glossary'
import Notes from './pages/Notes'
import Review from './pages/Review'
import Settings from './pages/Settings'
import Playground from './pages/Playground'
import Projects from './pages/Projects'
import ComingSoon from './pages/ComingSoon'

function ScrollToTop() {
  const { pathname } = useLocation()
  // braces matter: extensions can patch window.scrollTo to return a value,
  // and a concise arrow would hand that to React as the effect "cleanup"
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const theme = useStore((s) => s.settings.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/learn/:lessonId" element={<Lesson />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/review" element={<Review />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/mentor" element={<ComingSoon feature="mentor" />} />
          <Route path="/interview" element={<ComingSoon feature="interview" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  )
}
