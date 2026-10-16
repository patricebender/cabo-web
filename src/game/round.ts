// Building a round from per-player entry, mirroring RoundEntryView's "Submit".
//
// The iOS view constructs a RoundSummary from the raw inputs (inputScore,
// specialCombo, didCallCabo), appends it to roundHistory, then calls
// recalcTotals(). We do the same here so appended rounds go through the exact
// same recalc path as edited ones.

import { GameEngine } from './engine'
import { makeId, type ID, type PlayerSummary, type RoundSummary } from './types'

export interface RoundInput {
  // Raw score the player typed (ignored when they have the special combo).
  scores: Record<ID, number>
  specialComboPlayer: ID | null
  caboCaller: ID | null
}

// Append a new round built from the given inputs, then recompute totals.
export function submitRound(engine: GameEngine, input: RoundInput): void {
  const summaries: PlayerSummary[] = engine.players.map((player) => {
    const special = player.id === input.specialComboPlayer
    const inputScore = special ? 0 : input.scores[player.id] ?? 0
    return {
      id: player.id,
      name: player.name,
      inputScore,
      specialCombo: special,
      didCallCabo: player.id === input.caboCaller,
      finalRoundScore: inputScore,
      totalScore: 0,
      isDummy: false,
    }
  })

  const round: RoundSummary = { id: makeId(), playerSummaries: summaries }
  engine.roundHistory.push(round)
  engine.recalcTotals()
}
