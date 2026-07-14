import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative w-full max-w-md animate-pop-in p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold txt-1">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="text-sm txt-2">{children}</div>
        {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
