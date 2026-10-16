import { useEffect, useState, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

// Centered, accessible modal sheet with a backdrop. Closes on Escape / backdrop.
//
// On mobile the on-screen keyboard shrinks the *visual* viewport but not the
// layout viewport, so a bottom-anchored sheet gets hidden behind the keyboard.
// We pin the overlay to visualViewport height and offset it by the keyboard
// inset, then center the sheet in the remaining space — keeping the input and
// buttons visible while typing.
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const viewport = useViewportInset(open)

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
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in"
      style={{ height: viewport.height, transform: `translateY(${viewport.offsetTop})` }}
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="flex max-h-full w-full max-w-md flex-col overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-pop-in dark:bg-slate-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-bold">{title}</h2>
        {children}
        {footer && <div className="mt-6 flex gap-3">{footer}</div>}
      </div>
    </div>
  )
}

// Tracks the visual viewport so the overlay matches the space not covered by
// the keyboard. offsetTop handles iOS Safari scrolling the visual viewport up
// when the keyboard opens. Falls back to full height where unavailable.
function useViewportInset(open: boolean): { height: string; offsetTop: string } {
  const [inset, setInset] = useState({ height: '100dvh', offsetTop: '0px' })

  useEffect(() => {
    if (!open) return
    const vv = window.visualViewport
    if (!vv) return

    const update = () => setInset({ height: `${vv.height}px`, offsetTop: `${vv.offsetTop}px` })
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [open])

  return inset
}
