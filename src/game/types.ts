// Domain model for the Cabo score tracker.
// Ported 1:1 from the SwiftUI app's Models.swift / GameViewModel.swift.

export type ID = string

export interface Player {
  id: ID
  name: string
  // Cumulative score derived from roundHistory. Source of truth for display.
  currentTotalScore: number
}

export interface PlayerSummary {
  id: ID
  name: string
  inputScore: number // Score as originally entered.
  specialCombo: boolean // Player got two 12s and two 13s this round.
  didCallCabo: boolean // Player called "Cabo" this round.
  finalRoundScore: number // Calculated round score (not directly editable).
  totalScore: number // Cumulative total after this round.
  isDummy: boolean // True when the player joined mid-game (placeholder entry).
}

export interface RoundSummary {
  id: ID
  playerSummaries: PlayerSummary[]
}

let idCounter = 0
/** Stable unique id. Mirrors Swift's `UUID()` role without needing crypto. */
export function makeId(): ID {
  idCounter += 1
  return `${Date.now().toString(36)}-${idCounter.toString(36)}`
}

export function makePlayer(name: string): Player {
  return { id: makeId(), name, currentTotalScore: 0 }
}
