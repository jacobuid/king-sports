import React, { useEffect, useState } from 'react'
import { Icon, Modal } from './ui'
import { GameListRow } from './GameListRow'
import { CreateGameDrawer } from './CreateGameDrawer'

const validScore = game => game && ['home', 'away'].every(side => Number.isSafeInteger(game[side]) && game[side] >= 0 && game[side] <= 999) && typeof game.ended === 'boolean'
function readGames(key, legacyKey) {
  try {
    const saved = localStorage.getItem(key)
    if (saved !== null) {
      const games = JSON.parse(saved)
      return Array.isArray(games) ? games.filter(game => validScore(game) && typeof game.id === 'string' && typeof game.name === 'string' && typeof game.createdAt === 'string') : []
    }
    const legacy = JSON.parse(localStorage.getItem(legacyKey))
    if (validScore(legacy) && (legacy.home || legacy.away || legacy.ended)) return [{ ...legacy, id: crypto.randomUUID(), name: 'Game 1', createdAt: new Date().toISOString() }]
  } catch {}
  return []
}

export function GamePage({ userId, gameId, onOpen, onBack }) {
  const storageKey = `king-sports:games:${userId}`
  const [games, setGames] = useState(() => readGames(storageKey, `king-sports:game:${userId}`))
  const [confirmation, setConfirmation] = useState(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [editScore, setEditScore] = useState(null)
  const [activeSwipe, setActiveSwipe] = useState(null)
  const [saveError, setSaveError] = useState(false)
  const game = games.find(item => item.id === gameId)
  const editing = !!game && game.ended && editScore?.id === game.id
  const score = editing ? editScore : game
  useEffect(() => { setConfirmation(null); setEditScore(null) }, [gameId])
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(games)); setSaveError(false) }
    catch { setSaveError(true) }
  }, [games, storageKey])
  function updateGame(update) {
    setGames(current => current.map(item => item.id === gameId ? update(item) : item))
  }
  function startGame(setup) {
    const next = { ...setup, id: crypto.randomUUID(), name: setup.awayName + ' vs ' + setup.homeName, createdAt: new Date().toISOString(), home: 0, away: 0, ended: false }
    setCreating(false)
    setGames(current => [next, ...current])
    onOpen(next.id)
  }
  function adjust(side, delta) {
    if (editing) {
      setEditScore(current => ({ ...current, [side]: Math.min(999, Math.max(0, current[side] + delta)) }))
      return
    }
    updateGame(current => current.ended ? current : { ...current, [side]: Math.min(999, Math.max(0, current[side] + delta)) })
  }
  function confirm() {
    if (confirmation === 'edit') setEditScore({ id: game.id, home: game.home, away: game.away })
    else if (confirmation === 'restart') updateGame(current => ({ ...current, home: 0, away: 0, ended: false, endedAt: undefined }))
    else {
      updateGame(current => ({ ...current, ended: true, endedAt: new Date().toISOString() }))
      onBack()
    }
    setConfirmation(null)
  }
  if (!gameId) return <main className="game-panel game-home" aria-label="Games">
    <button className="game-new" type="button" onClick={() => setCreating(true)}><Icon name="plus" size={26} />Create Game</button>
    <p id="game-delete-hint" className="sr-only">Swipe right or press Delete on a game to delete it.</p>
    <h2 className="game-recent-heading"><Icon name="history" size={25} />Recent Games</h2>
    {saveError && <p role="alert" className="game-save-error">Your browser could not save your games. Keep this page open to retain them.</p>}
    {games.length ? <div className="game-list">{games.map(item => {
      const ours = item.ourSide === 'away' ? item.away : item.home
      const theirs = item.ourSide === 'away' ? item.home : item.away
      const result = !item.ended ? 'active' : ours > theirs ? 'win' : ours < theirs ? 'loss' : 'tie'
      const label = { active: 'In progress', win: 'Win', loss: 'Loss', tie: 'Tie' }[result]
      return <GameListRow key={item.id} item={item} result={result} label={label} activeId={activeSwipe} onActivate={setActiveSwipe} onOpen={onOpen} onDelete={setDeleting} />
    })}</div> : <div className="game-list-empty"><Icon name="game" size={46} /><h3>No games yet</h3><p>Create your first game to keep score.</p></div>}
    {creating && <CreateGameDrawer onClose={() => setCreating(false)} onStart={startGame} />}
    {deleting && <Modal title="Delete game?" className="game-confirm" iconName="trash" onClose={() => { setDeleting(null); setActiveSwipe(null) }}>
      <p>Delete <strong>{deleting.name}</strong> and its saved score? This cannot be undone.</p>
      <button type="button" className="game-confirm-delete" onClick={() => { setGames(current => current.filter(item => item.id !== deleting.id)); setDeleting(null); setActiveSwipe(null) }}>Delete Game</button>
      <button type="button" className="game-confirm-cancel" onClick={() => { setDeleting(null); setActiveSwipe(null) }}>Cancel</button>
    </Modal>}
  </main>
  if (!game) return <main className="game-panel"><h2>Game not found</h2><p>This game is not saved in this browser.</p><button className="game-back" type="button" onClick={onBack}>Back to Games</button></main>
  return <main className="game-panel game-tracker" aria-label="Game scorekeeper">
    <div className="game-tracker-heading"><button className="game-back" type="button" onClick={onBack}><Icon name="chevronLeft" size={14} />Back to Games</button><span className={game.ended ? 'game-status game-status-final' : 'game-status'} role="status">{editing ? 'Editing Final Score' : game.ended ? 'Final Score' : 'In Progress'}</span></div>
    <div className="game-scoreboard">
      {(game.awayName ? ['away', 'home'] : ['home', 'away']).map(side => <section className={`game-team game-${side}`} key={side} aria-label={`${side === 'home' ? 'Home' : 'Away'} team`}>
        <p className="game-side-label" title={side === 'home' ? game.homeName || 'Home' : game.awayName || 'Away'}>{side === 'home' ? game.homeName || 'Home' : game.awayName || 'Away'}</p><p className="game-side-caption">{side === 'home' ? 'Home' : 'Away'}</p>
        <output className="game-score" aria-label={`${side === 'home' ? 'Home' : 'Away'} score`} aria-live="polite">{score[side]}</output>
        <div className="game-score-controls">
          <button type="button" aria-label={`Decrease ${side} score`} disabled={(game.ended && !editing) || score[side] === 0} onClick={() => adjust(side, -1)}>-</button>
          <button type="button" aria-label={`Increase ${side} score`} disabled={(game.ended && !editing) || score[side] === 999} onClick={() => adjust(side, 1)}>+</button>
        </div>
      </section>)}
    </div>
    {game.ended && !editing && <p className="game-result">{game.home === game.away ? 'The game ended in a tie.' : `${game.home > game.away ? game.homeName || 'Home' : game.awayName || 'Away'} Won!`}</p>}
    {saveError && <p role="alert" className="game-save-error">Your browser could not save this score. Keep this page open to retain it.</p>}
    <div className="game-actions">
      {game.ended ? <>
        <button type="button" className="game-restart" onClick={() => {
          if (editing) {
            updateGame(current => ({ ...current, home: editScore.home, away: editScore.away, updatedAt: new Date().toISOString() }))
            setEditScore(null)
          } else setConfirmation('edit')
        }}>{editing ? 'Update' : 'Edit Game'}</button>
        {editing && <button type="button" className="game-back" onClick={() => setEditScore(null)}>Cancel changes</button>}
      </> : <>
        <button type="button" className="game-restart" onClick={() => setConfirmation('restart')}>Restart Game</button>
        <button type="button" className="game-end" onClick={() => setConfirmation('end')}><Icon name="finish" size={22} />End Game</button>
      </>}
    </div>
    {confirmation && <Modal className="game-confirm" title={confirmation === 'edit' ? 'Edit ended game?' : confirmation === 'restart' ? 'Restart game?' : 'End game?'} iconName="game" onClose={() => setConfirmation(null)}>
      <p>{confirmation === 'edit' ? 'Are you sure you want to change this game that has ended?' : confirmation === 'restart' ? 'Both scores will return to zero and a new game will begin.' : `Finish this game with a score of ${game.home} to ${game.away}?`}</p>
      <button type="button" className="game-confirm-action" onClick={confirm}>{confirmation === 'edit' ? 'Edit Game' : confirmation === 'restart' ? 'Restart Game' : 'End Game'}</button>
      <button type="button" className="game-confirm-cancel" onClick={() => setConfirmation(null)}>Cancel</button>
    </Modal>}
  </main>
}
