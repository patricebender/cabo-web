// Unified edge-case test suite for Cabo's score-keeping logic.
// Ported 1:1 from caboTests/CaboTests.swift. All tests insert rounds only by
// appending RoundSummary objects — the same way the UI writes history.

import { describe, expect, test } from 'vitest'
import { GameEngine } from './engine'
import { makePlayer, type Player, type PlayerSummary, type RoundSummary } from './types'

// --- Helpers ---------------------------------------------------------------

function makeWithPlayers(names: string[]): { vm: GameEngine; players: Player[] } {
  const vm = new GameEngine()
  vm.players = names.map((n) => makePlayer(n))
  return { vm, players: vm.players }
}

function makeSummary(
  p: Player,
  input: number,
  opts: { special?: boolean; cabo?: boolean; dummy?: boolean } = {},
): PlayerSummary {
  return {
    id: p.id,
    name: p.name,
    inputScore: input,
    specialCombo: opts.special ?? false,
    didCallCabo: opts.cabo ?? false,
    finalRoundScore: input,
    totalScore: 0,
    isDummy: opts.dummy ?? false,
  }
}

let roundSeq = 0
function round(summaries: PlayerSummary[]): RoundSummary {
  roundSeq += 1
  return { id: `r${roundSeq}`, playerSummaries: summaries }
}

function scoreMap(r: RoundSummary): Record<string, number> {
  return Object.fromEntries(r.playerSummaries.map((s) => [s.id, s.finalRoundScore]))
}

function totalOf(vm: GameEngine, id: string): number | undefined {
  return vm.players.find((p) => p.id === id)?.currentTotalScore
}

// --- Test suite ------------------------------------------------------------

describe('CaboTests', () => {
  // The model refuses to add more than six players.
  test('addPlayerLimitOfSix', () => {
    const { vm } = makeWithPlayers([])
    for (let i = 1; i <= 6; i++) vm.addPlayer(`P${i}`)
    vm.addPlayer('Overflow')
    expect(vm.players.length).toBe(6)
  })

  // A Cabo caller with the lowest score pays the +5 penalty.
  test('caboCallerPenalty', () => {
    const { vm, players } = makeWithPlayers(['A', 'B', 'C'])
    const [a, b, c] = players
    vm.roundHistory = [
      round([
        makeSummary(a, 6, { cabo: true }),
        makeSummary(b, 5),
        makeSummary(c, 8),
      ]),
    ]
    vm.recalcTotals()
    const scores = scoreMap(vm.roundHistory[0])
    expect(scores[a.id]).toBe(11)
    expect(scores[b.id]).toBe(5)
    expect(scores[c.id]).toBe(8)
  })

  // A Cabo caller tied for the lowest score does not pay the +5 penalty.
  test('caboTieNoPenaltyCaller', () => {
    const { vm, players } = makeWithPlayers(['A', 'B', 'C'])
    const [a, b, c] = players
    vm.roundHistory = [
      round([
        makeSummary(a, 5, { cabo: true }),
        makeSummary(b, 5),
        makeSummary(c, 8),
      ]),
    ]
    vm.recalcTotals()
    const scores = scoreMap(vm.roundHistory[0])
    expect(scores[a.id]).toBe(5)
    expect(scores[b.id]).toBe(5)
    expect(scores[c.id]).toBe(8)
  })

  // Deleting a player purges them from both players and every round summary.
  test('deletePlayerCleansHistory', () => {
    const { vm, players } = makeWithPlayers(['A', 'B', 'C'])
    const [a, b, c] = players
    vm.roundHistory = [
      round([makeSummary(a, 3), makeSummary(b, 4), makeSummary(c, 5)]),
      round([makeSummary(a, 6), makeSummary(b, 7), makeSummary(c, 8)]),
    ]
    vm.deletePlayer([1]) // remove "B"
    expect(vm.players.length).toBe(2)
    expect(vm.players.every((p) => p.id !== b.id)).toBe(true)
    expect(
      vm.roundHistory.every((r) => !r.playerSummaries.some((s) => s.id === b.id)),
    ).toBe(true)
  })

  // Renaming a player cascades through round history.
  test('renamePlayerUpdatesAllRefs', () => {
    const { vm, players } = makeWithPlayers(['Old', 'Spare'])
    const target = players[0]
    vm.roundHistory = [round([makeSummary(target, 1), makeSummary(players[1], 2)])]
    vm.updatePlayerName(target.id, 'New')
    expect(vm.players.find((p) => p.id === target.id)?.name).toBe('New')
    expect(
      vm.roundHistory[0].playerSummaries.find((s) => s.id === target.id)?.name,
    ).toBe('New')
  })

  // averageScore returns undefined when the player hasn't played a real round.
  test('averageScoreNilWithoutRealRounds', () => {
    const { vm, players } = makeWithPlayers(['Solo', 'Partner'])
    const [solo, partner] = players
    vm.roundHistory = [
      round([
        makeSummary(solo, 0, { dummy: true }),
        makeSummary(partner, 0, { dummy: true }),
      ]),
    ]
    expect(vm.averageScore(solo.id)).toBeUndefined()
  })

  // Exceeding 100 total points does not trigger the 100 -> 50 reset.
  test('exceedingHundredDoesNotReset', () => {
    const { vm, players } = makeWithPlayers(['A', 'B'])
    const [a, b] = players
    vm.roundHistory = [round([makeSummary(a, 101), makeSummary(b, 0)])]
    vm.recalcTotals()
    expect(totalOf(vm, a.id)).toBe(101)
    expect(totalOf(vm, b.id)).toBe(0)
  })

  // Exactly hitting 100 resets the total to 50, the new baseline.
  test('exactHundredResetsToFifty', () => {
    const { vm, players } = makeWithPlayers(['A', 'B'])
    const [a, b] = players
    vm.roundHistory = [round([makeSummary(a, 100), makeSummary(b, 0)])]
    vm.recalcTotals()
    expect(totalOf(vm, a.id)).toBe(50)

    vm.roundHistory.push(round([makeSummary(a, 10), makeSummary(b, 0)]))
    vm.recalcTotals()
    expect(totalOf(vm, a.id)).toBe(60) // 50 + 10
  })

  // Special-combo winner scores 0; others get +50 and start next round from 50.
  test('singleSpecialComboWinnerBaseline', () => {
    const { vm, players } = makeWithPlayers(['A', 'B', 'C'])
    const [a, b, c] = players
    vm.roundHistory = [
      round([
        makeSummary(a, 99, { special: true }),
        makeSummary(b, 0),
        makeSummary(c, 0),
      ]),
    ]
    vm.recalcTotals()
    expect(totalOf(vm, a.id)).toBe(0)
    expect(totalOf(vm, b.id)).toBe(50)
    expect(totalOf(vm, c.id)).toBe(50)

    vm.roundHistory.push(
      round([makeSummary(a, 10), makeSummary(b, 5), makeSummary(c, 8)]),
    )
    vm.recalcTotals()
    expect(totalOf(vm, a.id)).toBe(10)
    expect(totalOf(vm, b.id)).toBe(55)
    expect(totalOf(vm, c.id)).toBe(58)
  })

  // averageScore ignores dummy rounds and uses only real ones.
  test('averageScoreIgnoresDummyRounds', () => {
    const { vm, players } = makeWithPlayers(['A', 'B'])
    const [a, b] = players
    vm.roundHistory = [
      round([
        makeSummary(a, 0, { dummy: true }),
        makeSummary(b, 0, { dummy: true }),
      ]),
    ]
    vm.recalcTotals()
    vm.roundHistory.push(round([makeSummary(a, 7), makeSummary(b, 3)]))
    vm.recalcTotals()
    expect(vm.averageScore(a.id)).toBe(7)
    expect(vm.averageScore(b.id)).toBe(3)
  })

  // A player can hit the 100 -> 50 reset more than once.
  test('repeatedHundredResets', () => {
    const { vm, players } = makeWithPlayers(['A', 'B'])
    const [a, b] = players
    vm.roundHistory = [round([makeSummary(a, 100), makeSummary(b, 0)])]
    vm.recalcTotals()
    expect(totalOf(vm, a.id)).toBe(50)

    vm.roundHistory.push(round([makeSummary(a, 50), makeSummary(b, 0)]))
    vm.recalcTotals()
    expect(totalOf(vm, a.id)).toBe(50)

    vm.roundHistory.push(round([makeSummary(a, 20), makeSummary(b, 0)]))
    vm.recalcTotals()
    expect(totalOf(vm, a.id)).toBe(70)
  })

  // Special-combo baseline carries forward while others can still reset later.
  test('specialComboThenHundredResetForOthers', () => {
    const { vm, players } = makeWithPlayers(['Special', 'X', 'Y'])
    const [special, x, y] = players
    vm.roundHistory = [
      round([
        makeSummary(special, 99, { special: true }),
        makeSummary(x, 0),
        makeSummary(y, 0),
      ]),
    ]
    vm.recalcTotals()
    expect(totalOf(vm, special.id)).toBe(0)
    expect(totalOf(vm, x.id)).toBe(50)
    expect(totalOf(vm, y.id)).toBe(50)

    vm.roundHistory.push(
      round([
        makeSummary(special, 10),
        makeSummary(x, 50),
        makeSummary(y, 20),
      ]),
    )
    vm.recalcTotals()
    expect(totalOf(vm, special.id)).toBe(10)
    expect(totalOf(vm, x.id)).toBe(50)
    expect(totalOf(vm, y.id)).toBe(70)
  })

  // Special-combo should add +50, not reset other players to 50.
  test('specialComboAddsFiftyNotReset', () => {
    const { vm, players } = makeWithPlayers(['A', 'B', 'C'])
    const [a, b, c] = players
    vm.roundHistory = [
      round([makeSummary(a, 0), makeSummary(b, 30), makeSummary(c, 30)]),
    ]
    vm.recalcTotals()
    expect(totalOf(vm, b.id)).toBe(30)
    expect(totalOf(vm, c.id)).toBe(30)

    vm.roundHistory.push(
      round([
        makeSummary(a, 99, { special: true }),
        makeSummary(b, 5),
        makeSummary(c, 4),
      ]),
    )
    vm.recalcTotals()
    expect(totalOf(vm, a.id)).toBe(0)
    expect(totalOf(vm, b.id)).toBe(80) // 30 + 50
    expect(totalOf(vm, c.id)).toBe(80) // 30 + 50
  })

  // Adding a player later should not impact existing scores / Cabo calls.
  test('dummyRoundsDoNotImpactCaboCalls', () => {
    const { vm, players } = makeWithPlayers(['A', 'B', 'C', 'D'])
    const [a, b, c, d] = players
    vm.roundHistory = [
      round([
        makeSummary(a, 0, { dummy: true }),
        makeSummary(b, 0, { dummy: true }),
        makeSummary(c, 5, { cabo: true }),
        makeSummary(d, 6),
      ]),
    ]
    vm.recalcTotals()

    vm.roundHistory.push(
      round([
        makeSummary(a, 0, { dummy: true }),
        makeSummary(b, 0, { dummy: true }),
        makeSummary(c, 10),
        makeSummary(d, 1, { cabo: true }),
      ]),
    )
    vm.recalcTotals()

    expect(totalOf(vm, a.id)).toBe(0)
    expect(totalOf(vm, b.id)).toBe(0)
    expect(totalOf(vm, c.id)).toBe(15)
    expect(totalOf(vm, d.id)).toBe(7)
  })

  // A Cabo caller who wins (lowest) gets ZERO when the option is enabled.
  test('caboCallerWinnerGetsZero', () => {
    const { vm, players } = makeWithPlayers(['A', 'B', 'C'])
    vm.caboWinnerGetsZero = true
    const [a, b, c] = players
    vm.roundHistory = [
      round([
        makeSummary(a, 6, { cabo: true }),
        makeSummary(b, 8),
        makeSummary(c, 10),
      ]),
    ]
    vm.recalcTotals()
    const scores = scoreMap(vm.roundHistory[0])
    expect(scores[a.id]).toBe(0)
    expect(scores[b.id]).toBe(8)
    expect(scores[c.id]).toBe(10)
  })

  // Editing the round so the caller is no longer lowest -> +5 penalty.
  test('editedRound_NoLongerLowest_AddsFive', () => {
    const { vm, players } = makeWithPlayers(['A', 'B', 'C'])
    vm.caboWinnerGetsZero = true
    const [a, b, c] = players
    vm.roundHistory = [
      round([
        makeSummary(a, 6, { cabo: true }),
        makeSummary(b, 8),
        makeSummary(c, 10),
      ]),
    ]
    vm.recalcTotals()

    vm.roundHistory[0] = round([
      makeSummary(a, 15, { cabo: true }),
      makeSummary(b, 8),
      makeSummary(c, 10),
    ])
    vm.recalcTotals()
    const scores = scoreMap(vm.roundHistory[0])
    expect(scores[a.id]).toBe(20) // 15 + 5
  })

  // Editing again so the caller regains lowest -> round drops back to zero.
  test('editedRound_BecomesLowestAgain_GetsZero', () => {
    const { vm, players } = makeWithPlayers(['A', 'B', 'C'])
    vm.caboWinnerGetsZero = true
    const [a, b, c] = players
    vm.roundHistory = [
      round([
        makeSummary(a, 15, { cabo: true }),
        makeSummary(b, 8),
        makeSummary(c, 10),
      ]),
    ]
    vm.recalcTotals()

    vm.roundHistory[0] = round([
      makeSummary(a, 5, { cabo: true }),
      makeSummary(b, 8),
      makeSummary(c, 10),
    ])
    vm.recalcTotals()
    const scores = scoreMap(vm.roundHistory[0])
    expect(scores[a.id]).toBe(0)
  })
})
