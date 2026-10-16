import type { GameState } from '../game/engine'
import type { ID, RoundSummary } from '../game/types'
import { ScoreBadge } from '../components/ScoreBadge'
import { PencilIcon, TrashIcon } from '../components/icons'

function roundMin(round: RoundSummary): number {
  const real = round.playerSummaries.filter((s) => !s.isDummy).map((s) => s.finalRoundScore)
  return real.length ? Math.min(...real) : 0
}

// Leaderboard: players sorted by total (ascending — lowest wins in Cabo), each
// with their average and a horizontally scrollable strip of round scores.
export function Home({
  state,
  averageScore,
  onEditPlayer,
  onDeletePlayer,
}: {
  state: GameState
  averageScore: (id: ID) => number | undefined
  onEditPlayer: (id: ID) => void
  onDeletePlayer: (id: ID) => void
}) {
  const sorted = [...state.players].sort((a, b) => a.currentTotalScore - b.currentTotalScore)

  if (state.players.length === 0) {
    return (
      <div className="mx-auto mt-16 max-w-md px-6 text-center text-slate-400">
        <div className="mb-3 text-5xl">🦄</div>
        <p className="text-lg font-medium">No players yet.</p>
        <p className="mt-1 text-sm">Tap the add button to start a game.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-3 px-4 pt-2">
      {sorted.map((player, rank) => {
        const avg = averageScore(player.id)
        return (
          <div key={player.id} className="card animate-pop-in">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                {rank + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <h2 className="truncate text-xl font-bold">{player.name}</h2>
                  {avg !== undefined && (
                    <span className="shrink-0 text-xs font-medium text-slate-400">
                      ⌀ {avg.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <span className="flex min-w-12 justify-center rounded-full bg-gradient-to-br from-cabo-500 to-cabo-700 px-3 py-1.5 text-xl font-extrabold tabular-nums text-white shadow-md shadow-cabo-600/30">
                {player.currentTotalScore}
              </span>
              <div className="flex gap-1">
                <button
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-cabo-600 dark:hover:bg-white/5"
                  onClick={() => onEditPlayer(player.id)}
                  aria-label={`Edit ${player.name}`}
                >
                  <PencilIcon />
                </button>
                <button
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                  onClick={() => onDeletePlayer(player.id)}
                  aria-label={`Delete ${player.name}`}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            {state.roundHistory.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {state.roundHistory.map((round) => {
                  const summary = round.playerSummaries.find((s) => s.id === player.id)
                  if (!summary) return null
                  return (
                    <ScoreBadge
                      key={round.id}
                      summary={summary}
                      isRoundMin={!summary.isDummy && summary.finalRoundScore === roundMin(round)}
                      size="sm"
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
