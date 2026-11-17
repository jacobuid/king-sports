import React, { useEffect, useRef, useState } from 'react'
import { Icon } from './ui'
import { SportIcon } from './SportIcon'

const revealWidth = 80
export function GameListRow({ item, result, label, activeId, onActivate, onOpen, onDelete }) {
  const row = useRef(null)
  const gesture = useRef(null)
  const suppressUntil = useRef(0)
  const [revealed, setRevealed] = useState(false)
  function position(offset, dragging = false) {
    row.current?.style.setProperty('--game-drag-x', `${offset}px`)
    row.current?.classList.toggle('game-dragging', dragging)
  }
  useEffect(() => {
    if (activeId !== item.id) { gesture.current = null; position(0); setRevealed(false) }
  }, [activeId, item.id])
  function finish(event, cancelled = false) {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    gesture.current = null
    if (!current.horizontal) return
    const recentVelocity = performance.now() - current.time < 100 ? current.velocity : 0
    const open = !cancelled && (current.offset >= revealWidth || (Math.abs(recentVelocity) > .35 ? recentVelocity > 0 : current.offset >= revealWidth / 2))
    position(open ? revealWidth : 0)
    setRevealed(open)
    suppressUntil.current = performance.now() + 300
    if (row.current?.hasPointerCapture(event.pointerId)) row.current.releasePointerCapture(event.pointerId)
  }
  return <div ref={row} className={`game-swipe-row${revealed ? ' game-revealed' : ''}`}
    onPointerDown={event => {
      if (!event.isPrimary || event.button !== 0 || event.target.closest('.game-delete-button')) return
      suppressUntil.current = 0
      gesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, origin: revealed ? revealWidth : 0, offset: revealed ? revealWidth : 0, lastX: event.clientX, time: performance.now(), velocity: 0, horizontal: false, vertical: false }
    }}
    onPointerMove={event => {
      const current = gesture.current
      if (!current || current.pointerId !== event.pointerId || current.vertical) return
      const dx = event.clientX - current.x, dy = event.clientY - current.y
      if (!current.horizontal) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return
        if (Math.abs(dy) >= Math.abs(dx)) { current.vertical = true; return }
        current.horizontal = true
        onActivate(item.id)
        row.current.setPointerCapture(event.pointerId)
      }
      event.preventDefault()
      const now = performance.now()
      current.velocity = (event.clientX - current.lastX) / Math.max(1, now - current.time)
      current.time = now; current.lastX = event.clientX
      const distance = Math.max(0, current.origin + dx)
      current.offset = distance > revealWidth ? revealWidth + Math.min(32, (distance - revealWidth) / 4) : distance
      position(current.offset, true)
    }}
    onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)}
    onLostPointerCapture={event => { if (event.target === event.currentTarget && gesture.current?.horizontal) finish(event, true) }}
    onClickCapture={event => { if (!event.target.closest('.game-delete-button') && performance.now() < suppressUntil.current) { event.preventDefault(); event.stopPropagation() } }}>
    <button type="button" className="game-delete-button" tabIndex={revealed ? 0 : -1} aria-hidden={!revealed} aria-label={'Delete ' + item.name} onClick={() => onDelete(item)}><Icon name="trash" size={20} /><span>Delete</span></button>
    <button type="button" className={'game-list-card result-' + result} aria-label={'Open ' + item.name + ', ' + label + ', Home ' + item.home + ', Away ' + item.away} aria-describedby="game-delete-hint" aria-keyshortcuts="Delete" onKeyDown={event => { if (event.key === 'Delete') { event.preventDefault(); onDelete(item) } }} onClick={() => { if (revealed) { position(0); setRevealed(false) } else onOpen(item.id) }}>
      <span className="game-list-icon game-sport-icon" role="img" aria-label={item.sport || 'Baseball'}><SportIcon sport={item.sport} /></span>
      <span className="game-list-info"><strong>{item.name}</strong><time className="game-list-date" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time><span className="game-list-result">{label}</span></span>
      <span className="game-list-totals"><strong>{item.awayName ? item.away : item.home} - {item.awayName ? item.home : item.away}</strong><span className={'game-badge ' + (item.ended ? 'final' : '')}>{item.ended ? 'Final' : 'Live'}</span></span>
    </button>
  </div>
}
