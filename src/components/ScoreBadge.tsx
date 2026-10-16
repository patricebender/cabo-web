import type { PlayerSummary } from '../game/types'

// Pill-shaped round score, color-coded like the iOS app:
//  - gray   -> dummy (player joined later)
//  - green  -> round winner (lowest non-dummy score)
//  - blue   -> everyone else
// A superscript "C" marks the player who called Cabo that round.
export function ScoreBadge({
  summary,
  isRoundMin,
  size = 'md',
}: {
  summary: PlayerSummary
  isRoundMin: boolean
  size?: 'sm' | 'md'
}) {
  const color = summary.isDummy
    ? 'bg-slate-300/60 text-slate-600 dark:bg-slate-600/40 dark:text-slate-300'
    : isRoundMin
      ? 'bg-emerald-400/30 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200'
      : 'bg-sky-400/20 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200'

  const dims = size === 'sm' ? 'min-w-9 px-2.5 py-1 text-base' : 'min-w-11 px-3 py-1.5 text-lg'

  return (
    <span className="relative inline-flex">
      <span className={`inline-flex items-center justify-center rounded-full font-bold tabular-nums ${color} ${dims}`}>
        {summary.finalRoundScore}
      </span>
      {summary.didCallCabo && (
        <span
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cabo-600 text-[10px] font-black text-white shadow"
          title="Called Cabo"
        >
          C
        </span>
      )}
    </span>
  )
}
