import { ChallengeListPage } from '~/components/ChallengeListPage'
import { gameListMeta } from '~/lib/seo'

export function meta() {
  return gameListMeta('semantogramme')
}

export default function SemantogrammeIndex() {
  return <ChallengeListPage gameId="semantogramme" />
}
