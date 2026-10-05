import { ChallengeListPage } from '~/components/ChallengeListPage'
import { gameListMeta } from '~/lib/seo'

export function meta() {
  return gameListMeta('boucle')
}

export default function BoucleIndex() {
  return <ChallengeListPage gameId="boucle" />
}
