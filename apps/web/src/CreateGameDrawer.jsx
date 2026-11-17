import React, { useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '@jacobuid/king-auth'
import { createTeamApi } from './teamApi'
import { Icon } from './ui'
import { gameSports } from './gameSports'
import { SportIcon } from './SportIcon'

function TeamInput({ label, value, onChange, teams }) {
  const id = useId()
  const root = useRef(null)
  const input = useRef(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [showAll, setShowAll] = useState(false)
  const options = teams.filter(team => showAll || team.name.toLowerCase().includes(value.toLowerCase()))
  useEffect(() => { if (open && active >= 0) root.current?.querySelectorAll('[role=option]')[active]?.scrollIntoView({ block: 'nearest' }) }, [active, open])
  function choose(team) { onChange(team.name); input.current.focus(); setOpen(false); setActive(-1) }
  return <div className="game-team-input" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActive(-1) } }}>
    <label htmlFor={id}>{label}</label>
    <div className="game-combo-control"><Icon name="team" size={20} />
      <input ref={input} id={id} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={id + '-options'} aria-activedescendant={open && active >= 0 && options[active] ? id + '-option-' + active : undefined} autoComplete="off" value={value} required maxLength={48} placeholder="Select or type a team name" onFocus={() => { setOpen(true); setShowAll(true) }} onChange={event => { onChange(event.target.value); setOpen(true); setShowAll(false); setActive(-1) }} onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); setActive(current => options.length ? (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length : -1) }
        if (event.key === 'Enter' && open && options[active]) { event.preventDefault(); choose(options[active]) }
        if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false) }
      }} />
      <button type="button" aria-label={'Show saved teams for ' + label.toLowerCase()} aria-expanded={open} onClick={() => { setShowAll(true); setOpen(current => !current); setActive(-1) }}><Icon name="chevronDown" size={16} /></button>
    </div>
    {open && <ul id={id + '-options'} className="game-team-options" role="listbox" aria-label={label + ' saved teams'}>
      {options.map((team, index) => <li id={id + '-option-' + index} role="option" aria-selected={active === index} key={team.id} onPointerDown={event => event.preventDefault()} onClick={() => choose(team)}><Icon name="team" size={16} />{team.name}</li>)}
      {!options.length && <li role="presentation">{value.trim() ? 'Use your typed team name.' : 'No saved teams. Type a name above.'}</li>}
    </ul>}
  </div>
}

export function CreateGameDrawer({ onClose, onStart }) {
  const { getToken } = useAuth()
  const token = useRef(getToken)
  token.current = getToken
  const dialog = useRef(null)
  const title = useId()
  const [teams, setTeams] = useState([])
  const [away, setAway] = useState('')
  const [home, setHome] = useState('')
  const [ourSide, setOurSide] = useState('')
  const [sport, setSport] = useState('Baseball')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    const previous = document.activeElement
    dialog.current.showModal()
    const element = dialog.current
    return () => { element.close(); if (previous?.isConnected) previous.focus() }
  }, [])
  useEffect(() => {
    let active = true
    createTeamApi(() => token.current()).list().then(items => { if (active) { setTeams(items); setAway(current => current || items[0]?.name || '') } }).catch(() => { if (active) setLoadError('Saved teams could not be loaded. You can still type both team names.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  function submit(event) {
    event.preventDefault()
    const awayName = away.trim(), homeName = home.trim()
    if (!awayName || !homeName) { setError('Enter both team names.'); return }
    if (awayName.toLowerCase() === homeName.toLowerCase()) { setError('Choose two different teams.'); return }
    if (!ourSide) { setError('Choose whether we are the home or visitor team.'); return }
    const find = name => teams.find(team => team.name.toLowerCase() === name.toLowerCase())?.id || null
    const awayTeamId = find(awayName), homeTeamId = find(homeName)
    onStart({ awayName, homeName, awayTeamId, homeTeamId, sport, ourSide })
  }
  return <dialog ref={dialog} className="create-game-drawer" aria-labelledby={title} onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="create-game-handle" aria-hidden="true" />
    <header className="create-game-header"><div><h2 id={title}>Create Game</h2><p>Set up a new game and track the score.</p></div><button type="button" className="create-game-close" aria-label="Close create game" onClick={onClose}><Icon name="close" size={20} /></button></header>
    <form onSubmit={submit}>
      <fieldset className="game-sports"><legend>Sport</legend><div>{gameSports.map(([name]) => <label key={name} className={sport === name ? 'selected' : ''}><input type="radio" name="sport" value={name} checked={sport === name} onChange={() => setSport(name)} /><span aria-hidden="true"><SportIcon sport={name} /></span><strong>{name}</strong></label>)}</div></fieldset>
      <section className="create-game-teams" aria-labelledby={title + '-teams'}><h3 id={title + '-teams'}>Teams</h3>
        {loading && <p role="status">Loading saved teams...</p>}
        {loadError && <p role="status">{loadError}</p>}
        <TeamInput label="Visitor Team" value={away} onChange={setAway} teams={teams} />
        <TeamInput label="Home Team" value={home} onChange={setHome} teams={teams} />
      </section>
      <fieldset className="game-our-team"><legend>Which team is us?</legend><p>Wins and losses are counted for the team you choose.</p><div>
        <label className={ourSide === 'home' ? 'selected' : ''}><input type="radio" name="ourSide" value="home" required checked={ourSide === 'home'} onChange={() => setOurSide('home')} /><span><strong>Home</strong><small>{home.trim() || 'Home Team'}</small></span></label>
        <label className={ourSide === 'away' ? 'selected' : ''}><input type="radio" name="ourSide" value="away" required checked={ourSide === 'away'} onChange={() => setOurSide('away')} /><span><strong>Visitor</strong><small>{away.trim() || 'Visitor Team'}</small></span></label>
      </div></fieldset>
      {error && <p className="create-game-error" role="alert">{error}</p>}
      <div className="create-game-actions"><button type="submit" className="game-new"><Icon name="plus" size={22} />Start Game</button><button type="button" className="create-game-cancel button-secondary" onClick={onClose}>Cancel</button></div>
    </form>
  </dialog>
}
