import { ChallengeListPage } from '~/components/ChallengeListPage'
import { gameListMeta } from '~/lib/seo'

export function meta() {
  return gameListMeta('anglemort')
}

export default function AngleMortIndex() {
  return <ChallengeListPage gameId="anglemort" />
}
