export const gameSports = [
  ['Baseball', 'baseball.png'],
  ['Softball', 'softball.png'],
  ['Basketball', 'basketball.png'],
  ['Soccer', 'soccer.png'],
  ['Volleyball', 'volleyball.png'],
  ['Tennis', 'tennis.png'],
  ['Football', 'football.png'],
]

export function gameSportImage(sport) {
  return (gameSports.find(([name]) => name === sport) || gameSports[0])[1]
}
