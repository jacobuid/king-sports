import React, { useEffect, useRef, useState } from 'react'
import { Icon } from './ui'

const revealWidth = 80
export function SwipeDeleteRow({ id, name, activeId, onActivate, onOpen, onDelete, disabled = false, className = '', surfaceClassName, style, label, describedBy, children }) {
  const row = useRef(null)
  const gesture = useRef(null)
  const suppressUntil = useRef(0)
  const [revealed, setRevealed] = useState(false)
  function position(offset, dragging = false) {
    row.current?.style.setProperty('--swipe-delete-x', `${offset}px`)
    row.current?.classList.toggle('swipe-delete-dragging', dragging)
  }
  useEffect(() => {
    if (activeId !== id) { gesture.current = null; position(0); setRevealed(false) }
  }, [activeId, id])
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
  return <div ref={row} className={`swipe-delete-row ${className}${revealed ? ' swipe-delete-revealed' : ''}`} style={style}
    onPointerDown={event => {
      if (disabled || !event.isPrimary || event.button !== 0 || event.target.closest('.swipe-delete-button')) return
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
        onActivate(id)
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
    onClickCapture={event => { if (!event.target.closest('.swipe-delete-button') && performance.now() < suppressUntil.current) { event.preventDefault(); event.stopPropagation() } }}>
    <button type="button" className="swipe-delete-button" disabled={disabled} tabIndex={revealed ? 0 : -1} aria-hidden={!revealed} aria-label={'Delete ' + name} onClick={() => onDelete()}><Icon name="trash" size={20} /><span>Delete</span></button>
    <button type="button" disabled={disabled} className={'swipe-delete-surface ' + surfaceClassName} aria-label={label} aria-describedby={describedBy} aria-keyshortcuts="Delete" onKeyDown={event => { if (event.key === 'Delete') { event.preventDefault(); onDelete() } }} onClick={() => { if (revealed) { position(0); setRevealed(false) } else onOpen() }}>
      {children}
    </button>
  </div>
}
