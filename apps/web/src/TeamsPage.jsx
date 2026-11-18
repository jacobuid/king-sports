import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@jacobuid/king-auth'
import { createTeamApi } from './teamApi'
import { Icon, Modal } from './ui'
import { SwipeDeleteRow } from './SwipeDeleteRow'

export function TeamsPage({ onSelect, onAdd }) {
  const { getToken } = useAuth()
  const api = useMemo(() => createTeamApi(getToken), [getToken])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [activeSwipe, setActiveSwipe] = useState(null)
  function cancelDelete() { if (!busy) { setDeleting(null); setActiveSwipe(null) } }

  useEffect(() => {
    let active = true
    api.list().then(value => { if (active) setTeams(value) }).catch(error => { if (active) setError(error.message || 'Could not load your teams.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [api])

  async function removeTeam() {
    setBusy(true); setError('')
    try {
      await api.remove(deleting.id)
      setTeams(current => current.filter(team => team.id !== deleting.id))
      setDeleting(null)
      setActiveSwipe(null)
    } catch (error) { setError(error.message || 'Could not delete this team.') }
    finally { setBusy(false) }
  }

  return <>
    <main className="teams-page">
      <div className="teams-heading"><div><span>YOUR CLUBHOUSE</span><h2>Teams</h2><p>Select a team to view its roster and playlist.</p></div><button className="teams-add" onClick={onAdd}><Icon name="plus" size={18} /><span>Add team</span></button></div>
      <p id="team-delete-hint" className="sr-only">Swipe right or press Delete on a team to delete it.</p>
      {error && <p className="teams-error" role="alert">{error}</p>}
      {loading ? <div className="teams-empty" role="status">Loading your teams…</div> : teams.length ? <div className="teams-list">{teams.map(team => {
        return <SwipeDeleteRow key={team.id} id={team.id} name={team.name} activeId={activeSwipe} onActivate={setActiveSwipe} onOpen={() => onSelect(team.id)} onDelete={() => setDeleting(team)} disabled={busy} className="team-swipe-row" surfaceClassName="team-list-card team-list-select" style={{ '--team-color': team.primaryColor || '#041c36' }} label={'Open ' + team.name} describedBy="team-delete-hint">
          <span className="team-list-logo">{team.logoUrl ? <img src={team.logoUrl} alt="" draggable={false} /> : <Icon name="team" size={25} />}</span><span className="team-list-details"><strong>{team.name}</strong><small>{team.division ? team.division.toLowerCase() : 'Division not set'} - {team.playerCount} {Number(team.playerCount) === 1 ? 'player' : 'players'}</small></span><Icon name="chevronRight" size={16} />
        </SwipeDeleteRow>
      })}</div> : <div className="teams-empty"><span><Icon name="peopleGroup" size={54} /></span><h3>No teams yet</h3><p>Create your first team to start building a roster.</p><button className="button-primary" onClick={onAdd}><Icon name="plus" size={17} />Create a team</button></div>}
    </main>
    {deleting && <Modal title="Delete team?" iconName="trash" onClose={cancelDelete} className="delete-team-dialog"><p><strong>{deleting.name}</strong> and its roster and playlist will be removed. Songs in Your Music will stay in your account.</p><button className="delete-team-confirm" disabled={busy} onClick={removeTeam}>{busy ? 'Deleting…' : 'Delete team'}</button><button className="team-cancel button-secondary" disabled={busy} onClick={cancelDelete}>Cancel</button></Modal>}
  </>
}
