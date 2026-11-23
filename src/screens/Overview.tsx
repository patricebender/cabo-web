import type { GameState } from '../game/engine'
import type { RoundSummary } from '../game/types'
import { ScoreBadge } from '../components/ScoreBadge'

function roundMin(round: RoundSummary): number {
  const real = round.playerSummaries.filter((s) => !s.isDummy).map((s) => s.finalRoundScore)
  return real.length ? Math.min(...real) : 0
}

// Single-round detail. Rendered inside the Home layout as a content mode, so it
// has no header, back button, or round actions of its own — navigation and the
// edit/delete controls live in the bottom bar. Fills the available height so the
// rows spread out instead of clustering at the top.
export function Overview({ state, index }: { state: GameState; index: number }) {
  const round = state.roundHistory[index]
  if (!round) return null
  const min = roundMin(round)

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-13rem)] w-full max-w-md flex-col px-4 pb-6 pt-2">
      <section className="card flex flex-1 flex-col">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-2xl font-extrabold">Round {index + 1}</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Score · Total
          </span>
        </div>

        <div className="-mx-4 flex flex-1 flex-col divide-y divide-slate-200/50 dark:divide-white/5">
          {round.playerSummaries.map((s) => (
            <Row key={s.id} summary={s} min={min} />
          ))}
        </div>
      </section>
    </div>
  )
}

function Row({
  summary,
  min,
}: {
  summary: RoundSummary['playerSummaries'][number]
  min: number
}) {
  return (
    <div className="grid flex-1 grid-cols-[1fr_auto_auto] items-center gap-x-4 px-4">
      <span className="truncate text-lg font-medium">{summary.name}</span>
      <span className="flex justify-center">
        <ScoreBadge
          summary={summary}
          isRoundMin={!summary.isDummy && summary.finalRoundScore === min}
          size="sm"
        />
      </span>
      <span className="flex min-w-12 justify-center rounded-full bg-gradient-to-br from-cabo-500 to-cabo-700 px-3 py-1.5 text-lg font-bold tabular-nums text-white">
        {summary.totalScore}
      </span>
    </div>
  )
}
