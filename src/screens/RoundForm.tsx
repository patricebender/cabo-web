import { useState } from 'react'
import type { GameState } from '../game/engine'
import type { ID } from '../game/types'
import type { RoundInput } from '../game/round'
import { CheckCircleIcon, CircleIcon, BackIcon } from '../components/icons'

interface RoundFormProps {
  state: GameState
  title: string
  // Pre-filled values when editing an existing round.
  initial?: {
    scores: Record<ID, string>
    specialComboPlayer: ID | null
    caboCaller: ID | null
  }
  submitLabel: string
  onSubmit: (input: RoundInput) => void
  onBack: () => void
}

// Shared entry form for creating and editing a round. Mirrors RoundEntryView /
// EditRoundView: special combo is single-select and, while active, zeroes the
// combo player, forces 50 for everyone else, and disables score inputs.
export function RoundForm({ state, title, initial, submitLabel, onSubmit, onBack }: RoundFormProps) {
  const [scores, setScores] = useState<Record<ID, string>>(initial?.scores ?? {})
  const [specialComboPlayer, setSpecialComboPlayer] = useState<ID | null>(
    initial?.specialComboPlayer ?? null,
  )
  const [caboCaller, setCaboCaller] = useState<ID | null>(initial?.caboCaller ?? null)

  const comboActive = specialComboPlayer !== null

  function toggleCombo(id: ID) {
    if (specialComboPlayer === id) {
      setSpecialComboPlayer(null)
      setScores({})
    } else {
      setSpecialComboPlayer(id)
      const next: Record<ID, string> = {}
      for (const p of state.players) next[p.id] = p.id === id ? '0' : '50'
      setScores(next)
    }
  }

  function toggleCabo(id: ID) {
    setCaboCaller((cur) => (cur === id ? null : id))
  }

  function submit() {
    const numeric: Record<ID, number> = {}
    for (const p of state.players) {
      numeric[p.id] = Number.parseInt(scores[p.id] ?? '', 10) || 0
    }
    onSubmit({ scores: numeric, specialComboPlayer, caboCaller })
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-32 pt-4">
      <header className="mb-4 flex items-center gap-2">
        <button className="btn-ghost !px-3 !py-2" onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>
        <h1 className="text-2xl font-extrabold">{title}</h1>
      </header>

      <div className="space-y-4">
        {state.players.map((player) => {
          const isCombo = specialComboPlayer === player.id
          const isCabo = caboCaller === player.id
          return (
            <section key={player.id} className="card">
              <h2 className="mb-3 text-lg font-bold">{player.name}</h2>

              <label className="mb-3 flex items-center gap-3">
                <span className="w-16 shrink-0 text-sm font-medium text-slate-500">Score</span>
                <input
                  className="field"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={scores[player.id] ?? ''}
                  disabled={comboActive}
                  onChange={(e) =>
                    setScores((s) => ({ ...s, [player.id]: e.target.value }))
                  }
                />
              </label>

              <button
                className={`mb-2 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left font-medium transition ${
                  isCombo
                    ? 'bg-cabo-100 text-cabo-800 dark:bg-cabo-500/20 dark:text-cabo-200'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                }`}
                onClick={() => toggleCombo(player.id)}
              >
                {isCombo ? <CheckCircleIcon /> : <CircleIcon />}
                Special Combo (2×12 &amp; 2×13)
              </button>

              <button
                className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left font-medium transition ${
                  isCabo
                    ? 'bg-cabo-100 text-cabo-800 dark:bg-cabo-500/20 dark:text-cabo-200'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                }`}
                onClick={() => toggleCabo(player.id)}
              >
                {isCabo ? <CheckCircleIcon /> : <CircleIcon />}
                Call Cabo
              </button>
            </section>
          )
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200/60 bg-slate-100/80 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-md gap-3">
          <button className="btn-ghost flex-1" onClick={onBack}>
            Cancel
          </button>
          <button className="btn-primary flex-1" onClick={submit}>
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
