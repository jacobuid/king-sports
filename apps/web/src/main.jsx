import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider, SignIn, SignUp, ForgotPassword, ProfileMenu, useAuth } from '@jacobuid/king-auth'
import { TeamEdit } from './TeamEdit'
import { TeamView } from './TeamView'
import { TeamsPage } from './TeamsPage'
import { GamePage } from './GamePage'
import { Icon } from './ui'
import { AppLoadingProvider, StartupReady, useAppLoading } from './LoadingScreen'
import './style.css'
import './theme.css'
import './zoom.css'
import './music-drawer.css'
import './teams-page.css'
import './swipe-delete.css'
import './responsive.css'
import './game.css'

function Header({ account, game = false, gameList = false }) {
  return <header className="hero">
    <img className="hero-background" src={`${import.meta.env.BASE_URL}hero-background.png`} alt="" fetchPriority="high" />
    <div className="top">
      <img className="hero-logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="KingSports" width="160" height="146" />
      {account && <div className="hero-account">{account}</div>}
    </div>
    <div className="intro">
      <div className="eyebrow">{game ? 'GAME TRACKER' : 'YOUR LINEUP STARTS HERE'}</div>
      {gameList ? <h1>Game</h1> : <h1>{game ? 'Track the' : 'Create your'}<br /><em>{game ? 'Game Score' : 'team.'}</em></h1>}
      <p>{gameList ? <>Create a new game or view past games<br />and final scores.</> : game ? <>Quick and simple scorekeeping<br />for your team.</> : <>Build your roster. Give every player<br />their own walk-up music.</>}</p>
    </div>
  </header>
}
function App() {
  const { user } = useAuth()
  const { navigate } = useAppLoading()
  const getRoute = () => {
    const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
    if (parts[0] === 'game') return { page: 'game', gameId: parts[1] || null, teamId: null, key: parts[1] ? 'game/' + parts[1] : 'game' }
    if (parts[0] === 'team' && parts[1] === 'new') return { page: 'edit', teamId: null, key: 'team/new' }
    if (parts[0] === 'team' && parts[1]) return { page: parts[2] === 'edit' ? 'edit' : 'view', teamId: parts[1], key: `team/${parts[1]}${parts[2] === 'edit' ? '/edit' : ''}` }
    return { page: 'teams', teamId: null, key: 'teams' }
  }
  const [route, setRoute] = useState(getRoute)
  const routeRef = useRef(route.key)
  const dirty = useRef(false)
  const saving = useRef(false)
  const onDirtyChange = useCallback(value => { dirty.current = value }, [])
  const onSavingChange = useCallback(value => { saving.current = value }, [])
  function canLeave() {
    if (saving.current) { window.alert('Your team is saving. Please wait.'); return false }
    return !dirty.current || window.confirm('Leave without saving your team changes?')
  }
  useEffect(() => {
    const change = () => {
      const next = getRoute()
      if (next.key !== routeRef.current && !canLeave()) {
        window.history.replaceState(null, '', `#/${routeRef.current}`)
        return
      }
      routeRef.current = next.key
      setRoute(next)
    }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  function go(href) {
    const nextKey = href.replace(/^#\//, '')
    if (nextKey !== routeRef.current && !canLeave()) return
    // The route listener must not ask twice after a confirmed departure.
    if (nextKey !== routeRef.current) dirty.current = false
    navigate(href)
  }
  if (!user) return null
  const content = route.page === 'game'
    ? <GamePage key={user.id} userId={user.id} gameId={route.gameId} onOpen={id => go('#/game/' + id)} onBack={() => go('#/game')} />
    : route.page === 'teams'
    ? <TeamsPage key={`teams-${user.id}`} onSelect={id => go(`#/team/${id}`)} onAdd={() => go('#/team/new')} />
    : route.page === 'edit'
      ? <TeamEdit key={`edit-${route.teamId || 'new'}`} userId={user.id} teamId={route.teamId} onDirtyChange={onDirtyChange} onSavingChange={onSavingChange} onSaved={saved => go(`#/team/${saved.id}`)} onCancel={() => go(route.teamId ? `#/team/${route.teamId}` : '#/teams')} />
      : <TeamView key={`view-${route.teamId}`} userId={user.id} teamId={route.teamId} onEdit={() => go(`#/team/${route.teamId}/edit`)} />
  return <div className={`app ${route.page === 'view' || route.page === 'teams' ? 'team-view-app' : ''}`}>
    <Header game={route.page === 'game'} gameList={route.page === 'game' && !route.gameId} account={<ProfileMenu accountClassName="sports-account" />} />
    {content}
    <footer className="site-footer">&copy; {new Date().getFullYear()} King Family Ranch, LLC</footer>
    <nav className="bottom-nav" aria-label="Main menu" onClick={event => {
      const link = event.target.closest('a[href]')
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const href = link.getAttribute('href')
      if (!href.startsWith('#/')) return
      event.preventDefault()
      go(href)
    }}><a className={`nav-item ${route.page !== 'game' ? 'active' : ''}`} href="#/teams" aria-current={route.page !== 'game' ? 'page' : undefined}><Icon /><span>Teams</span></a><a className={`nav-item ${route.page === 'game' ? 'active' : ''}`} href="#/game" aria-current={route.page === 'game' ? 'page' : undefined}><Icon name="game" /><span>Game</span></a></nav>
  </div>
}
function Welcome() {
  const [form, setForm] = useState('signin')
  const activeTab = form === 'signup' ? 'signup' : 'signin'
  const heading = form === 'signup' ? 'Join the clubhouse.' : form === 'reset' ? 'Forgot your password?' : 'Welcome back.'
  function changeTab(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 'signin' : event.key === 'End' ? 'signup' : activeTab === 'signin' ? 'signup' : 'signin'
    setForm(next)
    document.getElementById('auth-tab-' + next)?.focus()
  }
  return <div className="app welcome">
    <img className="welcome-background" src={`${import.meta.env.BASE_URL}hero-background.png`} alt="" fetchPriority="high" />
    <header className="welcome-brand"><img src={`${import.meta.env.BASE_URL}logo.png`} alt="KingSports" width="160" height="146" /></header>
    <main className="welcome-panel">
      <div className="welcome-intro">
        <p className="welcome-eyebrow">YOUR LINEUP STARTS HERE</p>
        <h1>Your team<br />starts here.</h1>
        <p className="welcome-copy">Sign in to create your roster and give every player their own walk-up music.</p>
      </div>
      <section className="auth-card" aria-labelledby="auth-heading">
        <div className="auth-tabs" role="tablist" aria-label="Account access" onKeyDown={changeTab}>
          <button id="auth-tab-signin" type="button" role="tab" aria-selected={activeTab === 'signin'} aria-controls="auth-panel" tabIndex={activeTab === 'signin' ? 0 : -1} onClick={() => setForm('signin')}>Sign in</button>
          <button id="auth-tab-signup" type="button" role="tab" aria-selected={activeTab === 'signup'} aria-controls="auth-panel" tabIndex={activeTab === 'signup' ? 0 : -1} onClick={() => setForm('signup')}>Create account</button>
        </div>
        <div id="auth-panel" role="tabpanel" aria-labelledby={'auth-tab-' + activeTab}>
          <h2 id="auth-heading">{heading}</h2>
          <p className="auth-description">{form === 'signup' ? 'Create your KingSports account and get your team ready.' : form === 'reset' ? 'We’ll help you get back to your team.' : 'Sign in to KingSports. Your team is waiting.'}</p>
          <div key={form} className="auth-form-content">
            {form === 'signin' ? <SignIn /> : form === 'signup' ? <SignUp /> : <ForgotPassword />}
          </div>
          {form !== 'signup' && <button type="button" className="auth-text-link" onClick={() => setForm(form === 'reset' ? 'signin' : 'reset')}>{form === 'reset' ? 'Back to sign in' : 'Forgot your password?'}</button>}
        </div>
        <footer className="auth-footer">Secure sign-in by KingAuth</footer>
      </section>
    </main>
  </div>
}
function AuthenticatedApp() {
  const { isLoading, isSignedIn } = useAuth()
  if (isLoading) return null
  return <><StartupReady />{isSignedIn ? <App /> : <Welcome />}</>
}
createRoot(document.getElementById('root')).render(<><AppLoadingProvider needsAuthentication><AuthProvider appName="KingSports" appPath={import.meta.env.BASE_URL}><AuthenticatedApp /></AuthProvider></AppLoadingProvider></>)
