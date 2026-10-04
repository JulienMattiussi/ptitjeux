import { ChallengeListPage } from '~/components/ChallengeListPage'
import { getAllDates } from '~/games/boucle/challenges'
import { findGame } from '~/lib/games-registry'
import { gameListMeta } from '~/lib/seo'

export function meta() {
  return gameListMeta('boucle')
}

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
