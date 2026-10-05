import { ChallengeListPage } from '~/components/ChallengeListPage'
import { gameListMeta } from '~/lib/seo'

export function meta() {
  return gameListMeta('sokomot')
}

export default function SokomotIndex() {
  return <ChallengeListPage gameId="sokomot" />
}
