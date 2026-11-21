import type { GameState } from '../game/engine'
import type { RoundSummary } from '../game/types'
import { ScoreBadge } from '../components/ScoreBadge'

function roundMin(round: RoundSummary): number {
  const real = round.playerSummaries.filter((s) => !s.isDummy).map((s) => s.finalRoundScore)
  return real.length ? Math.min(...real) : 0
}

// Single-round detail. Rendered inside the Home layout as a content mode, so it
// has no header, back button, or round actions of its own — navigation and the
// edit/delete controls live in the bottom bar.
export function Overview({ state, index }: { state: GameState; index: number }) {
  const round = state.roundHistory[index]
  if (!round) return null
  const min = roundMin(round)

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-10 pt-2">
      <section className="card">
        <h2 className="mb-3 text-lg font-bold">Round {index + 1}</h2>

        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-400">
          <span>Player</span>
          <span className="text-center">Score</span>
          <span className="text-center">Total</span>
        </div>

        <div className="mt-1 grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-3">
          {round.playerSummaries.map((s) => (
            <RowFragment key={s.id} summary={s} min={min} />
          ))}
        </div>
      </section>
    </div>
  )
}

function RowFragment({
  summary,
  min,
}: {
  summary: RoundSummary['playerSummaries'][number]
  min: number
}) {
  return (
    <>
      <span className="truncate font-medium">{summary.name}</span>
      <span className="flex justify-center">
        <ScoreBadge summary={summary} isRoundMin={!summary.isDummy && summary.finalRoundScore === min} size="sm" />
      </span>
      <span className="flex min-w-11 justify-center rounded-full bg-gradient-to-br from-cabo-500 to-cabo-700 px-3 py-1.5 text-lg font-bold tabular-nums text-white">
        {summary.totalScore}
      </span>
    </>
  )
}
