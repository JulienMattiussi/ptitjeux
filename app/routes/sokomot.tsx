import { ChallengeListPage } from '~/components/ChallengeListPage'
import { getAllDates } from '~/games/sokomot/challenges'
import { findGame } from '~/lib/games-registry'
import { gameListMeta } from '~/lib/seo'

export function meta() {
  return gameListMeta('sokomot')
}

export default function SokomotIndex() {
  const game = findGame('sokomot')!
  return (
    <ChallengeListPage
      gameId="sokomot"
      title={game.name}
      tagline={game.tagline}
      description={game.description}
      dates={getAllDates()}
    />
  )
}
