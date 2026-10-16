import type { GameState } from '../game/engine'
import type { RoundSummary } from '../game/types'
import { ScoreBadge } from '../components/ScoreBadge'
import { BackIcon, PencilIcon, TrashIcon } from '../components/icons'

function roundMin(round: RoundSummary): number {
  const real = round.playerSummaries.filter((s) => !s.isDummy).map((s) => s.finalRoundScore)
  return real.length ? Math.min(...real) : 0
}

// Round-by-round history. Each round shows every player's final score and the
// running total, with edit / delete actions.
export function Overview({
  state,
  onBack,
  onEditRound,
  onDeleteRound,
}: {
  state: GameState
  onBack: () => void
  onEditRound: (index: number) => void
  onDeleteRound: (index: number) => void
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 pb-10 pt-4">
      <header className="mb-4 flex items-center gap-2">
        <button className="btn-ghost !px-3 !py-2" onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>
        <h1 className="text-2xl font-extrabold">Round Overview</h1>
      </header>

      <div className="space-y-4">
        {state.roundHistory.map((round, index) => {
          const min = roundMin(round)
          return (
            <section key={round.id} className="card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Round {index + 1}</h2>
                <div className="flex gap-2">
                  <button
                    className="btn-ghost !px-3 !py-2"
                    onClick={() => onEditRound(index)}
                    aria-label={`Edit round ${index + 1}`}
                  >
                    <PencilIcon />
                  </button>
                  <button
                    className="btn-ghost !px-3 !py-2 text-rose-500"
                    onClick={() => onDeleteRound(index)}
                    aria-label={`Delete round ${index + 1}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

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
          )
        })}
      </div>
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
