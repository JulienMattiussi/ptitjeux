import { ChallengeListPage } from '~/components/ChallengeListPage'
import { getAllDates } from '~/games/anglemort/challenges'
import { findGame } from '~/lib/games-registry'
import { gameListMeta } from '~/lib/seo'

export function meta() {
  return gameListMeta('anglemort')
}

export default function AngleMortIndex() {
  const game = findGame('anglemort')!
  return (
    <ChallengeListPage
      gameId="anglemort"
      title={game.name}
      tagline={game.tagline}
      description={game.description}
      dates={getAllDates()}
    />
  )
}
