import React from 'react'
import { gameSportImage } from './gameSports'

export function SportIcon({ sport }) {
  return <img className="sport-ball-image" src={`${import.meta.env.BASE_URL}sports/${gameSportImage(sport)}`} alt="" aria-hidden="true" draggable={false} />
}
