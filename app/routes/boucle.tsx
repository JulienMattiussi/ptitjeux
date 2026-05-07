import { ChallengeListPage } from '~/components/ChallengeListPage'
import { getAllDates } from '~/games/boucle/challenges'
import { findGame } from '~/lib/games-registry'

export default function BoucleIndex() {
  const game = findGame('boucle')!
  return (
    <ChallengeListPage
      gameId="boucle"
      title={game.name}
      tagline={game.tagline}
      description={game.description}
      dates={getAllDates()}
    />
  )
}
