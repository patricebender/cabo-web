import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

// Centered, accessible modal sheet with a backdrop. Closes on Escape / backdrop.
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl animate-slide-up dark:bg-slate-900 sm:rounded-3xl sm:animate-pop-in"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-bold">{title}</h2>
        {children}
        {footer && <div className="mt-6 flex gap-3">{footer}</div>}
      </div>
    </div>
  )
}
