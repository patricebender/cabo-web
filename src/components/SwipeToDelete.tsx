import { useRef, useState, type ReactNode, type PointerEvent } from 'react'
import { TrashIcon } from './icons'

// Width of the red delete action revealed behind the card when swiped open.
const ACTION_WIDTH = 88
// Horizontal drag (px) past which releasing snaps the row open.
const OPEN_THRESHOLD = ACTION_WIDTH / 2
// Fraction of the card's width past which releasing fires delete directly,
// rather than just snapping open (iOS-Mail full-swipe).
const COMMIT_FRACTION = 0.6
// A gesture only counts as a swipe once it's clearly more horizontal than
// vertical, so the vertical page scroll keeps working normally.
const DIR_LOCK = 10

// iOS-Mail-style swipe-to-reveal. Swiping the card left part-way slides a red
// delete button into view (tap it to fire onDelete); swiping all the way past
// the commit threshold fires onDelete on release. Tapping/dragging elsewhere,
// or swiping another row, closes it again.
export function SwipeToDelete({
  children,
  onDelete,
  deleteLabel,
}: {
  children: ReactNode
  onDelete: () => void
  deleteLabel: string
}) {
  const [open, setOpen] = useState(false)
  const [dragX, setDragX] = useState<number | null>(null) // non-null while dragging

  const rowRef = useRef<HTMLDivElement>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const axis = useRef<'none' | 'x' | 'y'>('none')

  function onPointerDown(e: PointerEvent) {
    // Ignore non-primary buttons / multi-touch.
    if (e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY }
    axis.current = 'none'
  }

  function onPointerMove(e: PointerEvent) {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y

    // Lock to an axis on first meaningful movement.
    if (axis.current === 'none') {
      if (Math.abs(dx) < DIR_LOCK && Math.abs(dy) < DIR_LOCK) return
      axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (axis.current === 'x') e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (axis.current !== 'x') return

    const base = open ? -ACTION_WIDTH : 0
    const width = rowRef.current?.offsetWidth ?? 320
    // Clamp between fully closed (0) and the full card width (full-swipe delete).
    const next = Math.max(-width, Math.min(0, base + dx))
    setDragX(next)
  }

  function onPointerUp() {
    if (dragX !== null) {
      const width = rowRef.current?.offsetWidth ?? 320
      if (dragX <= -width * COMMIT_FRACTION) {
        // Full swipe: slide the row off and fire delete.
        setDragX(null)
        setOpen(false)
        onDelete()
        start.current = null
        axis.current = 'none'
        return
      }
      setOpen(dragX <= -OPEN_THRESHOLD)
    }
    setDragX(null)
    start.current = null
    axis.current = 'none'
  }

  const translate = dragX ?? (open ? -ACTION_WIDTH : 0)
  // Red action tracks the card past the open position, so once the swipe nears
  // the commit point the delete fills the row instead of leaving a gap.
  const actionWidth = Math.max(ACTION_WIDTH, -translate)

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Delete action sits behind the card and is uncovered as it slides.
          Only rendered while the row is actually swiped, so the card's
          translucent background doesn't let the red bleed through when closed. */}
      {translate < 0 && (
        <button
          className="absolute inset-y-0 right-0 flex items-center justify-end bg-rose-500 pr-8 text-white"
          style={{ width: actionWidth }}
          aria-label={deleteLabel}
          tabIndex={open ? 0 : -1}
          onClick={() => {
            setOpen(false)
            onDelete()
          }}
        >
          <TrashIcon width={24} height={24} />
        </button>
      )}

      <div
        ref={rowRef}
        className="relative touch-pan-y bg-slate-100 dark:bg-slate-950"
        style={{
          transform: `translateX(${translate}px)`,
          transition: dragX === null ? 'transform 0.25s cubic-bezier(0.22,1,0.36,1)' : 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        // Tapping an open row closes it instead of hitting controls underneath.
        onClickCapture={(e) => {
          if (open) {
            e.stopPropagation()
            setOpen(false)
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
