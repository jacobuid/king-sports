import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@jacobuid/king-auth'
import { TeamView } from './TeamView'
import { createTeamApi } from './teamApi'
import { Icon } from './ui'

export function GameWorkspace({ game, score, userId, onRosterChange, children }) {
  const { getToken } = useAuth()
  const token = useRef(getToken)
  token.current = getToken
  const api = useMemo(() => createTeamApi(() => token.current()), [])
  const [tab, setTab] = useState('score')
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const positions = useRef({ score: 0, music: 0 })
  const scrollFrame = useRef(null)
  const rosterId = game.musicTeamId || (game.ourSide === 'away' ? game.awayTeamId : game.homeTeamId) || ''
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    api.list().then(items => { if (active) setTeams(items) }).catch(() => { if (active) setError('Could not load saved rosters.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [api, retry])
  useEffect(() => () => cancelAnimationFrame(scrollFrame.current), [])
  function switchTab(next) {
    if (next === tab) return
    positions.current[tab] = window.scrollY
    setTab(next)
    cancelAnimationFrame(scrollFrame.current)
    scrollFrame.current = requestAnimationFrame(() => window.scrollTo({ top: positions.current[next], behavior: 'instant' }))
  }
  function keyboardTab(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 'score' : event.key === 'End' ? 'music' : tab === 'score' ? 'music' : 'score'
    switchTab(next)
    document.getElementById('game-tab-' + next)?.focus({ preventScroll: true })
  }
  const ownSide = game.ourSide === 'away' ? 'away' : 'home'
  const otherSide = ownSide === 'home' ? 'away' : 'home'
  const teamName = side => side === 'home' ? game.homeName || 'Home' : game.awayName || 'Visitor'
  return <div className="game-workspace">
    <div className="game-workspace-tabs" role="tablist" aria-label="Game workspace" onKeyDown={keyboardTab}>
      <button id="game-tab-score" type="button" role="tab" aria-selected={tab === 'score'} aria-controls="game-panel-score" tabIndex={tab === 'score' ? 0 : -1} onClick={() => switchTab('score')}><Icon name="game" size={19} />Score</button>
      <button id="game-tab-music" type="button" role="tab" aria-selected={tab === 'music'} aria-controls="game-panel-music" tabIndex={tab === 'music' ? 0 : -1} onClick={() => switchTab('music')}><Icon name="music" size={19} />Walk-up Music</button>
    </div>
    <div id="game-panel-score" role="tabpanel" aria-labelledby="game-tab-score" className="game-workspace-panel" hidden={tab !== 'score'}>{children}</div>
    <div id="game-panel-music" role="tabpanel" aria-labelledby="game-tab-music" className="game-workspace-panel" hidden={tab !== 'music'}>
      <div className="game-mini-score" aria-label="Current game score"><span title={teamName(ownSide)}>{teamName(ownSide)} <strong>{score[ownSide]}</strong></span><span title={teamName(otherSide)}>{teamName(otherSide)} <strong>{score[otherSide]}</strong></span></div>
      <div className="game-roster-picker"><label htmlFor="game-music-roster">Walk-up roster</label><select id="game-music-roster" value={rosterId} onChange={event => onRosterChange(event.target.value)}>
        <option value="" disabled>Choose a saved team</option>
        {rosterId && !teams.some(team => team.id === rosterId) && <option value={rosterId}>Selected roster</option>}
        {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
      </select>
      {loading && <p role="status">Loading saved rosters...</p>}
      {error && <p role="alert">{error} <button type="button" onClick={() => setRetry(current => current + 1)}>Retry</button></p>}
      {!loading && !error && !teams.length && <p>No saved rosters yet. Add a team and songs in Teams to use walk-up music.</p>}
      {!rosterId && teams.length > 0 && <p>Choose the roster to use for this game. Typed team names are kept on the scoreboard.</p>}
      </div>
      {rosterId && <TeamView key={rosterId} userId={userId} teamId={rosterId} embedded />}
    </div>
  </div>
}
