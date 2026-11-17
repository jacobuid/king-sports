import React, { useEffect, useState } from 'react'
import { Icon, Modal } from './ui'

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
  const [saveError, setSaveError] = useState(false)
  const game = games.find(item => item.id === gameId)
  useEffect(() => { setConfirmation(null) }, [gameId])
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(games)); setSaveError(false) }
    catch { setSaveError(true) }
  }, [games, storageKey])
  function updateGame(update) {
    setGames(current => current.map(item => item.id === gameId ? update(item) : item))
  }
  function startGame() {
    const next = { id: crypto.randomUUID(), name: 'Game ' + (games.length + 1), createdAt: new Date().toISOString(), home: 0, away: 0, ended: false }
    setGames(current => [next, ...current])
    onOpen(next.id)
  }
  function adjust(side, delta) {
    updateGame(current => current.ended ? current : { ...current, [side]: Math.min(999, Math.max(0, current[side] + delta)) })
  }
  function confirm() {
    if (confirmation === 'restart') updateGame(current => ({ ...current, home: 0, away: 0, ended: false, endedAt: undefined }))
    else {
      updateGame(current => ({ ...current, ended: true, endedAt: new Date().toISOString() }))
      onBack()
    }
    setConfirmation(null)
  }
  if (!gameId) return <main className="game-panel" aria-label="Games">
    <div className="game-list-heading"><div><span>YOUR SCOREBOOK</span><h2>Games</h2><p>Start a game or pick up where you left off.</p></div><button className="game-new" type="button" onClick={startGame}><Icon name="plus" size={17} />New Game</button></div>
    {saveError && <p role="alert" className="game-save-error">Your browser could not save your games. Keep this page open to retain them.</p>}
    {games.length ? <div className="game-list">{games.map(item => <button type="button" className="game-list-card" key={item.id} aria-label={'Open ' + item.name} onClick={() => onOpen(item.id)}>
      <span className="game-list-title"><Icon name="game" size={22} /><strong>{item.name}</strong><span className={item.ended ? 'game-badge final' : 'game-badge'}>{item.ended ? 'Final' : 'In progress'}</span></span>
      <span className="game-list-score"><span>Home <strong>{item.home}</strong></span><span>Away <strong>{item.away}</strong></span></span>
      <span className="game-list-date">{new Date(item.createdAt).toLocaleString()}</span>
      <span className="game-list-open">{item.ended ? 'View final score' : 'Continue game'} <Icon name="chevronRight" size={13} /></span>
    </button>)}</div> : <div className="game-list-empty"><Icon name="game" size={46} /><h3>No games yet</h3><p>Start your first game to keep score.</p></div>}
  </main>
  if (!game) return <main className="game-panel"><h2>Game not found</h2><p>This game is not saved in this browser.</p><button className="game-back" type="button" onClick={onBack}>Back to Games</button></main>
  return <main className="game-panel" aria-label="Game scorekeeper">
    <div className="game-tracker-heading"><button className="game-back" type="button" onClick={onBack}><Icon name="chevronLeft" size={14} />Back to Games</button><h2>{game.name}</h2></div>
    <div className="game-status" role="status">{game.ended ? 'FINAL SCORE' : 'GAME IN PROGRESS'}</div>
    <div className="game-scoreboard">
      {['home', 'away'].map(side => <section className={`game-team game-${side}`} key={side} aria-label={`${side === 'home' ? 'Home' : 'Away'} team`}>
        <h2>{side === 'home' ? 'Home' : 'Away'}</h2>
        <output className="game-score" aria-label={`${side === 'home' ? 'Home' : 'Away'} score`} aria-live="polite">{game[side]}</output>
        <div className="game-score-controls">
          <button type="button" aria-label={`Decrease ${side} score`} disabled={game.ended || game[side] === 0} onClick={() => adjust(side, -1)}>-</button>
          <button type="button" aria-label={`Increase ${side} score`} disabled={game.ended || game[side] === 999} onClick={() => adjust(side, 1)}>+</button>
        </div>
      </section>)}
    </div>
    {game.ended && <p className="game-result">{game.home === game.away ? 'The game ended in a tie.' : `${game.home > game.away ? 'Home' : 'Away'} wins!`}</p>}
    {saveError && <p role="alert" className="game-save-error">Your browser could not save this score. Keep this page open to retain it.</p>}
    <div className="game-actions">
      <button type="button" className="game-restart" onClick={() => setConfirmation('restart')}>Restart Game</button>
      <button type="button" className="game-end" disabled={game.ended} onClick={() => setConfirmation('end')}><Icon name="finish" size={22} />{game.ended ? 'Game ended' : 'End Game'}</button>
    </div>
    {confirmation && <Modal className="game-confirm" title={confirmation === 'restart' ? 'Restart game?' : 'End game?'} iconName="game" onClose={() => setConfirmation(null)}>
      <p>{confirmation === 'restart' ? 'Both scores will return to zero and a new game will begin.' : `Finish this game with a score of ${game.home} to ${game.away}?`}</p>
      <button type="button" className="game-confirm-action" onClick={confirm}>{confirmation === 'restart' ? 'Restart Game' : 'End Game'}</button>
      <button type="button" className="game-confirm-cancel" onClick={() => setConfirmation(null)}>Cancel</button>
    </Modal>}
  </main>
}
