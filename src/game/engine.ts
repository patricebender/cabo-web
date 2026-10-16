// Pure scoring engine, ported 1:1 from GameViewModel.swift.
//
// The web app stores history as RoundSummary[] (same as the iOS app). All score
// math flows through recalcTotals/recalcRound so that editing an existing round
// recomputes everything from the raw inputs — matching the Swift behavior and
// its test suite exactly.

import {
  makeId,
  makePlayer,
  type ID,
  type Player,
  type PlayerSummary,
  type RoundSummary,
} from './types'

export const MAX_PLAYERS = 6

export class GameEngine {
  players: Player[] = []
  roundHistory: RoundSummary[] = []
  caboWinnerGetsZero = false

  // --- Player management ---------------------------------------------------

  // Add a player (up to MAX_PLAYERS). Existing rounds get a dummy entry so the
  // newcomer doesn't retroactively affect past scores.
  addPlayer(name: string): void {
    if (this.players.length >= MAX_PLAYERS) return

    const newPlayer = makePlayer(name)
    this.players.push(newPlayer)

    for (const round of this.roundHistory) {
      round.playerSummaries.push({
        id: newPlayer.id,
        name: newPlayer.name,
        inputScore: 0,
        specialCombo: false,
        didCallCabo: false,
        finalRoundScore: 0,
        totalScore: 0,
        isDummy: true,
      })
    }

    this.recalcTotals()
  }

  updatePlayerName(id: ID, newName: string): void {
    const player = this.players.find((p) => p.id === id)
    if (player) player.name = newName

    for (const round of this.roundHistory) {
      for (const summary of round.playerSummaries) {
        if (summary.id === id) summary.name = newName
      }
    }
  }

  // Remove players at the given indices (into the current `players` array).
  deletePlayer(indices: number[]): void {
    const idsToRemove = new Set(indices.map((i) => this.players[i]?.id).filter(Boolean) as ID[])

    this.players = this.players.filter((_, i) => !indices.includes(i))

    for (const round of this.roundHistory) {
      round.playerSummaries = round.playerSummaries.filter((s) => !idsToRemove.has(s.id))
    }

    this.recalcTotals()
  }

  resetGame(): void {
    this.roundHistory = []
    for (const player of this.players) player.currentTotalScore = 0
  }

  // --- Scoring -------------------------------------------------------------

  // Recompute every round's final scores and cumulative totals from raw inputs.
  recalcTotals(): void {
    const cumulativeTotals = new Map<ID, number>()
    for (const player of this.players) cumulativeTotals.set(player.id, 0)

    for (const round of this.roundHistory) {
      const updatedSummaries = this.recalcRound(round)
      round.playerSummaries = updatedSummaries

      for (const summary of updatedSummaries) {
        cumulativeTotals.set(summary.id, (cumulativeTotals.get(summary.id) ?? 0) + summary.finalRoundScore)
      }

      // Hitting exactly 100 resets to 50.
      for (const [id, total] of cumulativeTotals) {
        if (total === 100) cumulativeTotals.set(id, 50)
      }

      for (const summary of round.playerSummaries) {
        summary.totalScore = cumulativeTotals.get(summary.id) ?? 0
      }
    }

    for (const player of this.players) {
      player.currentTotalScore = cumulativeTotals.get(player.id) ?? 0
    }
  }

  // Compute finalRoundScore for each player in a single round, applying the
  // special-combo and Cabo-call rules. Returns new summary objects.
  recalcRound(round: RoundSummary): PlayerSummary[] {
    const updated: PlayerSummary[] = round.playerSummaries.map((s) => ({ ...s }))

    // 1. Special combo: the combo player scores 0; every other (non-dummy)
    //    player's input is bumped to 50.
    for (const summary of updated) {
      if (summary.specialCombo) {
        const idx = updated.findIndex((s) => s.id === summary.id)
        if (idx !== -1) updated[idx].finalRoundScore = 0
        for (const other of updated) {
          if (!other.isDummy && other.id !== summary.id) other.inputScore = 50
        }
      }
    }

    // 2. Non-combo players: base final score is their input score.
    for (const summary of updated) {
      if (!summary.specialCombo) summary.finalRoundScore = summary.inputScore
    }

    // 3. Cabo call rule, over the non-dummy minimum final score.
    const minScore = minScoreOf(updated)
    for (const summary of updated) {
      if (summary.didCallCabo && summary.finalRoundScore !== minScore) {
        summary.finalRoundScore += 5
      }
      if (this.caboWinnerGetsZero && summary.didCallCabo && summary.finalRoundScore === minScore) {
        summary.finalRoundScore = 0
      }
    }

    return updated
  }

  // Average of a player's real (non-dummy) round scores, or undefined.
  averageScore(playerId: ID): number | undefined {
    let total = 0
    let count = 0
    for (const round of this.roundHistory) {
      const summary = round.playerSummaries.find((s) => s.id === playerId)
      if (summary && !summary.isDummy) {
        total += summary.finalRoundScore
        count += 1
      }
    }
    if (count === 0) return undefined
    return total / count
  }

  // --- Snapshot helpers for persistence ------------------------------------

  toJSON(): GameState {
    return {
      players: this.players.map((p) => ({ ...p })),
      roundHistory: this.roundHistory.map((r) => ({
        id: r.id,
        playerSummaries: r.playerSummaries.map((s) => ({ ...s })),
      })),
      caboWinnerGetsZero: this.caboWinnerGetsZero,
    }
  }

  static fromJSON(state: GameState): GameEngine {
    const engine = new GameEngine()
    engine.players = state.players.map((p) => ({ ...p }))
    engine.roundHistory = state.roundHistory.map((r) => ({
      id: r.id ?? makeId(),
      playerSummaries: r.playerSummaries.map((s) => ({ ...s })),
    }))
    engine.caboWinnerGetsZero = Boolean(state.caboWinnerGetsZero)
    return engine
  }
}

export interface GameState {
  players: Player[]
  roundHistory: RoundSummary[]
  caboWinnerGetsZero: boolean
}

// Minimum final score among non-dummy summaries (0 if the round is all dummies),
// matching Swift's `scores.min() ?? 0`.
function minScoreOf(summaries: PlayerSummary[]): number {
  const real = summaries.filter((s) => !s.isDummy).map((s) => s.finalRoundScore)
  if (real.length === 0) return 0
  return Math.min(...real)
}
