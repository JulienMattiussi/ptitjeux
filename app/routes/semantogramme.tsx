import { ChallengeListPage } from '~/components/ChallengeListPage'
import { getAllDates } from '~/games/semantogramme/challenges'
import { findGame } from '~/lib/games-registry'
import { gameListMeta } from '~/lib/seo'

export function meta() {
  return gameListMeta('semantogramme')
}

export default function SemantogrammeIndex() {
  const game = findGame('semantogramme')!
  return (
    <ChallengeListPage
      gameId="semantogramme"
      title={game.name}
      tagline={game.tagline}
      description={game.description}
      dates={getAllDates()}
    />
  )
}
