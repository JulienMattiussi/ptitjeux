import { ChallengeListPage } from '~/components/ChallengeListPage'
import { getAllDates } from '~/games/anglemort/challenges'
import { findGame } from '~/lib/games-registry'

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
