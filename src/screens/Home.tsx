import type { GameState } from '../game/engine'
import type { ID, RoundSummary } from '../game/types'
import { ScoreBadge } from '../components/ScoreBadge'
import { SwipeToDelete } from '../components/SwipeToDelete'
import { PencilIcon } from '../components/icons'

function roundMin(round: RoundSummary): number {
  const real = round.playerSummaries.filter((s) => !s.isDummy).map((s) => s.finalRoundScore)
  return real.length ? Math.min(...real) : 0
}

// Podium medal for a 0-based standing (0 = best). Only the top three place.
function rankMedal(place: number): { emoji: string; label: string } | undefined {
  return (
    [
      { emoji: '🥇', label: '1st place' },
      { emoji: '🥈', label: '2nd place' },
      { emoji: '🥉', label: '3rd place' },
    ][place] ?? undefined
  )
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
    <div className="mx-auto w-full max-w-2xl space-y-3 px-4 pt-2">
      {sorted.map((player) => {
        const avg = averageScore(player.id)
        // Podium medals once the game is under way. Players tied on score share
        // the same medal so a tie never silently hands one player the lead.
        const medal =
          state.roundHistory.length > 0
            ? rankMedal(sorted.findIndex((p) => p.currentTotalScore === player.currentTotalScore))
            : undefined
        return (
          <SwipeToDelete
            key={player.id}
            deleteLabel={`Delete ${player.name}`}
            onDelete={() => onDeletePlayer(player.id)}
          >
            <div className="card animate-pop-in">
              <div className="flex items-center gap-3">
                {medal && (
                  <span className="shrink-0 text-2xl leading-none" aria-label={medal.label}>
                    {medal.emoji}
                  </span>
                )}
                <button
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  onClick={() => onEditPlayer(player.id)}
                  aria-label={`Edit ${player.name}`}
                >
                  <span className="truncate text-2xl font-bold">{player.name}</span>
                  <PencilIcon
                    width={15}
                    height={15}
                    className="shrink-0 text-slate-300 dark:text-slate-500"
                  />
                </button>
                {avg !== undefined && (
                  <span className="shrink-0 text-xs font-medium text-slate-400">
                    ⌀ {avg.toFixed(1)}
                  </span>
                )}
                <span className="flex min-w-14 shrink-0 justify-center rounded-2xl bg-gradient-to-br from-cabo-500 to-cabo-700 px-3.5 py-2 text-2xl font-extrabold tabular-nums text-white shadow-md shadow-cabo-600/30">
                  {player.currentTotalScore}
                </span>
              </div>

              {state.roundHistory.length > 0 && (
                // Vertical padding keeps the superscript "C" marker and pill
                // shadows from being clipped by the horizontal scroll box.
                <div className="mt-2 flex gap-2 overflow-x-auto px-0.5 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          </SwipeToDelete>
        )
      })}
    </div>
  )
}
