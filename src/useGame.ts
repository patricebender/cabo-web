// React state hook wrapping the pure GameEngine with localStorage persistence.
//
// The engine mutates in place (matching the Swift view model). To make React
// re-render, every mutator runs inside `apply`, which clones the engine's state
// into fresh objects and bumps a version counter.

import { useCallback, useEffect, useRef, useState } from 'react'
import { GameEngine, type GameState } from './game/engine'
import { submitRound, type RoundInput } from './game/round'
import type { ID } from './game/types'

const STORAGE_KEY = 'cabo-web.game.v1'

function load(): GameEngine {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return GameEngine.fromJSON(JSON.parse(raw) as GameState)
  } catch {
    // Corrupt or unavailable storage — start fresh.
  }
  return new GameEngine()
}

export interface Game {
  state: GameState
  addPlayer: (name: string) => void
  updatePlayerName: (id: ID, name: string) => void
  deletePlayer: (id: ID) => void
  resetGame: () => void
  setCaboWinnerGetsZero: (value: boolean) => void
  submitRound: (input: RoundInput) => void
  editRound: (index: number, input: RoundInput) => void
  deleteRound: (index: number) => void
  averageScore: (id: ID) => number | undefined
}

export function useGame(): Game {
  const engineRef = useRef<GameEngine | null>(null)
  if (engineRef.current === null) engineRef.current = load()
  const engine = engineRef.current

  const [, setVersion] = useState(0)

  // Snapshot used for rendering; recomputed on every mutation.
  const snapshotRef = useRef<GameState>(engine.toJSON())

  const persist = useCallback(() => {
    snapshotRef.current = engine.toJSON()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshotRef.current))
    } catch {
      // Ignore quota / private-mode failures; in-memory state still works.
    }
    setVersion((v) => v + 1)
  }, [engine])

  const apply = useCallback(
    (fn: () => void) => {
      fn()
      persist()
    },
    [persist],
  )

  // Persist once on mount so a freshly created game is saved.
  useEffect(() => {
    persist()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    state: snapshotRef.current,
    addPlayer: (name) => apply(() => engine.addPlayer(name.trim())),
    updatePlayerName: (id, name) => apply(() => engine.updatePlayerName(id, name.trim())),
    deletePlayer: (id) =>
      apply(() => {
        const index = engine.players.findIndex((p) => p.id === id)
        if (index !== -1) engine.deletePlayer([index])
      }),
    resetGame: () => apply(() => engine.resetGame()),
    setCaboWinnerGetsZero: (value) =>
      apply(() => {
        engine.caboWinnerGetsZero = value
        engine.recalcTotals()
      }),
    submitRound: (input) => apply(() => submitRound(engine, input)),
    editRound: (index, input) =>
      apply(() => {
        // Rebuild that round's summaries from the edited inputs, preserving
        // dummy entries for players who weren't in the entry form.
        const existing = engine.roundHistory[index]
        if (!existing) return
        existing.playerSummaries = existing.playerSummaries.map((s) => {
          if (s.isDummy) return { ...s, finalRoundScore: 0 }
          const special = s.id === input.specialComboPlayer
          const inputScore = special ? 0 : input.scores[s.id] ?? 0
          return {
            ...s,
            inputScore,
            finalRoundScore: inputScore,
            specialCombo: special,
            didCallCabo: s.id === input.caboCaller,
          }
        })
        engine.recalcTotals()
      }),
    deleteRound: (index) =>
      apply(() => {
        engine.roundHistory.splice(index, 1)
        engine.recalcTotals()
      }),
    averageScore: (id) => engine.averageScore(id),
  }
}
