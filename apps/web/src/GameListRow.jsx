import React from 'react'
import { Icon } from './ui'
import { SportIcon } from './SportIcon'
import { SwipeDeleteRow } from './SwipeDeleteRow'

export function GameListRow({ item, result, label, activeId, onActivate, onOpen, onDelete }) {
  return <SwipeDeleteRow id={item.id} name={item.name} activeId={activeId} onActivate={onActivate} onOpen={() => onOpen(item.id)} onDelete={() => onDelete(item)} className="game-swipe-row" surfaceClassName={'game-list-card result-' + result} label={'Open ' + item.name + ', ' + label + ', Home ' + item.home + ', Away ' + item.away} describedBy="game-delete-hint">
      <span className="game-list-icon game-sport-icon" role="img" aria-label={item.sport || 'Baseball'}><SportIcon sport={item.sport} /></span>
      <span className="game-list-info"><strong>{item.name}</strong><time className="game-list-date" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time><span className="game-list-result">{label}</span></span>
      <span className="game-list-totals"><strong>{item.awayName ? item.away : item.home} - {item.awayName ? item.home : item.away}</strong><span className={'game-badge ' + (item.ended ? 'final' : '')}>{item.ended ? 'Final' : 'Live'}</span></span>
  </SwipeDeleteRow>
}
