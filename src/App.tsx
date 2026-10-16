import { useMemo, useState } from 'react'
import { useGame } from './useGame'
import type { ID } from './game/types'
import type { RoundInput } from './game/round'
import { MAX_PLAYERS } from './game/engine'
import { Home } from './screens/Home'
import { Overview } from './screens/Overview'
import { RoundForm } from './screens/RoundForm'
import { Modal } from './components/Modal'
import { GearIcon, PlusIcon, ResetIcon } from './components/icons'

type Screen = { name: 'home' } | { name: 'entry' } | { name: 'overview' } | { name: 'edit'; index: number }

export default function App() {
  const game = useGame()
  const { state } = game

  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  // Modal state
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [editingPlayer, setEditingPlayer] = useState<ID | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingPlayer, setDeletingPlayer] = useState<ID | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const playerName = (id: ID | null) => state.players.find((p) => p.id === id)?.name ?? 'this player'

  function confirmAdd() {
    const name = addName.trim()
    if (!name) return
    game.addPlayer(name)
    setAddName('')
    setAddOpen(false)
  }

  function confirmEdit() {
    if (editingPlayer && editName.trim()) {
      game.updatePlayerName(editingPlayer, editName)
    }
    setEditingPlayer(null)
  }

  // Pre-fill values when editing an existing round.
  const editInitial = useMemo(() => {
    if (screen.name !== 'edit') return undefined
    const round = state.roundHistory[screen.index]
    if (!round) return undefined
    const scores: Record<ID, string> = {}
    let special: ID | null = null
    let cabo: ID | null = null
    for (const s of round.playerSummaries) {
      if (s.isDummy) continue
      scores[s.id] = String(s.inputScore)
      if (s.specialCombo) special = s.id
      if (s.didCallCabo) cabo = s.id
    }
    return { scores, specialComboPlayer: special, caboCaller: cabo }
  }, [screen, state.roundHistory])

  function submitEntry(input: RoundInput) {
    game.submitRound(input)
    setScreen({ name: 'home' })
  }

  function submitEdit(input: RoundInput) {
    if (screen.name === 'edit') game.editRound(screen.index, input)
    setScreen({ name: 'overview' })
  }

  // --- Full-screen sub-views ------------------------------------------------
  if (screen.name === 'entry') {
    return (
      <RoundForm
        state={state}
        title="Enter Round"
        submitLabel="Submit Round"
        onSubmit={submitEntry}
        onBack={() => setScreen({ name: 'home' })}
      />
    )
  }
  if (screen.name === 'edit') {
    return (
      <RoundForm
        state={state}
        title={`Edit Round ${screen.index + 1}`}
        initial={editInitial}
        submitLabel="Save Changes"
        onSubmit={submitEdit}
        onBack={() => setScreen({ name: 'overview' })}
      />
    )
  }
  if (screen.name === 'overview') {
    return (
      <Overview
        state={state}
        onBack={() => setScreen({ name: 'home' })}
        onEditRound={(index) => setScreen({ name: 'edit', index })}
        onDeleteRound={(index) => game.deleteRound(index)}
      />
    )
  }

  // --- Home -----------------------------------------------------------------
  const canEnterRound = state.players.length >= 2
  const atPlayerLimit = state.players.length >= MAX_PLAYERS

  return (
    <div className="min-h-full pb-28">
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-slate-100/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <h1 className="text-xl font-extrabold tracking-tight">
            Cabo <span className="text-cabo-600">Score</span> 🦄
          </h1>
          <div className="flex items-center gap-1">
            <button
              className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-cabo-600 disabled:opacity-30 dark:hover:bg-white/10"
              onClick={() => setResetOpen(true)}
              disabled={state.roundHistory.length === 0}
              aria-label="Reset game"
            >
              <ResetIcon />
            </button>
            <button
              className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-cabo-600 dark:hover:bg-white/10"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
            >
              <GearIcon />
            </button>
            <button
              className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-cabo-600 disabled:opacity-30 dark:hover:bg-white/10"
              onClick={() => {
                setAddName('')
                setAddOpen(true)
              }}
              disabled={atPlayerLimit}
              aria-label="Add player"
            >
              <PlusIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="py-4">
        <Home
          state={state}
          averageScore={game.averageScore}
          onEditPlayer={(id) => {
            setEditingPlayer(id)
            setEditName(playerName(id))
          }}
          onDeletePlayer={(id) => setDeletingPlayer(id)}
        />
      </main>

      {/* Bottom action bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/60 bg-slate-100/85 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-md gap-3">
          <button
            className="btn-primary flex-1"
            disabled={!canEnterRound}
            onClick={() => setScreen({ name: 'entry' })}
          >
            Enter Round Scores
          </button>
          <button
            className="btn-ghost flex-1"
            disabled={state.roundHistory.length === 0}
            onClick={() => setScreen({ name: 'overview' })}
          >
            Overview ({state.roundHistory.length})
          </button>
        </div>
        {!canEnterRound && (
          <p className="mx-auto mt-2 max-w-md text-center text-xs text-slate-400">
            Add at least 2 players to start a round.
          </p>
        )}
      </nav>

      {/* Add player */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Player"
        footer={
          <>
            <button className="btn-ghost flex-1" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary flex-1" onClick={confirmAdd} disabled={!addName.trim()}>
              Add
            </button>
          </>
        }
      >
        <input
          className="field"
          autoFocus
          placeholder="Player name"
          value={addName}
          maxLength={24}
          onChange={(e) => setAddName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && confirmAdd()}
        />
        {atPlayerLimit && (
          <p className="mt-2 text-sm text-rose-500">Maximum of {MAX_PLAYERS} players reached.</p>
        )}
      </Modal>

      {/* Edit player */}
      <Modal
        open={editingPlayer !== null}
        onClose={() => setEditingPlayer(null)}
        title="Edit Player Name"
        footer={
          <>
            <button className="btn-ghost flex-1" onClick={() => setEditingPlayer(null)}>
              Cancel
            </button>
            <button className="btn-primary flex-1" onClick={confirmEdit} disabled={!editName.trim()}>
              Save
            </button>
          </>
        }
      >
        <input
          className="field"
          autoFocus
          placeholder="Player name"
          value={editName}
          maxLength={24}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && confirmEdit()}
        />
      </Modal>

      {/* Delete player confirm */}
      <Modal
        open={deletingPlayer !== null}
        onClose={() => setDeletingPlayer(null)}
        title="Delete Player"
        footer={
          <>
            <button className="btn-ghost flex-1" onClick={() => setDeletingPlayer(null)}>
              Cancel
            </button>
            <button
              className="btn-danger flex-1"
              onClick={() => {
                if (deletingPlayer) game.deletePlayer(deletingPlayer)
                setDeletingPlayer(null)
              }}
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-slate-600 dark:text-slate-300">
          Delete <span className="font-semibold">{playerName(deletingPlayer)}</span>? This removes
          them from every round and cannot be undone.
        </p>
      </Modal>

      {/* Reset confirm */}
      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset Game"
        footer={
          <>
            <button className="btn-ghost flex-1" onClick={() => setResetOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-danger flex-1"
              onClick={() => {
                game.resetGame()
                setResetOpen(false)
              }}
            >
              Reset
            </button>
          </>
        }
      >
        <p className="text-slate-600 dark:text-slate-300">
          Remove all round history and reset every player's score to 0? Players are kept.
        </p>
      </Modal>

      {/* Settings */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings">
        <label className="flex items-center justify-between gap-4 py-2">
          <span className="font-medium">
            Zero points for a winning Cabo call
            <span className="mt-1 block text-sm font-normal text-slate-400">
              If the Cabo caller has the lowest score, their round scores 0 instead of their cards.
            </span>
          </span>
          <Toggle
            checked={state.caboWinnerGetsZero}
            onChange={(v) => game.setCaboWinnerGetsZero(v)}
          />
        </label>
        <button className="btn-primary mt-4 w-full" onClick={() => setSettingsOpen(false)}>
          Done
        </button>
      </Modal>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? 'bg-cabo-600' : 'bg-slate-300 dark:bg-white/15'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  )
}
